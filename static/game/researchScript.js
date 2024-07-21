const TIMEZONE_JSON = 'https://raw.githubusercontent.com/vvo/tzdb/main/raw-time-zones.json';

const PRICE_PER_KM = 0.2;

var map = L.map('map').setView([0, 0], 2);

var selectedAp = '';
var localTime = new Date();
var gameStarted = false;

var origin_iata = null, dest_iata = null;
var origin_city = null, dest_city = null;
var origin_latlng = [0, 0], dest_latlng = [0, 0];
var origin_pin = null, dest_pin = null;
var routeDistance = null;

var airportArray;
var timezoneArray;
var markersArray = {};
var selectedApData = null;
var flightsInfoArr = [];
var greatCirclePolyline = [];
var destPolyline = [];

const blankPin = L.icon({
    iconUrl: 'img/blank_pin.png',

    iconSize: [18, 27],
    iconAnchor: [10, 27]
});
const departurePin = L.icon({
    iconUrl: 'img/departure_pin.png',

    iconSize: [18, 27],
    iconAnchor: [10, 27]
});
const arrivalPin = L.icon({
    iconUrl: 'img/arrival_pin.png',

    iconSize: [18, 27],
    iconAnchor: [10, 27]
});
const redSpot = L.icon({
    iconUrl: 'img/red-spot.png',
    iconSize: [15, 15]
});
const yellowSpot = L.icon({
    iconUrl: 'img/yellow-spot.png',
    iconSize: [12, 12]
});
const blueSpot = L.icon({
    iconUrl: 'img/blue-spot.png',
    iconSize: [10, 10]
});

const selectPathOption = {
    color: 'red'
};
const destsPathOption = {
    color: '#7a7a7a',
    opacity: 0.5
};

function getSpot(pinData){
    if (pinData.dest_count >= 60){
        return redSpot;
    }
    else if(pinData.dest_count >= 30){
        return yellowSpot;
    }
    else {
        return blueSpot;
    }
}

function initMap(){
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 10,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    map.setMaxBounds(  [[-90,-180],   [90,180]]  );
    map.setZoom(2);
}

function fetchAirports(){
    fetch('airports.json')
        .then(response => response.json())
        .then(data => {
            airportArray = data;
            data.sort((a, b) => {
                a.dest_count - b.dest_count
            });
            data.forEach(function(pinData) {
                var marker = L.marker([pinData.latitude, pinData.longitude], {icon: getSpot(pinData), title: pinData.iata_code});

                map.addLayer(marker);
                markersArray[pinData.iata_code] = marker;

                marker.bindTooltip(`<b>${pinData.iata_code}</b><br>${pinData.name}<br>${pinData.municipality}, ${pinData.iso_country}<br>Potential destinations: ${pinData.dest_count}`,
                    {
                        direction: 'top',
                        opacity: 0.6,
                        offset: L.point(0, -8)
                    }
                );

                marker.on('click', function(e) {
                    selectedAp = pinData.iata_code;
                    clickedPin(pinData.iata_code, e.target);
                    console.log('Pin clicked:', pinData.iata_code);
                });
            });

            // close all tooltip when mouse out of map
            map.on('mouseout', function() {
                for (var key in markersArray) {
                    if (markersArray.hasOwnProperty(key)) {
                        markersArray[key].closeTooltip();
                    }
                }
            });
            
        }
        )
        .catch(error => console.error("Unable to fetch data:", error));
}

function fetchTimezoneInfo(){
    fetch("raw-time-zones.json")
    .then(response => response.json())
    .then(data => {
        timezoneArray = data;
    })
    .catch(error => console.error('Error fetching timezone:', error));
}

function clickedPin(pinIata, e){
    if (pinIata == origin_iata){
        return;
    }
    if (origin_iata == null){
        origin_iata = pinIata;
        origin_latlng = [e._latlng.lng, e._latlng.lat];
        origin_pin = e;

        drawDestRoute();
        updateRouteDisplay();
        e.setIcon(departurePin);
        return;
    }
    if (dest_iata != null){
        resetRoute();
    }
    dest_iata = pinIata;
    dest_pin = e;
    dest_latlng = [e._latlng.lng, e._latlng.lat];

    drawRouteLine([e._latlng.lng, e._latlng.lat], 'select');
    updateRouteDisplay();
    e.setIcon(arrivalPin);
    $("#reset-route").show();
    
    searchFlight(origin_iata, dest_iata);
}

function drawDestRoute(){
    fetch(`data/dests/${localTime.toISOString().split('T')[0]}/${origin_iata}.json`)
        .then(response => response.json())
        .then(data => {
            data.forEach(dest => {
                var destAp = findApData(dest);
                if (destAp){
                    drawRouteLine([destAp.longitude, destAp.latitude], 'dest');
                }
                
            });
        })
        .catch(error => console.error(`Unable to fetch ${origin_iata} dests data:`, error));
}

function drawRouteLine(dest_latlng, opt){
    greatCirclePolyline = [];

    var lineFrom = turf.point(origin_latlng);
    var lineTo = turf.point(dest_latlng);
    // console.log(lineFrom ,lineTo);

    routeDistance = Math.round(turf.distance(lineFrom, lineTo));

    var options = {npoints: Math.floor(routeDistance / 100) + 3, units: 'kilometers'};
    var arc = turf.greatCircle(lineFrom, lineTo, options);
    // console.log(arc);   

    var coordinates = arc.geometry.coordinates;
    if (coordinates.length == 2){
        // crosses date line
        coordinates.forEach(line => {
                
            var latlngs = line.map(function(coord) {
                return [coord[1], coord[0]];
            });
        
            if (opt == 'select'){
                var polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
                greatCirclePolyline.push(polyline);
                
                map.fitBounds(polyline.getBounds());

                $("#route-distance").text(`${routeDistance} km`);
            }
            if (opt == 'dest'){
                var polyline = L.polyline(latlngs, destsPathOption).addTo(map);
                destPolyline.push(polyline);
            }
        });
    }

    else {

        var latlngs = coordinates.map(function(coord) {
            return [coord[1], coord[0]];
        });

        if (opt == 'select'){
            var polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
            greatCirclePolyline.push(polyline);
            
            map.fitBounds(polyline.getBounds());

            $("#route-distance").text(`${routeDistance} km`);
        }
        if (opt == 'dest'){
            var polyline = L.polyline(latlngs, destsPathOption).addTo(map);
            destPolyline.push(polyline);
        }
    }
}

async function searchFlight(origin_iata, dest_iata) {
    $("#search-spinner").show();

    try {
        const dateNow = localTime.toISOString().split('T')[0];
        const dateTo = new Date(localTime.getTime() + 86400000).toISOString().split('T')[0];
        let avgFlightPrice = 0, flightNum = 0;
        let flights = [];

        const response1 = await fetch(`data/flights/${dateNow}/${origin_iata}.json`);
        const data1 = await response1.json();
        data1.forEach(flight => {
            if (flight.Destination === dest_iata) {
                const existingFlight = flights.find(existing => existing.Departure === flight.Departure && existing.Arrival === flight.Arrival && existing.Price === flight.Price);
                if (!existingFlight){
                    flights.push(flight);
                    if (typeof flight.Price === "number") {
                        avgFlightPrice += flight.Price;
                        flightNum++;
                    }
                }
            }
        });

        try {
            const response2 = await fetch(`data/flights/${dateTo}/${origin_iata}.json`);
            const data2 = await response2.json();
            data2.forEach(flight => {
                if (flight.Destination === dest_iata && flight.Departure <= (localTime.getTime() + 86400000)) {
                    const existingFlight = flights.find(existing => existing.Departure === flight.Departure && existing.Arrival === flight.Arrival && existing.Price === flight.Price);
                    if (!existingFlight){
                        flights.push(flight);
                        if (typeof flight.Price === "number") {
                            avgFlightPrice += flight.Price;
                            flightNum++;
                        }
                    }
                }
            });
        } catch (error) {
            console.error(error);
        }
        
        if (flightNum !== 0) {
            avgFlightPrice /= flightNum;
        }

        displayFlights(flights, Math.round(avgFlightPrice));
    } catch (error) {
        console.error('Error fetching flight data:', error);
    }
}


function displayFlights(flightsData, avgFlightPrice){
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
        `;
        $("#search-spinner").hide();
        $("#flight-info").append(flightInfoEl);

        flightsData.forEach((flight) => {
            // var priceCalculated = false;

            flight.departUTC = new Date(flight.Departure - origin_timezone * 60000).getTime();
            flight.arrivalUTC = new Date(flight.Arrival - dest_timezone * 60000).getTime();
            if (flight.Departure > localTime.getTime()){
                var flightElement = document.createElement('tr');
                // flightElement.classList.add('table');
                if (typeof(flight.Price) != "number"){
                    if (avgFlightPrice != 0){
                        flight.Price = avgFlightPrice;
                    }
                    else flight.Price = Math.round(routeDistance * PRICE_PER_KM);
                    // priceCalculated = true
                    console.log(`${flight.Airline} price is calculated`);
                }
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
                `;
                $("#flight-results").append(flightElement);
            }

        });
    } else {
        if (routeDistance <= 200){
            $("#flight-results").html(`
                <h6 style="text-align: center;">No flights found, but you can do ground transportation.</h6>
            `);
        }
        else {
            $("#flight-results").html('<h6 style="text-align: center;">No flights found.</h6>');
        }
        $("#search-spinner").hide();
    }
}

function resetRoute(){
    // origin_pin.setIcon(blankPin);
    // origin_pin = null;

    if (dest_pin != null){
        dest_pin.setIcon(getSpot(findApData(dest_iata)));
        dest_pin = null;
        routeDistance = null;
        dest_iata = null;
        removePolyline();
    }
    else if (origin_iata != null){
        origin_pin.setIcon(getSpot(findApData(origin_iata)));
        origin_pin = null;
        origin_iata = null;
        origin_latlng = null;
        removeDestLines();
    }

    // origin_iata = null;
    // origin_latlng = [];
    $("#flight-info").html('');
    $("#flight-results").html('');
    $("#route-distance").text('');

    updateRouteDisplay();
}

function removePolyline(){
    greatCirclePolyline.forEach(polyline => {
        map.removeLayer(polyline);
    });
    greatCirclePolyline = [];
}

function removeDestLines(){
    destPolyline.forEach(polyline => {
        map.removeLayer(polyline);
    });
    destPolyline = [];
}

function updateRouteDisplay(){
    $("#origin-airport").text(origin_iata);
    if (origin_iata != null){
        var originApData = findApData(origin_iata);
        origin_city = `${originApData.municipality}, ${originApData.iso_country}`;
        $("#origin-city").text(origin_city);
        $("#origin-airport-name").text(originApData.name);
    }else {
        $("#origin-city").text('');
        $("#origin-airport-name").text('');
    }

    $("#dest-airport").text(dest_iata);
    if (dest_iata != null){
        var destApdata = findApData(dest_iata);
        dest_city = `${destApdata.municipality}, ${destApdata.iso_country}`;
        $("#dest-city").text(dest_city);
        $("#dest-airport-name").text(destApdata.name);
    }else {
        $("#dest-city").text('');
        $("#dest-airport-name").text('');
    }
}

function findApData(iata_code){
    return airportArray.find(airport => airport.iata_code == iata_code);
}


function getTimezone(iata_code){
    var apData = findApData(iata_code);
    return timezoneArray.find(timezone => timezone.group.includes(apData.timezone));
}

function toTimeFormat(time){
    var isoString = time.toISOString().split('T');
    return `${isoString[0]} ${isoString[1].slice(0, 8)}`;
}

function initTime(){
    localTime = window.parent.localTime;
    gameStarted = window.parent.gameStarted;
    
    if (gameStarted){
        $("#time-selector").val(localTime.toISOString().split('T')[0]);
    }
    else {
        $("#time-selector").val('2024-04-01');
        localTime = new Date('2024-04-01');
    }
}

function dateChanged(){
    var input = $("#time-selector").val();
    var date = new Date(input);

    if (!isNaN(date.getTime())) {
        localTime = new Date(input);
        console.log(localTime);
    }
}

$("#reset-route").hide();

initMap();
fetchAirports();
fetchTimezoneInfo();

$("#search-spinner").hide();
