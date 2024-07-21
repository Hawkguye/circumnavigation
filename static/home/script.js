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

function startFreegame(){
    let startIata = $("#freegame-iata").val();
    let startTime = $("#freegame-time").val();
    startTime += ':00Z';
    console.log(startTime);

    let iataRe = /^[a-zA-Z]{3}$/;
    let dateRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    // Validate IATA code format
    if (!iataRe.test(startIata)) {
        alert("Starting Airport doesn't match the IATA format!");
        return;
    }
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
    let currentDate = new Date().toISOString().split('T')[0] + 'T00:00';
    $("#freegame-time").val(currentDate);
}

fetchDC();
initTime();