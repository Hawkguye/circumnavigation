
var map = L.map('map', {worldCopyJump: true}).setView([0, 0], 2);
const departurePin = L.icon({
    iconUrl: `${imgDir}departure_pin.png`,

    iconSize: [18, 27],
    iconAnchor: [10, 27]
});
const arrivalPin = L.icon({
    iconUrl: `${imgDir}arrival_pin.png`,

    iconSize: [18, 27],
    iconAnchor: [10, 27]
});
const redSpot = L.icon({
    iconUrl: `${imgDir}red-spot.png`,
    iconSize: [15, 15]
});
const yellowSpot = L.icon({
    iconUrl: `${imgDir}yellow-spot.png`,
    iconSize: [12, 12]
});
const blueSpot = L.icon({
    iconUrl: `${imgDir}blue-spot.png`,
    iconSize: [10, 10]
});

const selectPathOption = {
    color: 'red'
};
const destsPathOption = {
    color: '#7a7a7a',
    opacity: 0.5
};
const destsPathOptionv2 = {
    color: '#24829c',
    opacity: 0.7
};

function getSpot(pinData){
    if (pinData.dest_count >= 100){
        return redSpot;
    }
    else if(pinData.dest_count >= 50){
        return yellowSpot;
    }
    else {
        return blueSpot;
    }
}

function initMap(){
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        minZoom: 1,
        maxZoom: 10,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    // map.setMaxBounds(  [[-90,-180],   [90,180]]  );
    map.setZoom(2);
}

let airportMarkersGroup = L.layerGroup(); // Create an empty group at the top
let blueMarkersGroup = L.layerGroup(); // Create an empty group at the top

let airportMarkerVis = true;

function zoomHandler() {
    const zoom = map.getZoom();
    // console.log(zoom);
    if (zoom <= 2 && airportMarkerVis == true) {
        map.removeLayer(blueMarkersGroup);
        airportMarkerVis = false;
    } else if (zoom > 2 && airportMarkerVis == false) {
        map.addLayer(blueMarkersGroup);
        airportMarkerVis = true;
    }
}

async function fetchAirports() {
    try {
        const response = await fetch(airportsJsonUrl);
        const data = await response.json();
        
        airportArray = data;
        data.sort((a, b) => a.dest_count - b.dest_count);

        data.forEach(function(pinData) {
            const positions = [
                [pinData.latitude, pinData.longitude],
                [pinData.latitude, pinData.longitude - 360],
                [pinData.latitude, pinData.longitude + 360]
            ];

            positions.forEach((pos, index) => {
                const marker = L.marker(pos, {
                    icon: getSpot(pinData),
                    title: pinData.iata_code + (index === 0 ? "" : ` (copy ${index})`)
                });

                // Add each marker to the LayerGroup instead of directly to the map
                if (pinData.dest_count < 50) blueMarkersGroup.addLayer(marker);
                else airportMarkersGroup.addLayer(marker);

                // Only store original marker for interactions (optional)
                if (index === 0) {
                    markersArray[pinData.iata_code] = marker;

                    marker.on('click', function(e) {
                        selectedAp = pinData.iata_code;
                        clickedPin(pinData.iata_code, e.target);
                    });
                }

                marker.bindTooltip(
                    `<b>${pinData.iata_code}</b><br>${pinData.name}<br>${pinData.municipality}, ${pinData.iso_country}<br>Potential destinations: ${pinData.dest_count}`,
                    {
                        direction: 'top',
                        opacity: 0.6,
                        offset: L.point(0, -8)
                    }
                );
            });
        });

        // Add the whole group to the map initially
        airportMarkersGroup.addTo(map);
        blueMarkersGroup.addTo(map);


        // Hide/show the group based on zoom
        map.on('zoomend', zoomHandler);

        return true;

    } catch (error) {
        console.error("Unable to fetch data:", error);
        return false;
    }
}

const timezoneJsonUrl = "https://raw.githubusercontent.com/vvo/tzdb/main/raw-time-zones.json";
async function fetchTimezoneInfo() {
    try {
        const response = await fetch(timezoneJsonUrl);
        const data = await response.json();
        timezoneArray = data;
        // console.log("finished fetching timezone");
        return true;
    } catch (error) {
        console.error('Error fetching timezone:', error);
        return false;
    }
}

function initTooltip(){
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

    // log button
    const logEl = document.getElementById('log-button')
    const tooltip = new bootstrap.Tooltip(logEl, {
        placement: 'bottom',
        title: 'Flight Log'
    });
}