
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

        const response = await fetch(`${FLIGHT_URL}get_flight?org=${origin_iata}&dest=${dest_iata}&date=${dateNow}`);
        
        if (!response.ok) {
            $("#flight-meta").hide();
            $("#flight-info").html('');
            $("#flight-results").html('<h6 style="text-align: center;">Error fetching flight data. Try again.</h6>');
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
        }
        else {
            displayFlightDataDate(json.dateCreated);
        }

        if (flightNum !== 0) {
            avgFlightPrice /= flightNum;
        }

        displayFlights(flights, Math.round(avgFlightPrice), nextDay);
    } catch (error) {
        console.error('Error fetching flight data:', error);
        $("#flight-meta").hide();
        $("#flight-info").html('');
        $("#flight-results").html('<h6 style="text-align: center;">Error fetching flight data. Try again.</h6>');
        $("#search-spinner").hide();
        if (randomFlightChallenge) {
            startRandomFlight();
            return;
        }
        clickAllowed = true;
    }
}

function searchNextDayFlight(){
    $("#flight-meta").hide();
    $("#flight-info").html('');
    $("#flight-results").html('');
    searchFlight(true);
}

function displayFlightDataDate(timestamp){
    $("#flight-meta").show().text(`Data fetched: ${new Date(timestamp).toISOString()}`);
}

function displayFlights(flightsData, avgFlightPrice, nextDay){
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

        var origin_timezone = getTimezone(origin_iata).rawOffsetInMinutes;
        var dest_timezone = getTimezone(dest_iata).rawOffsetInMinutes;

        var flightInfoEl = document.createElement('tr');
        flightInfoEl.classList.add('table-info');
        flightInfoEl.innerHTML = `
            <td>Departure</td>
            <td>Arrival</td>
            <td>Duration</td>
            <td>Airline</td>
            <td>Price</td>
            <td>Action</td>
        `;
        $("#search-spinner").hide();
        $("#flight-info").append(flightInfoEl);

        var arrayIndex = 0;

        flightsData.forEach((flight) => {
            // var priceCalculated = false;

            flight.departUTC = new Date(flight.Departure - origin_timezone * 60000).getTime();
            flight.arrivalUTC = new Date(flight.Arrival - dest_timezone * 60000).getTime();
            

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

            if (flight.Departure > localTime.getTime() + 60*60000){ // no less than 1 hr layover
                flightsInfoArr.push(flight);

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
                    <td>(Previous flight)</td>
                `;
                $("#flight-results").append(flightElement);
            }

        });

        if (arrayIndex < 5 && !nextDay){
            // search next day
            var trElement = document.createElement('tr');
            trElement.innerHTML = `
                
                <td>
                    <span class="clickable-text book-flight" onclick="searchNextDayFlight()">Search next day's flight</span>
                </td>
            `;
            $("#flight-results").append(trElement);
        }

    }
    else {
        // no flights
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
            finishRandomFlight();
        }
    });
    
}

const planeMarker = L.icon({
    iconUrl: `${imgDir}plane-marker.png`,
    iconSize: [45, 68],
    iconAnchor: [23, 65],
});

function recordRoute(){
    greatCircleOriginalPolylines.forEach(line => {
        var latlngs = line.getLatLngs();
        // console.log(latlngs);
        latlngs.forEach(point => {
            var lng = point.lng;
            // console.log(lng);
            routeLngs[Math.floor(lng)] = true;
            routeLngs[Math.floor(lng)+1] = true;
            routeLngs[Math.floor(lng)-1] = true;

        })
    });
}

// TODO: PLANE ICON W/ DIRECTION

let skipFlightAnimation = false;
function bookFlight(flightInfo){
    $("#confirm-modal").modal('hide');
    if (flightInfo.Price > budget) {
        alert("Not enough budget!!!");
        return;
    }
    if (flightInfo.Departure < localTime.getTime() + 45*60000) {
        alert("Too late! Unable to book flight!");
        return;
    }

    clickAllowed = false;
    $("#reset-route").hide();
    skipFlightAnimation = false;

    removeDestLines();

    $("#flight-info").html('');
    $("#flight-results").html('');
    $("#flight-meta").hide();

    recordRoute();
    document.getElementById("map").scrollIntoView(false);

    $("#skip-animation").show();
    // Attach skip button handler
    $("#skip-animation").off("click").on("click", function() {
        skipFlightAnimation = true;
    });

    if (greatCircleOriginalPolylines.length === 1) {
        const line = greatCircleOriginalPolylines[0];
        const animatedMarker = L.animatedMarker(line.getLatLngs(), {
            icon: planeMarker,
            distance: 300000,
            interval: 500,
            onEnd: function() {
                if (!skipFlightAnimation) {
                    map.removeLayer(animatedMarker);
                    afterFlight(flightInfo);
                }
            }
        });

        map.addLayer(animatedMarker);
        map.fitBounds(line.getBounds());

        // Watch for skip
        const skipWatcher = setInterval(() => {
            if (skipFlightAnimation) {
                clearInterval(skipWatcher);
                map.removeLayer(animatedMarker);
                afterFlight(flightInfo);
            }
        }, 200);

    } else {
        const part1 = greatCircleOriginalPolylines[0];
        const part2 = greatCircleOriginalPolylines[1];

        const animatedMarker1 = L.animatedMarker(part1.getLatLngs(), {
            distance: 300000,
            interval: 500,
            icon: planeMarker,
            onEnd: function () {
                if (skipFlightAnimation) {
                    map.removeLayer(animatedMarker1);
                    return;
                }

                const animatedMarker2 = L.animatedMarker(part2.getLatLngs(), {
                    icon: planeMarker,
                    distance: 300000,
                    interval: 500,
                    onEnd: function () {
                        if (!skipFlightAnimation) {
                            map.removeLayer(animatedMarker2);
                            afterFlight(flightInfo);
                        }
                    }
                });

                map.removeLayer(animatedMarker1);
                map.addLayer(animatedMarker2);
                map.fitBounds(part2.getBounds());

                const skipWatcher2 = setInterval(() => {
                    if (skipFlightAnimation) {
                        clearInterval(skipWatcher2);
                        map.removeLayer(animatedMarker2);
                        afterFlight(flightInfo);
                    }
                }, 200);
            }
        });

        map.addLayer(animatedMarker1);
        map.fitBounds(part1.getBounds());

        const skipWatcher1 = setInterval(() => {
            if (skipFlightAnimation) {
                clearInterval(skipWatcher1);
                map.removeLayer(animatedMarker1);
                afterFlight(flightInfo);
            }
        }, 200);
    }
}


function afterFlight(flightInfo){
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

    $("#flight-info").html('');
    $("#flight-results").html('');

    arrivedNewCity(arrivalTimestamp);
}