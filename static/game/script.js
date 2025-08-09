// const API_URL = 'http://127.0.0.1:5000/api/'
// const API_URL = 'http://36da4346.r5.cpolar.top/api'

const CIRCUMDIST = 36788;
const PRICE_PER_KM = 0.2;
const GROUND_TRANSPORT_SPEED = 0.5; // km/min
const GROUND_TRANSPORT_PRICE = 2; // $ per km

var uniqueId = null;
var username = null;
var lastViewedScheduleIata = null;

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

var current_timezone_offset = 0;

var airportArray;
var timezoneArray;
var markersArray = {};
var flightsInfoArr = [];

var greatCirclePolyline = [];
var greatCircleOriginalPolylines = [];
var destPolyline = [];
var leaderboardPolyline = [];

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

function clickedPin(pinIata, e){
    if (!clickAllowed){
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

let current_dest_iatas = [];
function drawDestRoute(){
    current_dest_iatas = [];
    fetch(`${destsJsonUrl}${origin_iata}.json`)
        .then(response => response.json())
        .then(data => {
            data.forEach(dest => {
                current_dest_iatas.push(dest);
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

function drawRouteLine(dest_latlng, opt, route) {
    greatCirclePolyline = [];
    greatCircleOriginalPolylines = []; // <-- only for animation use

    // @ts-ignore
    var lineFrom = turf.point(origin_latlng);
    // @ts-ignore
    var lineTo = turf.point(dest_latlng);

    // @ts-ignore
    routeDistance = Math.round(turf.distance(lineFrom, lineTo));
    var options = { npoints: Math.floor(routeDistance / 100) + 3, units: 'kilometers' };

    // @ts-ignore
    var arc = turf.greatCircle(lineFrom, lineTo, options);
    var coordinates = arc.geometry.coordinates;

    function drawPolyline(latlngs, shiftLng = 0, isOriginal = false) {
        let shiftedLatLngs = latlngs.map(([lng, lat]) => [lat, lng + shiftLng]);

        let polyline;
        if (opt === 'select') {
            polyline = L.polyline(shiftedLatLngs.map(c => [c[0], c[1]]), { color: 'red' }).addTo(map);
            greatCirclePolyline.push(polyline);
            if (isOriginal) {
                greatCircleOriginalPolylines.push(polyline);
                map.fitBounds(polyline.getBounds());
                $("#route-distance").text(`${routeDistance} km`);
                distanceBarUpdate(false);
            }
        } else if (opt === 'dest') {
            polyline = L.polyline(shiftedLatLngs.map(c => [c[0], c[1]]), destsPathOption).addTo(map);
            destPolyline.push(polyline);
        } else if (opt === 'destv2') {
            polyline = L.polyline(shiftedLatLngs.map(c => [c[0], c[1]]), destsPathOptionv2).addTo(map);
            destPolyline.push(polyline);
        } else if (opt === 'leaderboard') {
            polyline = L.polyline(shiftedLatLngs.map(c => [c[0], c[1]]), {color: 'red'}).addTo(map);
            polyline.routeData = route; // Store the route data with the polyline
            leaderboardPolyline.push(polyline);
        } else {
            return;
        }

        // Do NOT store mirrored copies in greatCirclePolyline
    }

    if (coordinates.length === 2) {
        // Crosses dateline: Turf.js splits into 2 segments
        coordinates.forEach((lineCoords, idx) => {
            drawPolyline(lineCoords, 0, true);      // original
            drawPolyline(lineCoords, -360, false);  // shifted left
            drawPolyline(lineCoords, 360, false);   // shifted right
        });
    } else {
        // Normal arc (single segment)
        drawPolyline(coordinates, 0, true);      // original
        drawPolyline(coordinates, -360, false);  // shifted left
        drawPolyline(coordinates, 360, false);   // shifted right
    }
}


function arrivedNewCity(timeStamp){
    clickAllowed = true;
    distanceCovered += routeDistance;
    $("#distance-covered").text(`${distanceCovered} / ${CIRCUMDIST} km`);
    distanceBarUpdate(true);

    // Handle cursed challenges - decrement cities counter
    if (cursed_challenges && cursed_challenges_cities_left >= 0) {
        cursed_challenges_cities_left--;
        updateCurseBanner();
    }
    
    // Handle cursed departures - decrement cities counter
    if (cursed_departures && cursed_departures_cities_left >= 0) {
        cursed_departures_cities_left--;
        updateCurseBanner();
    }

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
            current_timezone_offset = getTimezoneOffset(origin_iata);
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

    current_timezone_offset = getTimezoneOffset(origin_iata);

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
    if (randomFlightChallenge){
        return;
    }
    // origin_pin = null;

    // Abort any ongoing flight search
    if (currentFlightController) {
        clearTimeout(timeoutId);
        currentFlightController.abort("user_interrupted");
        currentFlightController = null;
    }

    if (dest_pin != null){
        dest_pin.setIcon(getSpot(findApData(dest_iata)));
        dest_pin = null;
        removePolyline();
    }

    routeDistance = null;
    dest_iata = null;
    // origin_iata = null;
    // origin_latlng = [];

    $("#flight-title").html('');
    $("#flight-info").html('');
    $("#flight-results").html('');
    $("#flight-meta").html('');
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

function removeLeaderboardLines(){
    leaderboardPolyline.forEach(polyline => {
        map.removeLayer(polyline);
    });
    leaderboardPolyline = [];
}

function updateRouteDisplay(){
    $("#origin-airport").text(origin_iata);
    if (origin_iata != null){
        var originApData = findApData(origin_iata);
        origin_city = `${originApData.municipality}, ${originApData.country_name}`;
        $("#origin-city").text(origin_city);
        $("#origin-airport-name").text(originApData.name);
        $("#view-origin-schedule-btn").show();
    }else {
        $("#origin-city").text('');
        $("#origin-airport-name").text('');
        $("#view-origin-schedule-btn").hide();
    }

    $("#dest-airport").text(dest_iata);
    if (dest_iata != null){
        var destApdata = findApData(dest_iata);
        dest_city = `${destApdata.municipality}, ${destApdata.country_name}`;
        $("#dest-city").text(dest_city);
        $("#dest-airport-name").text(destApdata.name);
        $("#view-schedule-btn").show();
    }else {
        $("#dest-city").text('');
        $("#dest-airport-name").text('');
        $("#view-schedule-btn").hide();
    }
}

function updateDropdown(searchTerm) {
    dropdown.innerHTML = ''; // Clear previous options
    if (!searchTerm) return;

    const lowerSearch = searchTerm.toLowerCase();

    const rankAirport = (airport) => {
        if (airport.iata_code && airport.iata_code.toLowerCase().startsWith(lowerSearch)) return 0;
        if (airport.municipality && airport.municipality.toLowerCase().startsWith(lowerSearch)) return 1;
        if (airport.name && airport.name.toLowerCase().includes(lowerSearch)) return 2;
        return 3;
    };

    let matchingAirports = airportArray.filter(airport =>
        (airport.iata_code && airport.iata_code.toLowerCase().includes(lowerSearch)) ||
        (airport.municipality && airport.municipality.toLowerCase().includes(lowerSearch)) ||
        (airport.name && airport.name.toLowerCase().includes(lowerSearch))
    );

    // If no primary matches, fallback to country name search
    if (matchingAirports.length === 0) {
        matchingAirports = airportArray.filter(airport =>
            airport.country_name && airport.country_name.toLowerCase().includes(lowerSearch)
        );
    }

    matchingAirports.sort((a, b) => {
        const rankA = rankAirport(a);
        const rankB = rankAirport(b);
        if (rankA !== rankB) return rankA - rankB;

        const destA = parseInt(a.dest_count || '0', 10);
        const destB = parseInt(b.dest_count || '0', 10);
        return destB - destA; // more destinations = higher rank
    });

    matchingAirports.slice(0, 20).forEach(airport => {
        const option = document.createElement('option');
        option.value = airport.iata_code;
        option.textContent = `${airport.municipality} (${airport.iata_code}) — ${airport.name} (${airport.dest_count})`;
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
        // window.location.href = currentUrl.split('/game/')[0];
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

function getTimezoneOffset(iata_code) {
    var apData = findApData(iata_code);
    return apData.timezone_offset;
}

function gameTimeUpdate(timeStamp){
    gameTime.setTime(timeStamp);
    localTime.setTime(timeStamp + current_timezone_offset * 1000);
    var timeUsed = new Date(gameTime.getTime() - startingTime.getTime());
    // console.log(timeUsed);

    $("#utc-time").text(`UTC: ${toTimeFormat(gameTime)}`);
    $("#local-time").html(`UTC${current_timezone_offset >= 0 ? '+' : ''}${current_timezone_offset/3600}: <b>${toTimeFormat(localTime)}</b>`);
    $("#elapsed-time").text(`${timeUsed.getUTCDate()-1}d  ${timeUsed.getUTCHours()}hr ${timeUsed.getUTCMinutes()}min`);
    
    // Check curse expiration
    if (cursed_longhaul && cursed_start_time > 0) {
        const curseDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const timeElapsed = gameTime.getTime() - cursed_start_time;
        const timeRemaining = curseDuration - timeElapsed;
        
        if (timeRemaining <= 0) {
            // Curse has expired
            endCursedLonghaul();
        } else {
            // Update curse banner
            updateCurseBanner();
        }
    }
    
    // Refresh flight display if flight table is visible
    if (typeof refreshFlightDisplay === 'function') {
        refreshFlightDisplay();
    }
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
            "gameId": gameId,
            "username": username,
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
        getLeaderboard();
    })
    .catch(error => console.error('Error:', error));
}

async function getLeaderboard(){
    fetch(`${API_URL}get_game_data?gameId=${gameId}`)
        .then(response => response.json())
        .then(data => {
            $("#leaderboard").show();
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
                        <tr class="table-info clickable-row" data-route='${JSON.stringify(playerStat.route)}'>
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
                        <tr class="clickable-row" data-route='${JSON.stringify(playerStat.route)}'>
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
                    <tr class="table-info clickable-row" data-route='${JSON.stringify(playerStat.route)}'>
                        <th scope="row">${index+1}</th>
                        <td>${playerStat.username}</td>
                        <td>${elapsedTimeFormat(new Date(playerStat.timeUsed))}</td>
                        <td>$${playerStat.moneyUsed}</td>
                        <td>${showRoute(playerStat.route)}</td>
                    </tr>
                `
                );
            }

            // Add click handlers for the rows
            $(".clickable-row").click(function() {
                const route = $(this).data('route');
                                
                // If this row was already selected, remove only its route and selected class
                if ($(this).hasClass("selected-row")) {
                    $(this).removeClass("selected-row");
                    $(this).removeClass("table-active");
                    // Remove only the polylines associated with this route
                    const routePolylines = leaderboardPolyline.filter(polyline => {
                        return JSON.stringify(polyline.routeData) === JSON.stringify(route);
                    });
                    routePolylines.forEach(polyline => {
                        map.removeLayer(polyline);
                    });
                    leaderboardPolyline = leaderboardPolyline.filter(polyline => !routePolylines.includes(polyline));
                    return;
                }
                
                // Add highlight to clicked row
                $(this).addClass("selected-row");
                $(this).addClass("table-active");
                
                // Draw the route
                drawLeaderboardRoute(route);
            });
        })
        .catch(error => console.error(`Unable to fetch leaderboard:`, error));
}

function drawLeaderboardRoute(route) {
    // Draw each leg of the route
    for (let i = 0; i < route.length - 1; i++) {
        const originAp = findApData(route[i]);
        const destAp = findApData(route[i + 1]);
        
        // console.log(originAp, destAp);

        if (originAp && destAp) {
            // Store original origin and dest for drawRouteLine
            const tempOriginIata = origin_iata;
            const tempDestIata = dest_iata;
            const tempOriginLatlng = origin_latlng;
            const tempDestLatlng = dest_latlng;
            
            // Set temporary values for drawRouteLine
            origin_iata = route[i];
            dest_iata = route[i + 1];
            origin_latlng = [originAp.longitude, originAp.latitude];
            dest_latlng = [destAp.longitude, destAp.latitude];
            
            // Draw the route line with route data
            drawRouteLine([destAp.longitude, destAp.latitude], 'leaderboard', route);
            
            // Restore original values
            origin_iata = tempOriginIata;
            dest_iata = tempDestIata;
            origin_latlng = tempOriginLatlng;
            dest_latlng = tempDestLatlng;
        }
    }
    
    map.setView([20, 0], 2); // Center on lat 20, lng 0 at zoom level 2 to show most of world
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
    removeDestLines();
    clickAllowed = false;

    map.off('zoomend', zoomHandler);
    map.removeLayer(airportMarkersGroup);
    map.removeLayer(blueMarkersGroup);

    $("#airport-display").hide();
    $("#airport-input").hide();

    var timeUsed = new Date(gameTime.getTime() - startingTime.getTime());
    confetti({
        particleCount: 250,
        spread: 180
    });
    $('#endscreen').show();
    $("#endscreen-usedtime").text(elapsedTimeFormat(timeUsed));
    $("#endscreen-usedmoney").text(`$${moneySpent}`);

    if (gameId !== 0){
        $("#start-modal").modal('show');
    }

    // postPlayerStat(timeUsed.getTime());
    // getLeaderboard();
}

function startGame(){
    console.log(`starting in ${startingIata} @ ${startingTime.toISOString()}`);
    $("#money-left").text(`$${budget}`);
    routeInfo.push(startingIata);

    current_timezone_offset = getTimezoneOffset(startingIata);
    gameTimeUpdate(startingTime.getTime());

    clickAllowed = true;
    
    selectedAp = startingIata;
    selectAirport();
    distanceBarUpdate(true);
    
    // Initialize curse banner
    updateCurseBanner();
}

searchInput.addEventListener('input', function () {
    // @ts-ignore
    const searchTerm = searchInput.value.trim();
    updateDropdown(searchTerm);
});

$("#search-input").on("keydown", function(event){
    if(event.key === "Enter"){
        selectAirport();
    }
});

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
$("#flight-meta").html('');
$("#skip-animation").hide();

async function main() {
    try {
        initMap();
        initTooltip();
        const airportReady = await fetchAirports();

        if (airportReady) {
            $("#start-spinner").hide();
            startGame();
        }
        else {
            console.error("fetching airport data failed!");
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function usernameValidate(){
    var usernameInput = $("#username-input").val();
    // console.log(usernameInput);
    if (usernameInput == "anonymous") {
        username = usernameInput;
        usernameOK();
        return;
    }

    $("#username-input").removeClass('is-invalid');
    if (usernameInput == ""){
        $("#username-input").addClass('is-invalid');
        return;
    }
    fetch(`${API_URL}validate_username/${gameId}/${usernameInput}`)
    .then(response => response.json())
    .then(data => {
        if (data.result){
            username = usernameInput;
            usernameOK();
        }
        else {
            $("#username-input").addClass('is-invalid');
        }
    })
}

function usernameOK() {
    $("#start-modal").modal('hide');
    
    let timeUsed = new Date(gameTime.getTime() - startingTime.getTime());
    postPlayerStat(timeUsed.getTime());

    confetti({
        particleCount: 200,
        spread: 180
    });
}

function viewSchedule(isOrigin = false) {
    const iata = isOrigin ? origin_iata : dest_iata;
    if (!iata) {
        return;
    }

    // Check if this is the same IATA as last time
    if (iata === lastViewedScheduleIata) {
        // Just show the modal without refreshing data
        $("#schedule-modal").modal('show');
        // Set current time in modal header
        $("#schedule-modal-time").text(`Local Time Now: ${toTimeFormat(localTime)}`);
        return;
    }

    // Update the last viewed IATA
    lastViewedScheduleIata = iata;

    // Show loading state
    $("#schedule-table-body").html('<tr><td colspan="7" class="text-center">Loading...</td></tr>');
    $("#schedule-modal").modal('show');
    
    // Set current time in modal header
    $("#schedule-modal-time").text(`Local Time Now: ${toTimeFormat(localTime)}`);

    // Fetch schedule data
    fetch(`${scheduleJsonUrl}${iata}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Schedule not available');
            }
            return response.json();
        })
        .then(data => {
            // Clear loading state
            $("#schedule-table-body").empty();

            // Update modal title
            $("#schedule-modal-label").text(`Flight Departures - ${iata}`);

            // Populate table
            data.forEach(flight => {
                const destAp = findApData(flight.destination_iata);
                const continent = destAp ? destAp.continent : '';
                $("#schedule-table-body").append(`
                    <tr data-departure="${flight.local_departure_time}" 
                        data-destination_city="${flight.destination_city}"
                        data-destination_country="${flight.destination_country}"
                        data-destination_iata="${flight.destination_iata}"
                        data-destination_continent="${continent}">
                        <td>${flight.local_departure_time}</td>
                        <td>${flight.local_arrival_time}</td>
                        <td><b>${flight.destination_iata}</b> - ${flight.destination_city}, ${flight.destination_country}</td>
                        <td>${flight.flight_number}</td>
                        <td>${flight.airline_name}</td>
                        <td>${flight.duration}</td>
                    </tr>
                `);
            });

            // If no flights found
            if (data.length === 0) {
                $("#schedule-table-body").html('<tr><td colspan="7" class="text-center">No flights available</td></tr>');
            } else {
                // Populate filter options
                const uniqueValues = {
                    destination_city: new Set(),
                    destination_country: new Set(),
                    destination_iata: new Set(),
                    destination_continent: new Set()
                };

                const continentNames = {
                    'AF': 'Africa',
                    'AN': 'Antarctica',
                    'AS': 'Asia',
                    'EU': 'Europe',
                    'NA': 'North America',
                    'OC': 'Oceania',
                    'SA': 'South America'
                };

                data.forEach(flight => {
                    uniqueValues.destination_city.add(flight.destination_city);
                    uniqueValues.destination_country.add(flight.destination_country);
                    uniqueValues.destination_iata.add(flight.destination_iata);
                    const destAp = findApData(flight.destination_iata);
                    if (destAp && destAp.continent) {
                        uniqueValues.destination_continent.add(destAp.continent);
                    }
                });

                // Update filter values when filter type changes
                $("#schedule-filter-type").on('change', function() {
                    const filterType = $(this).val();
                    const filterCheckboxes = $("#filter-checkboxes");
                    filterCheckboxes.empty();
                    
                    // Create checkboxes for each unique value
                    Array.from(uniqueValues[filterType]).sort().forEach(value => {
                        const displayValue = filterType === 'destination_continent' ? continentNames[value] : value;
                        filterCheckboxes.append(`
                            <div class="form-check">
                                <input class="form-check-input filter-checkbox" type="checkbox" value="${value}" id="filter-${value}" checked>
                                <label class="form-check-label w-100" for="filter-${value}" style="cursor: pointer;">
                                    ${displayValue}
                                </label>
                            </div>
                        `);
                    });

                    // Update dropdown button text
                    updateFilterButtonText();
                });

                $("#select-all").prop('checked', true);
                // Handle "Select All" checkbox
                $("#select-all").on('change', function() {
                    const isChecked = $(this).prop('checked');
                    $(".filter-checkbox").prop('checked', isChecked);
                    applyFilter();
                });

                // Handle individual checkbox changes
                $(document).on('change', '.filter-checkbox', function() {
                    const allChecked = $(".filter-checkbox:checked").length === $(".filter-checkbox").length;
                    $("#select-all").prop('checked', allChecked);
                    applyFilter();
                });

                // Function to apply the filter
                function applyFilter() {
                    const filterType = $("#schedule-filter-type").val();
                    const selectedValues = $(".filter-checkbox:checked").map(function() {
                        return $(this).val();
                    }).get();
                    
                    $("#schedule-table-body tr").each(function() {
                        const rowValue = $(this).data(filterType);
                        if (selectedValues.length === 0 || selectedValues.includes(rowValue)) {
                            $(this).show();
                        } else {
                            $(this).hide();
                        }
                    });

                    updateFilterButtonText();
                }

                // Function to update the dropdown button text
                function updateFilterButtonText() {
                    const total = $(".filter-checkbox").length;
                    const selected = $(".filter-checkbox:checked").length;
                    const buttonText = selected === total ? "All Selected" : `${selected} of ${total} Selected`;
                    $("#filterDropdown").text(buttonText);
                }

                // Trigger initial filter options
                $("#schedule-filter-type").trigger('change');

                // Add scroll event listener for tooltip
                const tableContainer = document.querySelector('.table-responsive');
                const tooltip = document.createElement('div');
                tooltip.className = 'scroll-tooltip';
                tooltip.style.cssText = `
                    position: fixed;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    pointer-events: none;
                    z-index: 9999;
                    display: none;
                `;
                document.body.appendChild(tooltip);

                tableContainer.addEventListener('scroll', () => {
                    const rows = tableContainer.querySelectorAll('tbody tr');
                    const containerRect = tableContainer.getBoundingClientRect();
                    const scrollTop = tableContainer.scrollTop;
                    const containerHeight = tableContainer.clientHeight;
                    
                    // Find the row that's currently at the top of the visible area
                    let currentRow = null;
                    let minDistance = Infinity;
                    
                    rows.forEach(row => {
                        const rowRect = row.getBoundingClientRect();
                        const distance = Math.abs(rowRect.top - containerRect.top);
                        if (distance < minDistance) {
                            minDistance = distance;
                            currentRow = row;
                        }
                    });

                    if (currentRow) {
                        const departureTime = currentRow.dataset.departure;
                        tooltip.textContent = `Departure: ${departureTime}`;
                        tooltip.style.display = 'block';
                        
                        // Position tooltip near the scrollbar
                        const scrollbarX = containerRect.right - 20;
                        const scrollbarY = containerRect.top + (scrollTop / tableContainer.scrollHeight) * containerHeight;
                        tooltip.style.left = `${scrollbarX}px`;
                        tooltip.style.top = `${scrollbarY}px`;
                    }
                });

                // Hide tooltip when not scrolling
                let scrollTimeout;
                tableContainer.addEventListener('scroll', () => {
                    clearTimeout(scrollTimeout);
                    tooltip.style.display = 'block';
                    scrollTimeout = setTimeout(() => {
                        tooltip.style.display = 'none';
                    }, 1000);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching schedule:', error);
            $("#schedule-table-body").html('<tr><td colspan="7" class="text-center text-danger">Failed to load schedule</td></tr>');
        });
}

document.addEventListener('DOMContentLoaded', (event) => {
    // $("#start-modal").modal('show');
    main();
});
