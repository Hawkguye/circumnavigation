
var map = L.map('map').setView([0, 0], 2);
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
    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        maxZoom: 10,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    map.setMaxBounds(  [[-90,-180],   [90,180]]  );
    map.setZoom(2);
}

async function fetchAirports() {
    try {
        const response = await fetch(airportsJsonUrl);
        const data = await response.json();
        
        airportArray = data;
        data.sort((a, b) => {
            a.dest_count - b.dest_count
        });
        
        data.forEach(function(pinData) {
            var marker = L.marker([pinData.latitude, pinData.longitude], {icon: getSpot(pinData), title: pinData.iata_code});
            // markers.addLayer(marker);
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
                // console.log('Pin clicked:', pinData.iata_code);
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

        return true;

    } catch (error) {
        console.error("Unable to fetch data:", error);
        return false;
    }
}


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