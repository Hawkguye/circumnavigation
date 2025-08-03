let currentFlightController = null;
let timeoutId;
let isTimeoutAbort = false;
// Global variables to store current flight search state for refreshing
let currentFlightsData = null;
let currentAvgFlightPrice = 0;
let currentNextDay = false;
let currentFlightDate = '';

async function searchFlight(nextDay) {
    if (routeDistance <= 200) {
        // skip searching
        $("#flight-results").html(`
            <h6 style="text-align: center;">No flights found.</h6>
            <div class="container text-center justify-content-center">
                <button type="button" class="btn btn-sm btn-outline-primary" onclick="groundConfirm()">Ground transportation?</button>
            </div>
        `);
        return;
    }
    clickAllowed = false;
    $("#search-spinner").show();

    try {
        const dateNow = localTime.toISOString().split('T')[0];
        const dateNext = new Date(localTime.getTime() + 86400000).toISOString().split('T')[0];
        let avgFlightPrice = 0, flightNum = 0;
        let flights = [];

        // Abort any existing request
        if (currentFlightController) {
            currentFlightController.abort();
        }
        currentFlightController = new AbortController();
        isTimeoutAbort = false;
        timeoutId = setTimeout(() => {
            isTimeoutAbort = true;
            currentFlightController.abort("timeout");
        }, 12000); // 12 second timeout

        const response = await fetch(`${FLIGHT_URL}get_flight?org=${origin_iata}&dest=${dest_iata}&date=${dateNow}`, {
            signal: currentFlightController.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            $("#flight-title").html('');
            $("#flight-meta").html('');
            $("#flight-info").html('');
            $("#flight-results").html('<h6 style="text-align: center;">Error fetching flight data. <span class="clickable-text text-info" onclick="selectAirport()">Try again</span></h6>');
            $("#search-spinner").hide();
            if (randomFlightChallenge) {
                startRandomFlight();
                return;
            }
            clickAllowed = true;
            return;
        }
        
        const json = await response.json();
        const data = await json.flights;
        console.log(json);

        data.forEach(flight => {
            const existingFlight = flights.find(existing => existing.Departure === flight.Departure && existing.Arrival === flight.Arrival && existing.Price === flight.Price);
            if (!existingFlight){
                flights.push(flight);
                if (flight.Price !== 0) {
                    avgFlightPrice += flight.Price;
                    flightNum++;
                }
            }
        });

        let flightDate;

        if (nextDay) {
            const response2 = await fetch(`${FLIGHT_URL}get_flight?org=${origin_iata}&dest=${dest_iata}&date=${dateNext}`);
            const json2 = await response2.json();
            const data2 = await json2.flights;
            console.log(json2);
            data2.forEach(flight => {
                const existingFlight = flights.find(existing => existing.Departure === flight.Departure && existing.Arrival === flight.Arrival && existing.Price === flight.Price);
                if (!existingFlight){
                    flights.push(flight);
                    if (flight.Price !== 0) {
                        avgFlightPrice += flight.Price;
                        flightNum++;
                    }
                }
            });
            displayFlightDataDate(Math.max(json.dateCreated, json2.dateCreated));
            flightDate = json2.flightDate;
        }
        else {
            displayFlightDataDate(json.dateCreated);
            flightDate = json.flightDate;
        }

        if (flightNum !== 0) {
            avgFlightPrice /= flightNum;
        }

        displayFlights(flights, Math.round(avgFlightPrice), nextDay, flightDate);


    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error fetching flight data:', error);
        $("#flight-title").html('');
        $("#flight-meta").html('');
        $("#flight-info").html('');
        if (isTimeoutAbort) {
            $("#flight-results").html('<h6 style="text-align: center;">Flight Search Timed Out. <span class="clickable-text text-info" onclick="selectAirport()">Try again</span></h6>');
        }
        else if (error.name === "AbortError"){
            // else {
                // $("#flight-results").html('<h6 style="text-align: center;">Flight Search Interrupted. Try again.</h6>');
            // }
        }
        else {
            $("#flight-results").html('<h6 style="text-align: center;">Error fetching flight data. <span class="clickable-text text-info" onclick="selectAirport()">Try again</span></h6>');
        }
        $("#search-spinner").hide();
        clickAllowed = true;
        if (randomFlightChallenge) {
            startRandomFlight();
            return;
        }
    }
}

function searchNextDayFlight(){
    $("#flight-title").html('');
    $("#flight-meta").html('');
    $("#flight-info").html('');
    $("#flight-results").html('');
    searchFlight(true);
}

function displayFlightDataDate(timestamp){
    $("#flight-meta").show().html(`
        <small>Data fetched: ${new Date(timestamp).toISOString()}</small>
        <small class="text-end">Booking closes <b>60 mins</b> before takeoff.</small>
    `);
}

function displayFlightTitle(date, flights_cnt){
    $("#flight-title").html(`<h5 class="mb-0"><b>${flights_cnt}</b> flights available from <b>${origin_iata}</b> to <b>${dest_iata}</b> for <b>${date}</b>:</h5> <small>(flights are searched directly from Google Flights)</small>`);
}

function displayFlights(flightsData, avgFlightPrice, nextDay, flightDate){
    // Store current flight data for refreshing
    currentFlightsData = flightsData;
    currentAvgFlightPrice = avgFlightPrice;
    currentNextDay = nextDay;
    currentFlightDate = flightDate;
    
    if (randomFlightChallenge) {
        clickAllowed = false;
    }
    clickAllowed = true;

    // console.log(flightsData);
    $("#flight-results").html('');
    flightsInfoArr = [];

    if (flightsData && flightsData.length > 0) {
        flightsData.sort((a, b) => {
            return a.Departure - b.Departure;
        });

        var origin_timezone = getTimezoneOffset(origin_iata);
        var dest_timezone = getTimezoneOffset(dest_iata);

        var flightInfoEl = document.createElement('tr');
        flightInfoEl.classList.add('table-info');
        flightInfoEl.innerHTML = `
            <td>Departure</td>
            <td>Arrival</td>
            <td>Duration</td>
            <td>Airline</td>
            <td>Price</td>
            <td>Takeoff In</td>
            <td>Action</td>
        `;
        $("#search-spinner").hide();
        $("#flight-info").append(flightInfoEl);

        var arrayIndex = 0;

        flightsData.forEach((flight) => {
            // var priceCalculated = false;

            flight.departUTC = new Date(flight.Departure - origin_timezone * 1000).getTime();
            flight.arrivalUTC = new Date(flight.Arrival - dest_timezone * 1000).getTime();
            

            var flightElement = document.createElement('tr');
            // flightElement.classList.add('table');
            if (flight.Price == 0){
                if (avgFlightPrice != 0){
                    flight.Price = avgFlightPrice;
                }
                else flight.Price = Math.round(routeDistance * PRICE_PER_KM);
                // priceCalculated = true
                console.log(`${flight.Airline} price is calculated`);
            }

            if (flight.Departure > localTime.getTime() + 60*60000){ // no less than 1 hr prior to takeoff
                flightsInfoArr.push(flight);

                // Calculate minutes until takeoff
                const minutesUntilTakeoff = Math.floor((flight.Departure - localTime.getTime()) / 60000);

                flightElement.innerHTML = `
                    <td>
                        Local: <b>${toTimeFormat(new Date(flight.Departure))}</b>
                        <br>
                        UTC: ${toTimeFormat(new Date(flight.departUTC))}
                    </td>
                    <td>
                        Local: ${toTimeFormat(new Date(flight.Arrival))}
                        <br>
                        UTC: ${toTimeFormat(new Date(flight.arrivalUTC))}
                    </td>
                    <td>${flight.Duration}</td>
                    <td>${flight.Airline.split('Operate')[0]}</td>
                    <td>$${flight.Price}</td>
                    <td>${minutesUntilTakeoff} min</td>
                    <td><button class="btn btn-primary btn-sm book-flight" data-flight-id="${arrayIndex}">Book Now</button></td>
                `;
                $("#flight-results").append(flightElement);
                arrayIndex += 1;

                $('.book-flight').off('click').on('click', function() {
                    var flightId = $(this).data('flight-id');
                    bookFlightConfirm(flightsInfoArr[flightId]);
                });
            }
            else if (flightsData.length < 8 || localTime.getHours() > 18){
                flightElement.classList.add("table-danger");

                // Calculate minutes until takeoff (will be negative for past flights)
                const minutesUntilTakeoff = Math.floor((flight.Departure - localTime.getTime()) / 60000);

                flightElement.innerHTML = `
                    <td>
                        Local: <b>${toTimeFormat(new Date(flight.Departure))}</b>
                        <br>
                        UTC: ${toTimeFormat(new Date(flight.departUTC))}
                    </td>
                    <td>
                        Local: ${toTimeFormat(new Date(flight.Arrival))}
                        <br>
                        UTC: ${toTimeFormat(new Date(flight.arrivalUTC))}
                    </td>
                    <td>${flight.Duration}</td>
                    <td>${flight.Airline.split('Operate')[0]}</td>
                    <td>$${flight.Price}</td>
                    <td>${minutesUntilTakeoff <= 0 ? 'Departed' : minutesUntilTakeoff + ' min'}</td>
                    <td>${minutesUntilTakeoff > 0 ? 'Too late to book' : ''}</td>
                `;
                $("#flight-results").append(flightElement);
            }

        });

        displayFlightTitle(flightDate, arrayIndex);

        if (arrayIndex < 5 && !nextDay){
            // search next day
            var trElement = document.createElement('tr');
            trElement.innerHTML = `
                <td>
                    <span class="clickable-text book-flight" onclick="searchNextDayFlight()">Click to search flights for tomorrow</span>
                </td>
                <td>
                    <small>${flightsData.length} earlier flights found.</small>
                </td>
            `;
            $("#flight-results").append(trElement);

            if (arrayIndex == 0 && randomFlightChallenge) {
                searchNextDayFlight();
                return;
            }
        }

    }
    else {
        // no flights
        $("#flight-title").html('');
        $("#flight-meta").html('');
        $("#flight-info").html('');
        $("#flight-results").html('<h6 style="text-align: center;">No flights found.</h6>');
        $("#search-spinner").hide();
        if (randomFlightChallenge) {
            startRandomFlight();
            return;
        }
    }
    // console.log(flightsInfoArr);
    if (randomFlightChallenge) {
        flightsInfoArr[0].Price = 0;
        $("#confirm-cancel-button").prop('disabled', true);
        $("#confirm-modal .btn-close").prop('disabled', true);
        bookFlightConfirm(flightsInfoArr[0]);
        // $("#confirm-cancel-button").show();
    }
}

function bookFlightConfirm(flightInfo){
    var leaveTime = Math.floor((flightInfo.departUTC - gameTime.getTime()) / 60000)
    $("#confirm-modal").modal('show');
    $("#confirm-title").text(`Booking flight`)
    if (flightInfo.Price > budget) {
        $("#confirm-body").html(`
            <div class="alert alert-warning" role="alert">
                You don't have enough budget for this flight!
            </div>
            <b>${origin_iata}</b> -> <b>${dest_iata}</b>
            <br>Flight time: <b>${flightInfo.Duration}</b>
            <br>The price is <b>USD$${flightInfo.Price}</b>.
            <br>The current layover at <b>${origin_iata}</b> will be <b>${leaveTime}</b> minutes.
        `);
    }
    else {
        $("#confirm-body").html(`
            <b>${origin_iata}</b> -> <b>${dest_iata}</b>
            <br>Flight time: <b>${flightInfo.Duration}</b>
            <br>The price is <b>USD$${flightInfo.Price}</b>.
            <br>The current layover at <b>${origin_iata}</b> will be <b>${leaveTime}</b> minutes.
        `);
    }
    $("#confirm-button").off("click");
    $("#confirm-button").on("click", function() {
        bookFlight(flightInfo);
        if (randomFlightChallenge){
            $("#confirm-cancel-button").removeAttr('disabled');
            $("#confirm-modal .btn-close").removeAttr('disabled');
            finishRandomFlight();
        }
    });
    
}

const planeMarker = L.icon({
    iconUrl: `${imgDir}plane_icon.png`,
    iconSize: [50, 50],
    // iconAnchor: [23, 65],
});

function recordRoute(){
    // Calculate the longitudes that the shortest line between origin and destination crosses
    const [originLng, originLat] = origin_latlng;
    const [destLng, destLat] = dest_latlng;
    
    // Handle cases where the route crosses the dateline
    let lngDiff = destLng - originLng;
    
    // Normalize longitude difference for dateline crossing
    if (lngDiff > 180) {
        lngDiff -= 360;
    } else if (lngDiff < -180) {
        lngDiff += 360;
    }
    
    // Calculate the number of longitude degrees to check
    const numSteps = Math.max(Math.abs(lngDiff), 1);
    const lngStep = lngDiff / numSteps;
    
    // Check each longitude along the route
    for (let i = 0; i <= numSteps; i++) {
        const currentLng = originLng + (lngStep * i);
        const normalizedLng = ((currentLng + 180) % 360) - 180; // Normalize to [-180, 180]
        
        // Mark the longitude and adjacent longitudes as crossed
        const floorLng = Math.floor(normalizedLng);
        routeLngs[floorLng] = true;
        routeLngs[floorLng + 1] = true;
        routeLngs[floorLng - 1] = true;
    }
}

let skipFlightAnimation = false;
let flightCompleted = false;

function bookFlight(flightInfo) {
    $("#confirm-modal").modal('hide');

    if (flightInfo.Price > budget) {
        alert("Not enough budget!!!");
        return;
    }
    if (flightInfo.Departure < localTime.getTime() + 45 * 60000) {
        alert("Too late! Unable to book flight!");
        return;
    }

    clickAllowed = false;
    $("#reset-route").hide();
    skipFlightAnimation = false;
    flightCompleted = false;

    removeDestLines();

    $("#flight-title").html('');
    $("#flight-info").html('');
    $("#flight-results").html('');
    $("#flight-meta").html('');
    
    // Clear stored flight data since we're no longer displaying flights
    currentFlightsData = null;
    currentAvgFlightPrice = 0;
    currentNextDay = false;
    currentFlightDate = '';

    recordRoute();
    document.getElementById("map").scrollIntoView(false);

    let activeMarkers = [];

    const completeFlight = (info) => {
        if (flightCompleted) return;
        flightCompleted = true;

        activeMarkers.forEach(marker => map.removeLayer(marker));
        activeMarkers = [];

        $("#skip-animation").hide();
        afterFlight(info);
    };

    $("#skip-animation").show().off("click").on("click", () => {
        skipFlightAnimation = true;
        completeFlight(flightInfo);
    });

    const calculateBearing = (latlng1, latlng2) => {
        const toRad = deg => deg * Math.PI / 180;
        const toDeg = rad => rad * 180 / Math.PI;

        const dLon = toRad(latlng2.lng - latlng1.lng);
        const lat1 = toRad(latlng1.lat);
        const lat2 = toRad(latlng2.lat);

        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
                  Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        const bearing = Math.atan2(y, x);

        return (toDeg(bearing) + 360) % 360;
    };

    const createRotatingAnimatedMarker = (line, onEnd) => {
        const latlngs = line.getLatLngs();
        const marker = L.animatedMarker(latlngs, {
            icon: planeMarker,
            distance: 300000,
            interval: 500,
            onEnd: onEnd
        });

        // Store original method
        const originalSetLatLng = marker.setLatLng;

        // Override to add rotation
        marker.setLatLng = function (latlng) {
            if (this._latlng) {
                const bearing = calculateBearing(this._latlng, latlng);
                this.setRotationAngle(bearing);
                this.setRotationOrigin('center center');
            }
            return originalSetLatLng.call(this, latlng);
        };

        activeMarkers.push(marker);
        return marker;
    };

    if (greatCircleOriginalPolylines.length === 1) {
        const line = greatCircleOriginalPolylines[0];
        const marker = createRotatingAnimatedMarker(line, () => {
            if (!skipFlightAnimation) completeFlight(flightInfo);
        });

        map.addLayer(marker);
        map.fitBounds(line.getBounds());

    } else {
        const [part1, part2] = greatCircleOriginalPolylines;

        const marker1 = createRotatingAnimatedMarker(part1, () => {
            if (skipFlightAnimation) return;

            map.removeLayer(marker1);

            const marker2 = createRotatingAnimatedMarker(part2, () => {
                if (!skipFlightAnimation) completeFlight(flightInfo);
            });

            activeMarkers.push(marker2);
            map.addLayer(marker2);
            map.fitBounds(part2.getBounds());
        });

        map.addLayer(marker1);
        map.fitBounds(part1.getBounds());
    }
}


function afterFlight(flightInfo){
    // console.log("afterflight triggered");

    $("#skip-animation").hide();

    // if (flyDir == "") {
    //     flyDir = apEastWest(origin_iata, dest_iata);
    // }
    if (legsCount == 0){
        // first flight
        $("#previous-flights-container").show();
    }
    legsCount += 1;
    routeInfo.push(dest_iata);
    budget -= flightInfo.Price;
    moneySpent += flightInfo.Price;

    $("#money-left").text(`$${budget}`);

    var departTimestamp = new Date(flightInfo.departUTC).getTime();
    var arrivalTimestamp = new Date(flightInfo.arrivalUTC).getTime();

    var flightInfoEl = document.createElement('div');
    flightInfoEl.classList.add("accordion-item");
    flightInfoEl.innerHTML = `
        <h2 class="accordion-header" id="flush-heading${legsCount}">
            <button
                class="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#flush-collapse${legsCount}"
                aria-expanded="true"
                aria-controls="flush-collapse${legsCount}"
            >
                Flight #${legsCount}: ${origin_iata}-${dest_iata}
            </button>
        </h2>
        <div
            id="flush-collapse${legsCount}"
            class="accordion-collapse collapse"
            aria-labelledby="flush-heading${legsCount}"
            data-bs-parent="#previous-flights-container"
        >
            <div class="accordion-body">
                <ul class="list-group list-group-flush">
                    <li class="list-group-item">From: ${origin_iata}, ${origin_city}</li>
                    <li class="list-group-item">To: ${dest_iata}, ${dest_city}</li>
                    <li class="list-group-item">Departure Time: ${toTimeFormat(new Date(departTimestamp))} (UTC)</li>
                    <li class="list-group-item">Arrival Time: ${toTimeFormat(new Date(arrivalTimestamp))} (UTC)</li>
                    <li class="list-group-item">Airline: ${flightInfo.Airline}</li>
                    <li class="list-group-item">Airfare: $${flightInfo.Price}</li>
                    <li class="list-group-item">Distance: ${routeDistance}km</li>
                </ul>
            </div>
        </div>
    `;
    $("#previous-flights-container").append(flightInfoEl);

    arrivedNewCity(arrivalTimestamp);
}

function groundConfirm(){
    var duration = routeDistance / GROUND_TRANSPORT_SPEED; // minutes
    var price = routeDistance * GROUND_TRANSPORT_PRICE;

    $("#confirm-modal").modal('show');
    $("#confirm-title").html(`Taking Ground Transportation`)
    $("#confirm-body").html(`
    <b>${origin_iata}</b> -> <b>${dest_iata}</b>
    <br>It will take you <b>${duration}</b> minutes and <b>$${price}</b>.`);
    $("#confirm-button").off("click");
    $("#confirm-button").on("click", groundTransport);
}

function groundTransport(){
    clickAllowed = false;
    $("#confirm-modal").modal('hide');

    var duration = routeDistance / GROUND_TRANSPORT_SPEED; // minutes
    var price = routeDistance * GROUND_TRANSPORT_PRICE;

    if (price > budget) {
        alert("Not enough budget!!!");
        return;
    }

    if (legsCount == 0){
        $("#previous-flights-container").show();
    }
    legsCount += 1;
    routeInfo.push(dest_iata);
    // distanceCovered += routeDistance;
    moneySpent += price;
    budget -= price;

    // $("#distance-covered").text(`${distanceCovered} / ${CIRCUMDIST} km`);
    $("#money-left").text(`$${budget}`);

    var departTimestamp = gameTime.getTime();
    var arrivalTimestamp = departTimestamp + duration * 60000;

    // log info
    var flightInfoEl = document.createElement('div');
    flightInfoEl.classList.add("accordion-item");
    flightInfoEl.innerHTML = `
        <h2 class="accordion-header" id="flush-heading${legsCount}">
            <button
                class="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#flush-collapse${legsCount}"
                aria-expanded="true"
                aria-controls="flush-collapse${legsCount}"
            >
                Flight #${legsCount}: ${origin_iata}-${dest_iata}
            </button>
        </h2>
        <div
            id="flush-collapse${legsCount}"
            class="accordion-collapse collapse"
            aria-labelledby="flush-heading${legsCount}"
            data-bs-parent="#previous-flights-container"
        >
            <div class="accordion-body">
                <ul class="list-group list-group-flush">
                    <li class="list-group-item">Ground Transportation</li>
                    <li class="list-group-item">From: ${origin_iata}, ${origin_city}</li>
                    <li class="list-group-item">To: ${dest_iata}, ${dest_city}</li>
                    <li class="list-group-item">Departure Time: ${toTimeFormat(new Date(departTimestamp))} (UTC)</li>
                    <li class="list-group-item">Arrival Time: ${toTimeFormat(new Date(arrivalTimestamp))} (UTC)</li>
                    <li class="list-group-item">Fare: $${price}</li>
                    <li class="list-group-item">Distance: ${routeDistance}km</li>
                </ul>
            </div>
        </div>
    `;
    $("#previous-flights-container").append(flightInfoEl);

    removeDestLines();
    $("#flight-title").html('');
    $("#flight-info").html('');
    $("#flight-results").html('');
    $("#flight-meta").html('');
    
    // Clear stored flight data since we're no longer displaying flights
    currentFlightsData = null;
    currentAvgFlightPrice = 0;
    currentNextDay = false;
    currentFlightDate = '';

    arrivedNewCity(arrivalTimestamp);
}

function getTimezoneOffset(iata_code) {
    var apData = findApData(iata_code);
    return apData.timezone_offset;
}

// Function to refresh flight display when time updates
function refreshFlightDisplay() {
    // Check if flight table is visible and we have stored flight data
    if (currentFlightsData && ($("#flight-info").html() !== '' || $("#flight-results").html() !== '')) {
        // Clear the current display and re-render with updated time
        $("#flight-title").html('');
        $("#flight-info").html('');
        $("#flight-results").html('');
        displayFlights(currentFlightsData, currentAvgFlightPrice, currentNextDay, currentFlightDate);
    }
}