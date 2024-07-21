const TIMEZONE_JSON = 'https://raw.githubusercontent.com/vvo/tzdb/main/raw-time-zones.json';
// const API_URL = 'http://127.0.0.1:5000/api/'
// const API_URL = 'http://36da4346.r5.cpolar.top/api'

const CIRCUMDIST = 36788;
const PRICE_PER_KM = 0.2;
const GROUND_TRANSPORT_SPEED = 0.5; // km/min
const GROUND_TRANSPORT_PRICE = 2; // $ per km

var uniqueId = null;
var username = null;

// const startingIata = {{starting_iata}};
// const startingTime = new Date({{starting_time}});

var flyDir = "";

var clickAllowed = false;
var selectedAp = '';

var origin_iata = null, dest_iata = null;
var origin_city = null, dest_city = null;
var origin_latlng = [0, 0], dest_latlng = [0, 0];
var origin_pin = null, dest_pin = null;
var routeDistance = null;

var gameTime = new Date();
var localTime = new Date();
var legsCount = 0;
var routeInfo = [];
var distanceCovered = 0;
var moneySpent = 0;
var budget = 500;

var current_timezone;

var airportArray;
var timezoneArray;
var markersArray = {};
var flightsInfoArr = [];

var greatCirclePolyline = [];
var destPolyline = [];

var routeLngs = {};
for (let i = -180; i <= 180; i++){
    routeLngs[i] = false;
}

function checkLngMissing(){
    var missedArray = [];
    for (let i = -180; i <= 180; i++){
        if (!routeLngs[i]){
            missedArray.push(i);
        }
    }
    return missedArray;
}

const searchInput = document.getElementById('search-input');
const dropdown = document.getElementById('dropdown');

var tutorialAllowedIata = "DEN";
function clickedPin(pinIata, e){
    if (!clickAllowed){
        return;
    }
    if (pinIata === tutorialAllowedIata){
        if (tutorialStep !== 0){
            nextTutorial();
        }
    }
    else if (tutorialStep !== 18){
        return;
    }
    if (pinIata == origin_iata){
        return;
    }
    if (origin_iata == null){
        origin_iata = pinIata;
        origin_latlng = [e._latlng.lng, e._latlng.lat];
        origin_pin = e;

        // console.log(origin_latlng);
        // findAllDests();
        drawDestRoute();
        updateRouteDisplay();
        e.setIcon(departurePin);
        return;
    }
    // if (apEastWest(origin_iata, pinIata) != flyDir && flyDir != "") {
    //     console.warn("No Backtracking!");
    //     return;
    // }

    resetRoute();

    dest_iata = pinIata;
    dest_pin = e;
    dest_latlng = [e._latlng.lng, e._latlng.lat];

    drawRouteLine([e._latlng.lng, e._latlng.lat], 'select');
    updateRouteDisplay();
    e.setIcon(arrivalPin);
    $("#reset-route").show();
    
    searchFlight(false);
}

function selectAirport(){
    if (selectedAp == ''){
        // @ts-ignore
        selectedAp = dropdown.value;
    }
    if (selectedAp != ''){
        clickedPin(selectedAp, markersArray[selectedAp]);
        selectedAp = '';
    }
}

function drawDestRoute(){
    fetch(`${destsJsonUrl}${origin_iata}.json`)
        .then(response => response.json())
        .then(data => {
            data.forEach(dest => {
                // if (apEastWest(origin_iata, dest) == flyDir || flyDir == ""){
                //     var destAp = findApData(dest);
                //     if (destAp){
                //         drawRouteLine([destAp.longitude, destAp.latitude], 'dest');
                //     }
                // }
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

    // @ts-ignore
    var lineFrom = turf.point(origin_latlng);
    // @ts-ignore
    var lineTo = turf.point(dest_latlng);
    // console.log(lineFrom ,lineTo);

    // @ts-ignore
    routeDistance = Math.round(turf.distance(lineFrom, lineTo));

    var options = {npoints: Math.floor(routeDistance / 100) + 3, units: 'kilometers'};
    // @ts-ignore
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
                distanceBarUpdate(false);
            }
            if (opt == 'dest'){
                var polyline = L.polyline(latlngs, destsPathOption).addTo(map);
                destPolyline.push(polyline);
            }
            if (opt == 'destv2'){
                var polyline = L.polyline(latlngs, destsPathOptionv2).addTo(map);
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
            distanceBarUpdate(false);
        }
        if (opt == 'dest'){
            var polyline = L.polyline(latlngs, destsPathOption).addTo(map);
            destPolyline.push(polyline);
        }
    }
}


function arrivedNewCity(timeStamp){
    clickAllowed = true;
    distanceCovered += routeDistance;
    $("#distance-covered").text(`${distanceCovered} / ${CIRCUMDIST} km`);
    distanceBarUpdate(true);

    if (dest_iata == startingIata){
        if (checkLngMissing().length != 0){
            window.alert("You should cross all meridians on your path!");
        }
        else if (distanceCovered < CIRCUMDIST){
            window.alert("Not enough distance!");
        }
        else {
            $("#route-distance").text('');
            origin_pin.setIcon(getSpot(findApData(origin_iata)));
            dest_pin.setIcon(getSpot(findApData(dest_iata)));
            origin_iata = dest_iata;
            dest_iata = null;
            current_timezone = getTimezone(origin_iata);
            origin_city = dest_city;
            dest_city = null;
            origin_latlng = dest_latlng;
            origin_pin = dest_pin;
            dest_pin = null;
            greatCirclePolyline = [];

            gameTimeUpdate(timeStamp);
            gameOver();

            return;
        }
    }

    $("#reset-route").show();
    $("#route-distance").text('');

    origin_pin.setIcon(getSpot(findApData(origin_iata)));
    dest_pin.setIcon(departurePin);

    origin_iata = dest_iata;
    dest_iata = null;

    current_timezone = getTimezone(origin_iata);

    origin_city = dest_city;
    dest_city = null;

    origin_latlng = dest_latlng;

    origin_pin = dest_pin;
    dest_pin = null;

    greatCirclePolyline = [];

    gameTimeUpdate(timeStamp);
    newCityPopup();
    drawDestRoute();

    
    resetRoute();
}

var bgSuccess = false;
function distanceBarUpdate(newCity){
    // console.log(newCity);
    if (newCity) {
        var distPercent = Math.floor(distanceCovered / CIRCUMDIST * 100);
        $('#distance-covered-bar').attr('aria-valuenow', distPercent).css('width', `${distPercent}%`);
        $("#distance-covered-bar-label").text(`${distPercent}%`);
        $('#distance-preview-bar').attr('aria-valuenow', '0').css('width', '0%');

        if (distanceCovered >= CIRCUMDIST) {
            $("#distance-covered-bar-label").addClass("bg-success");
        }
    }
    else {
        var distPercent = Math.floor(routeDistance / CIRCUMDIST * 100);
        $('#distance-preview-bar').attr('aria-valuenow', distPercent).css('width', `${distPercent}%`);
        $("#distance-preview-bar-label").text(`${distPercent}%`);

        if (distanceCovered + routeDistance >= CIRCUMDIST) {
            $("#distance-preview-bar-label").removeClass("bg-info").addClass("bg-success");
            bgSuccess = true;
        }
        else if (bgSuccess) {
            $("#distance-preview-bar-label").removeClass("bg-success").addClass("bg-info");
            bgSuccess = false;
        }
    }
}

function newCityPopup(){
    confetti({
        particleCount: 150,
        spread: 180
    });
    $("#welcome-toast").toast("show");
    $("#welcome-toast-header").text(`Welcome to ${origin_city}!`)
    $("#welcome-toast-body").html(`
        <b>Local Time Now:</b> ${toTimeFormat(localTime)}
        <br>
        <b>Distance Gained:</b> ${routeDistance} km
    `)
}

function resetRoute(){
    // origin_pin = null;

    if (dest_pin != null){
        dest_pin.setIcon(getSpot(findApData(dest_iata)));
        dest_pin = null;
        removePolyline();
    }

    routeDistance = null;
    dest_iata = null;
    // origin_iata = null;
    // origin_latlng = [];
    $("#flight-info").html('');
    $("#flight-results").html('');
    $("#flight-meta").hide();
    $("#route-distance").text('');

    distanceBarUpdate(false);

    dropdown.innerHTML = '';
    // @ts-ignore
    searchInput.value = '';
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

function updateDropdown(searchTerm) {
    dropdown.innerHTML = ''; // Clear previous options

    const matchingAirports = airportArray.filter(airport =>
        airport.iata_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        airport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        airport.municipality.toLowerCase().includes(searchTerm.toLowerCase())
    );

    matchingAirports.forEach(airport => {
        const option = document.createElement('option');
        option.value = airport.iata_code;
        option.textContent = `${airport.name} (${airport.iata_code}) (${airport.municipality})`;
        dropdown.appendChild(option);
    });
}

function goHomeConfirm(){
    $("#confirm-modal").modal('show');
    $("#confirm-title").text(`Go back to home page?`);
    $("#confirm-body").html(`
        <h6>Are you sure you are going back to home page?</h6>
        <b>The game will not be saved!</b>
        `);
    $("#confirm-button").off("click");
    $("#confirm-button").on("click", function() {
        // let currentUrl = window.location.href;
        // window.location.href = currentUrl.split('/tutorial')[0];
        window.location.href = "../";
    });
}

function findApData(iata_code){
    return airportArray.find(airport => airport.iata_code == iata_code);
}

function apEastWest(orgIata, destIata) {
    // dest is east or west of org
    const orgLng = findApData(orgIata).longitude;
    const destLng = findApData(destIata).longitude;
    const diff = destLng - orgLng;

    if (diff > 0 && diff < 180) {
        return "east";
    }
    if (diff < -180) {
        return "east";
    }
    if (diff < 0 && diff > -180) {
        return "west";
    }
    if (diff > 180) {
        return "west";
    }
    window.alert("Two airport at the same longitude!!!!");
    return "";
}

function getTimezone(iata_code){
    var apData = findApData(iata_code);
    return timezoneArray.find(timezone => timezone.group.includes(apData.timezone));
}

function gameTimeUpdate(timeStamp){
    gameTime.setTime(timeStamp);
    localTime.setTime(timeStamp + current_timezone.rawOffsetInMinutes * 60000);
    var timeUsed = new Date(gameTime.getTime() - startingTime.getTime());
    // console.log(timeUsed);

    $("#utc-time").text(`UTC: ${toTimeFormat(gameTime)}`);
    $("#local-time").html(`UTC${current_timezone.rawFormat.slice(0, 6)}: <b>${toTimeFormat(localTime)}</b>`);
    $("#elapsed-time").text(`${timeUsed.getUTCDate()-1}d  ${timeUsed.getUTCHours()}hr ${timeUsed.getUTCMinutes()}min`);
}

function toTimeFormat(time){
    var isoString = time.toISOString().split('T');
    return `${isoString[0]} ${isoString[1].slice(0, 8)}`;
}

async function postPlayerStat(timeUsed){
    fetch(`${API_URL}post_player_stat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "gameId": 0,
            "username": "New Player",
            "timeUsed": timeUsed,
            "moneyUsed": moneySpent,
            "distanceCovered": distanceCovered,
            "legsCount": legsCount,
            "route": routeInfo
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        uniqueId = data.uniqueId;
    })
    .catch(error => console.error('Error:', error));
}

async function getLeaderboard(){
    fetch(`${API_URL}get_game_data?gameId=${gameId}`)
        .then(response => response.json())
        .then(data => {
            // console.log(data);
            var playerStatArr = data.playerStats;
            playerStatArr.sort((a, b) => {
                return a.timeUsed - b.timeUsed;
            });
            console.log(playerStatArr);

            let inTop10 = false;
            for (let i = 0; i < Math.min(10, playerStatArr.length); i++){
                let playerStat = playerStatArr[i];
                if (playerStat.uniqueId === uniqueId) {
                    inTop10 = true;
                    $("#leaderboard-tbody").append(
                    `
                        <tr class="table-info">
                            <th scope="row">${i+1}</th>
                            <td>${playerStat.username}</td>
                            <td>${elapsedTimeFormat(new Date(playerStat.timeUsed))}</td>
                            <td>$${playerStat.moneyUsed}</td>
                            <td>${showRoute(playerStat.route)}</td>
                        </tr>
                    `
                    );
                }else {
                    $("#leaderboard-tbody").append(
                    `
                        <tr>
                            <th scope="row">${i+1}</th>
                            <td>${playerStat.username}</td>
                            <td>${elapsedTimeFormat(new Date(playerStat.timeUsed))}</td>
                            <td>$${playerStat.moneyUsed}</td>
                            <td>${showRoute(playerStat.route)}</td>
                        </tr>
                    `
                    );
                }
            }
            if (!inTop10 && uniqueId){
                var index = 0;
                for (let i = 0; i < playerStatArr.length; i++){
                    if (playerStatArr[i].uniqueId === uniqueId){
                        index = i;
                        break;
                    }
                }
                var playerStat = playerStatArr[index];
                $("#leaderboard-tbody").append(
                `
                    <tr class="table-info">
                        <th scope="row">${index+1}</th>
                        <td>${playerStat.username}</td>
                        <td>${elapsedTimeFormat(new Date(playerStat.timeUsed))}</td>
                        <td>$${playerStat.moneyUsed}</td>
                        <td>${showRoute(playerStat.route)}</td>
                    </tr>
                `
                );
            }
        })
        .catch(error => console.error(`Unable to fetch leaderboard:`, error));
}

function showRoute(routeArr){
    let routeStr = "";
    for (let i = 0; i < routeArr.length-1; i++){
        routeStr += routeArr[i];
        routeStr += '-';
    }
    routeStr += routeArr[routeArr.length-1];
    return routeStr;
}

function elapsedTimeFormat(timeUsed){
    return `${timeUsed.getUTCDate()-1} days, ${timeUsed.getUTCHours()} hours, and ${timeUsed.getUTCMinutes()} minutes.`;
}

function gameOver(){
    clickAllowed = false;

    var timeUsed = new Date(gameTime.getTime() - startingTime.getTime());
    // postPlayerStat(timeUsed.getTime());
    confetti({
        particleCount: 250,
        spread: 180
    });
    $('#endscreen').show();
    $("#endscreen-usedtime").text(elapsedTimeFormat(timeUsed));
    $("#endscreen-usedmoney").text(`$${moneySpent}`);

    // getLeaderboard();
}

function startGame(){
    console.log(`starting in ${startingIata} @ ${startingTime.toISOString()}`);
    $("#money-left").text(`$${budget}`);
    routeInfo.push(startingIata);

    var timezone = getTimezone(startingIata);
    current_timezone = timezone;
    gameTimeUpdate(startingTime.getTime());

    clickAllowed = true;
    
    selectedAp = startingIata;
    selectAirport();
    distanceBarUpdate(true);
}

searchInput.addEventListener('input', function () {
    // @ts-ignore
    const searchTerm = searchInput.value.trim();
    updateDropdown(searchTerm);
});

$("#search-input").on("keypress", function(event){
    if(event.keyCode === 13){
        selectAirport();
    }
})

$('#researchCanvas').on('shown.bs.offcanvas', function () {
    var iframe = document.getElementById('research-iframe');
    // @ts-ignore
    if(iframe && iframe.contentWindow) {
        // @ts-ignore
        iframe.contentWindow.initTime();
    }
});

// $("#previous-flights-container").hide();
$("#current-status-container").hide();
$("#time-flow-container").hide();
$("#reset-route").hide();
$("#flight-meta").hide();

async function main() {
    try {
        initMap();
        initTooltip();
        const timezoneReady = await fetchTimezoneInfo();
        const airportReady = await fetchAirports();

        if (timezoneReady && airportReady){
            $("#start-spinner").hide();
            startGame();
        }
        else {
            if (!airportReady){
                console.error("fetching airport data failed!");
            }
            if (!timezoneReady){
                console.error("fetching timezone data failed!");
            }
            
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    startTutorial();
    main();
});
