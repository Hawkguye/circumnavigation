let currentFlightController = null;
let timeoutId;
let isTimeoutAbort = false;
// Global variables to store current flight search state for refreshing
let currentFlightsData = null;
let currentAvgFlightPrice = 0;
let currentNextDay = false;
let currentFlightDate = '';

async function searchFlight(nextDay) {
    if (randomFlightChallenge && cursed_longhaul && routeDistance > 6000) {
        startRandomFlight();
        return;
    }
    if (routeDistance <= 200) {
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

        // abort any previous search
        if (currentFlightController) currentFlightController.abort();
        currentFlightController = new AbortController();

        const controller = currentFlightController;
        const response = await fetch(`${FLIGHT_URL}get_flight?org=${origin_iata}&dest=${dest_iata}&date=${dateNow}`, {
            signal: controller.signal
        });

        // ---------------------
        // Handle scraper queue
        // ---------------------
        if (response.status === 202) {
            const { job_id, status_url } = await response.json();
            // console.log("Scrape started, job id:", job_id);

            // poll every 2s until job done
            let dataReady = false, jobData = null;
            for (let i = 0; i < 40; i++) { // up to 40s
                await new Promise(r => setTimeout(r, 1000));
                const statusResp = await fetch(`${FLIGHT_URL}flight_status/${job_id}`);
                const statusJson = await statusResp.json();
                console.log("Job status:", statusJson.status);

                if (statusJson.status === "done") {
                    // fetch the actual file
                    const fileResp = await fetch(`${FLIGHT_URL}get_flight?org=${origin_iata}&dest=${dest_iata}&date=${dateNow}`);
                    jobData = await fileResp.json();
                    dataReady = true;
                    break;
                } else if (statusJson.status === "error") {
                    throw new Error(statusJson.error || "Scraper job failed");
                }
            }

            if (!dataReady) {
                throw new Error("Scraper timeout");
            }

            await handleFlightResponse(jobData, nextDay, dateNow, dateNext);
        }

        // ---------------------
        // Handle cached / fast scrape
        // ---------------------
        else if (response.ok) {
            const json = await response.json();
            await handleFlightResponse(json, nextDay, dateNow, dateNext);
        }

        // ---------------------
        // Handle error
        // ---------------------
        else {
            throw new Error("Failed to fetch flight data");
        }

    } catch (error) {
        console.error("Error fetching flight data:", error);
        $("#flight-title, #flight-meta, #flight-info").html('');
        $("#flight-results").html('<h6 style="text-align: center;">Error fetching flight data. <span class="clickable-text text-info" onclick="selectAirport()">Try again</span></h6>');
        $("#search-spinner").hide();
        clickAllowed = true;
        if (randomFlightChallenge) startRandomFlight();
    }
}

async function handleFlightResponse(json, nextDay, dateNow, dateNext) {
    let avgFlightPrice = 0, flightNum = 0;
    let flights = [];
    const data = json.flights || [];
    console.log(json)

    data.forEach(flight => {
        const exists = flights.find(f =>
            f.Departure === flight.Departure &&
            f.Arrival === flight.Arrival &&
            f.Price === flight.Price
        );
        if (!exists) {
            flights.push(flight);
            if (flight.Price !== 0) {
                avgFlightPrice += flight.Price;
                flightNum++;
            }
        }
    });

    if (nextDay) {
        const response2 = await fetch(`${FLIGHT_URL}get_flight?org=${origin_iata}&dest=${dest_iata}&date=${dateNext}`);
        let json2 = null;
        if (response2.status === 202) {
            const { job_id, status_url } = await response2.json();
            // console.log("Scrape (next day) started, job id:", job_id);
            let dataReady2 = false;
            for (let i = 0; i < 40; i++) {
                await new Promise(r => setTimeout(r, 1000));
                const statusResp2 = await fetch(`${FLIGHT_URL}flight_status/${job_id}`);
                const statusJson2 = await statusResp2.json();
                console.log("Next day job status:", statusJson2.status);
                if (statusJson2.status === "done") {
                    const fileResp2 = await fetch(`${FLIGHT_URL}get_flight?org=${origin_iata}&dest=${dest_iata}&date=${dateNext}`);
                    json2 = await fileResp2.json();
                    dataReady2 = true;
                    break;
                } else if (statusJson2.status === "error") {
                    throw new Error(statusJson2.error || "Scraper job (next day) failed");
                }
            }
            if (!dataReady2) throw new Error("Scraper timeout (next day)");
        } else if (response2.ok) {
            json2 = await response2.json();
        } else {
            throw new Error("Failed to fetch next day flight data");
        }

        if (json2) {
            console.log(json2);
            const data2 = json2.flights || [];
            data2.forEach(flight => {
                const exists = flights.find(f =>
                    f.Departure === flight.Departure &&
                    f.Arrival === flight.Arrival &&
                    f.Price === flight.Price
                );
                if (!exists) {
                    flights.push(flight);
                    if (flight.Price !== 0) {
                        avgFlightPrice += flight.Price;
                        flightNum++;
                    }
                }
            });
            displayFlightDataDate(Math.max(json.dateCreated || 0, json2.dateCreated || 0));
        }
    } else {
        displayFlightDataDate(json.dateCreated || 0);
    }

    if (flightNum !== 0) avgFlightPrice /= flightNum;
    displayFlights(flights, Math.round(avgFlightPrice), nextDay, json.flightDate || dateNow);

    $("#search-spinner").hide();
    clickAllowed = true;
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
    
    // Check if cursed and route is too long
    if (cursed_longhaul && routeDistance > 6000) {
        const curseDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const curseEndTime = cursed_start_time + curseDuration;
        const flightDepartureTime = flightInfo.departUTC;
        
        // Check if flight departure time is past the curse end time
        if (flightDepartureTime >= curseEndTime) {
            // Allow booking and update game time to flight departure time
            $("#confirm-body").html(`
                <div class="alert alert-warning" role="alert">
                    <strong>⚠️ CURSE EXPIRES SOON!</strong> Your curse will end before this flight departs, so you can book it!
                </div>
                <b>${origin_iata}</b> -> <b>${dest_iata}</b>
                <br>Flight time: <b>${flightInfo.Duration}</b>
                <br>The price is <b>USD$${flightInfo.Price}</b>
                <br>Route distance: <b>${routeDistance} km</b>
                <br>The current layover at <b>${origin_iata}</b> will be <b>${leaveTime}</b> minutes.
                <br><small class="text-muted">Game time will advance to flight departure time.</small>
            `);
            $("#confirm-button").prop('disabled', false);
            $("#confirm-button").off("click");
            $("#confirm-button").on("click", function() {
                // Update game time to flight departure time before booking
                gameTimeUpdate(flightDepartureTime);
                bookFlight(flightInfo);
                if (randomFlightChallenge){
                    $("#confirm-cancel-button").removeAttr('disabled');
                    $("#confirm-modal .btn-close").removeAttr('disabled');
                    finishRandomFlight();
                }
            });
            return;
        } else {
            // Curse is still active during flight departure
            $("#confirm-body").html(`
                <div class="alert alert-danger" role="alert">
                    <strong>🚫 CURSED!</strong> You cannot book flights longer than 6,000 km while cursed!
                </div>
                <b>${origin_iata}</b> -> <b>${dest_iata}</b>
                <br>Flight time: <b>${flightInfo.Duration}</b>
                <br>The price is <b>USD$${flightInfo.Price}</b>
                <br>Route distance: <b>${routeDistance} km</b> (exceeds 6,000 km limit)
                <br>The current layover at <b>${origin_iata}</b> will be <b>${leaveTime}</b> minutes.
            `);
            $("#confirm-button").prop('disabled', true);
            return;
        }
    }
    
    // Check if cursed and flight is too expensive
    if (cursed_expensive && flightInfo.Price > 1000) {
        $("#confirm-body").html(`
            <div class="alert alert-danger" role="alert">
                <strong>🚫 CURSED!</strong> You cannot book flights costing more than $1000 while cursed!
            </div>
            <b>${origin_iata}</b> -> <b>${dest_iata}</b>
            <br>Flight time: <b>${flightInfo.Duration}</b>
            <br>The price is <b>USD$${flightInfo.Price}</b> (exceeds $1000 limit)
            <br>Route distance: <b>${routeDistance} km</b>
            <br>The current layover at <b>${origin_iata}</b> will be <b>${leaveTime}</b> minutes.
        `);
        $("#confirm-button").prop('disabled', true);
        return;
    }
    
    if (flightInfo.Price > budget) {
        $("#confirm-body").html(`
            <div class="alert alert-warning" role="alert">
                You don't have enough budget for this flight!
            </div>
            <b>${origin_iata}</b> -> <b>${dest_iata}</b>
            <br>Flight time: <b>${flightInfo.Duration}</b>
            <br>The price is <b>USD$${flightInfo.Price}</b>
            <br>Route distance: <b>${routeDistance} km</b>
            <br>The current layover at <b>${origin_iata}</b> will be <b>${leaveTime}</b> minutes.
        `);
    }
    else {
        $("#confirm-body").html(`
            <b>${origin_iata}</b> -> <b>${dest_iata}</b>
            <br>Flight time: <b>${flightInfo.Duration}</b>
            <br>The price is <b>USD$${flightInfo.Price}</b>
            <br>Route distance: <b>${routeDistance} km</b>
            <br>The current layover at <b>${origin_iata}</b> will be <b>${leaveTime}</b> minutes.
        `);
    }
    $("#confirm-button").prop('disabled', false);
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
    let [originLng, originLat] = origin_latlng;
    let [destLng, destLat] = dest_latlng;

    if (originLng < -180) originLng = (originLng % 360) + 360;
    if (destLng < -180) destLng = (destLng % 360) + 360;
    if (originLng > 180) originLng = (originLng % 360) - 360;
    if (destLng > 180) destLng = (destLng % 360) - 360;

    if (originLng < 0) originLng += 360;
    if (destLng < 0) destLng += 360;
    if (destLng < originLng) [originLng, destLng] = [destLng, originLng];
    // now it's originlng < destlng in [0, 360]. if lng > 180, it should be lng - 360
    // if destlng - originlng > 180, originlng += 360, because its traveling the other way around
    if (destLng - originLng > 180) [originLng, destLng] = [destLng, originLng + 360];
    
    for (let i = Math.floor(originLng); i <= Math.ceil(destLng); i++) {
        let currentLng = i % 360;
        currentLng = i > 180 ? i - 360 : i ;
        routeLngs[currentLng] = true;
        routeLngs[currentLng + 1] = true;
        routeLngs[currentLng - 1] = true;
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
    
    if (cursed_expensive && cursed_expensive_cities_left >= 0) {
        cursed_expensive_cities_left--;
        updateCurseBanner();
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