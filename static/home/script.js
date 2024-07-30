async function fetchDC(){
    $("#daily-challenge-table").html("<small>loading...</small>");
    fetch(`${API_URL}get_dc`)
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            $("#daily-challenge-table").html(`<b>${data.message}</b>`);
            return;
        }
        console.log(data);
        var endTime = data.endTime;
        $("#countdown").countdown(endTime, function(event) {
            $(this).html(event.strftime('%H:%M:%S'));
        });
        fetchMeta(data.gameId);
    })
    .catch(error => console.error(`Unable to fetch data:`, error));
}

async function fetchMeta(gameId){
    fetch(`${API_URL}get_game_meta/${gameId}`)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        $("#daily-challenge-table").html('');

        $("#daily-challenge-table").append(`
            <tr id="daily-challenge-${gameId}">
                <th scope="row">${gameId}</th>
                <td>${data.orgIata}</td>
                <td>${data.startingTime}</td>
                <td><a href="/game/${gameId}">Play</a></td>
            </tr>
        `)
        
        
        $(`#daily-challenge-${gameId}`).on('click', function(){
            window.location.href = `/game/${gameId}`;
        });

    })
    .catch(error => console.error(`Unable to fetch data:`, error));

}

var ICAO_codes = ['ACC', 'ACE', 'ADB', 'ADD', 'ADL', 'AER', 'AGP', 'AKL', 'ALA', 'ALC', 'ALG', 'AMM', 'AMS', 'ANC', 'ARN', 'ATH', 'ATL', 'AUA', 'AUH', 'AUS', 'AYT', 'BAH', 'BCN', 'BDS', 'BEG', 'BER', 'BEY', 'BFS', 'BGO', 'BGW', 'BGY', 'BHX', 'BJV', 'BJX', 'BKK', 'BLL', 'BLQ', 'BLR', 'BNA', 'BNE', 'BOD', 'BOG', 'BOJ', 'BOM', 'BOS', 'BRI', 'BRU', 'BSB', 'BSL', 'BUD', 'BUF', 'BWI', 'BWN', 'BZE', 'CAG', 'CAI', 'CAN', 'CCS', 'CCU', 'CDG', 'CEB', 'CGK', 'CGN', 'CGO', 'CGQ', 'CKG', 'CLE', 'CLT', 'CMB', 'CMH', 'CMN', 'CNF', 'COK', 'CPH', 'CPT', 'CSX', 'CTA', 'CTS', 'CTU', 'CUN', 'CUR', 'CVG', 'DAC', 'DAR', 'DCA', 'DEL', 'DEN', 'DFW', 'DLC', 'DLM', 'DME', 'DMK', 'DMM', 'DOH', 'DPS', 'DSS', 'DTW', 'DUB', 'DUS', 'DXB', 'EBB', 'EDI', 'EIN', 'ESB', 'EVN', 'EWR', 'EZE', 'FAO', 'FCO', 'FLL', 'FNC', 'FOC', 'FRA', 'FRU', 'FUE', 'FUK', 'GCM', 'GDL', 'GDN', 'GIG', 'GLA', 'GOI', 'GOT', 'GRU', 'GUA', 'GVA', 'GYD', 'GYE', 'HAJ', 'HAK', 'HAM', 'HAN', 'HAV', 'HEL', 'HER', 'HET', 'HGH', 'HKG', 'HKT', 'HMO', 'HND', 'HNL', 'HRB', 'HRG', 'HYD', 'IAD', 'IAH', 'IBZ', 'ICN', 'IKA', 'IND', 'ISB', 'IST', 'JAX', 'JED', 'JFK', 'JNB', 'KEF', 'KGL', 'KHH', 'KHI', 'KHN', 'KIN', 'KIX', 'KMG', 'KRK', 'KRT', 'KTM', 'KUF', 'KUL', 'KWE', 'KWI', 'KWL', 'KZN', 'LAD', 'LAS', 'LAX', 'LCA', 'LED', 'LEJ', 'LGA', 'LGW', 'LHE', 'LHR', 'LHW', 'LIM', 'LIR', 'LIS', 'LJU', 'LOS', 'LPA', 'LTN', 'LUX', 'LYS', 'MAA', 'MAD', 'MAN', 'MBA', 'MCI', 'MCO', 'MCT', 'MDW', 'MED', 'MEL', 'MEM', 'MEX', 'MFM', 'MIA', 'MKE', 'MLA', 'MLE', 'MNL', 'MRS', 'MRU', 'MSP', 'MSQ', 'MSY', 'MTY', 'MUC', 'MXP', 'MZT', 'NAP', 'NAS', 'NBO', 'NCE', 'NGB', 'NGO', 'NKG', 'NNG', 'NQZ', 'NRT', 'NUE', 'OAK', 'OMA', 'ONT', 'OPO', 'ORD', 'ORY', 'OSL', 'OTP', 'OVB', 'PAP', 'PBI', 'PDX', 'PEK', 'PER', 'PHL', 'PHX', 'PIT', 'PKX', 'PLS', 'PMI', 'PMO', 'PNH', 'PRG', 'PSA', 'PTY', 'PUJ', 'PUS', 'PVD', 'PVG', 'PVR', 'PWM', 'RDU', 'RGN', 'RIC', 'RIX', 'RNO', 'ROV', 'RSW', 'RUH', 'SAL', 'SAN', 'SAT', 'SAV', 'SAW', 'SCL', 'SCQ', 'SDF', 'SDQ', 'SEA', 'SEZ', 'SFB', 'SFO', 'SGN', 'SHA', 'SHE', 'SHJ', 'SID', 'SIN', 'SJC', 'SJD', 'SJU', 'SKG', 'SKP', 'SLC', 'SMF', 'SNA', 'SOF', 'SSH', 'STL', 'STN', 'STR', 'SVG', 'SVO', 'SVX', 'SXM', 'SYD', 'SYR', 'SYX', 'SZX', 'TAO', 'TAS', 'TBS', 'TFS', 'TFU', 'TGD', 'TIA', 'TIJ', 'TLL', 'TLS', 'TLV', 'TNA', 'TOS', 'TPA', 'TPE', 'TRD', 'TRN', 'TRV', 'TSN', 'TUL', 'TUN', 'TYN', 'UFA', 'UIO', 'URC', 'VAR', 'VCE', 'VIE', 'VKO', 'VNO', 'VRN', 'WAW', 'WNZ', 'WUH', 'XIY', 'XMN', 'YEG', 'YHZ', 'YNT', 'YOW', 'YUL', 'YVR', 'YWG', 'YYC', 'YYZ', 'ZAG', 'ZIA', 'ZNZ', 'ZRH'];
function startFreegame(){
    let startIata = $("#freegame-iata").val().toUpperCase();
    let startTime = $("#freegame-time").val();
    startTime += ':00Z';
    // console.log(startTime);

    if (!ICAO_codes.includes(startIata)){
        alert('No such airport! (IATA not valid)');
        return;
    }

    let dateRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    // Validate date format
    if (!dateRe.test(startTime)) {
        alert("Starting Time doesn't match the format! (YYYY-MM-DDThh:mm:ssZ)");
        return;
    }

    // Check if the date is prior to today's time
    let inputDate = new Date(startTime);
    let currentDate = new Date();
    if (isNaN(inputDate.getTime())) {
        alert("Invalid date format!");
        return;
    }
    if (inputDate < currentDate) {
        alert("Starting Time is prior to the current time!");
        return;
    }

    window.location.href = `/freegame?org=${startIata}&date=${startTime}`;
}

function initTime(){
    let currentDate = new Date();
    let targetDate = new Date(currentDate.getTime() + 2*86400000).toISOString().split('T')[0] + 'T00:00';
    $("#freegame-time").val(targetDate);
}

fetchDC();
initTime();