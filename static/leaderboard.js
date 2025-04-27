var airportArray;
var markersArray = {};
var leaderboardPolyline = [];

function findApData(iata_code){
    return airportArray.find(airport => airport.iata_code == iata_code);
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

let origin_iata;
let dest_iata;
let origin_latlng = [];
let dest_latlng = [];

function drawLeaderboardRoute(route) {
    // Draw each leg of the route
    for (let i = 0; i < route.length - 1; i++) {
        const originAp = findApData(route[i]);
        const destAp = findApData(route[i + 1]);
        
        if (originAp && destAp) {
            
            origin_iata = route[i];
            dest_iata = route[i + 1];
            origin_latlng = [originAp.longitude, originAp.latitude];
            dest_latlng = [destAp.longitude, destAp.latitude];
            
            // Draw the route line with route data
            drawRouteLine([destAp.longitude, destAp.latitude], 'leaderboard', route);
            
        }
    }
    
    map.setView([20, 0], 2); // Center on lat 20, lng 0 at zoom level 2 to show most of world
}

function drawRouteLine(dest_latlng, opt, route) {
    // @ts-ignore
    var lineFrom = turf.point(origin_latlng);
    // @ts-ignore
    var lineTo = turf.point(dest_latlng);

    // @ts-ignore
    var routeDistance = Math.round(turf.distance(lineFrom, lineTo));
    var options = { npoints: Math.floor(routeDistance / 100) + 3, units: 'kilometers' };

    // @ts-ignore
    var arc = turf.greatCircle(lineFrom, lineTo, options);
    var coordinates = arc.geometry.coordinates;

    function drawPolyline(latlngs, shiftLng = 0) {
        let shiftedLatLngs = latlngs.map(([lng, lat]) => [lat, lng + shiftLng]);

        let polyline;
        if (opt === 'leaderboard') {
            polyline = L.polyline(shiftedLatLngs.map(c => [c[0], c[1]]), {color: 'red'}).addTo(map);
            polyline.routeData = route; // Store the route data with the polyline
            leaderboardPolyline.push(polyline);
        }
    }

    if (coordinates.length === 2) {
        // Crosses dateline: Turf.js splits into 2 segments
        coordinates.forEach((lineCoords, idx) => {
            drawPolyline(lineCoords, 0);      // original
            drawPolyline(lineCoords, -360);  // shifted left
            drawPolyline(lineCoords, 360);   // shifted right
        });
    } else {
        // Normal arc (single segment)
        drawPolyline(coordinates, 0);      // original
        drawPolyline(coordinates, -360);  // shifted left
        drawPolyline(coordinates, 360);   // shifted right
    }
}

async function getLeaderboard(){
    fetch(`${API_URL}get_game_data?gameId=${gameId}`)
        .then(response => response.json())
        .then(data => {
            var playerStatArr = data.playerStats;
            playerStatArr.sort((a, b) => {
                return a.timeUsed - b.timeUsed;
            });

            for (let i = 0; i < playerStatArr.length; i++){
                let playerStat = playerStatArr[i];
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

async function main() {
    try {
        initMap();
        const airportReady = await fetchAirports();

        if (airportReady){
            getLeaderboard();
        }
        else {
            console.error("fetching airport data failed!");
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    main();
});

let markersVisible = true;

function toggleMarkers() {
    markersVisible = !markersVisible;
    const button = document.getElementById('toggle-markers');
    
    if (markersVisible) {
        button.textContent = 'Hide Markers';
        Object.values(markersArray).forEach(marker => {
            marker.addTo(map);
        });
    } else {
        button.textContent = 'Show Markers';
        Object.values(markersArray).forEach(marker => {
            map.removeLayer(marker);
        });
    }
} 