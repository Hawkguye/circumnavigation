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


fetchDC();