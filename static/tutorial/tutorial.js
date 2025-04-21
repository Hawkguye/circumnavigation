const tutorialObj = [
    { // 0
        "text": `
            <h4>Welcome to Circumnavigation!</h4>
            <p>
            Circumnavigation is a daily challenge game where you try to <b>go around the world</b> in the shortest time possible!
            </p>
            <p>
            You gain budget by <b>completing challenges</b>, then you use the budget to buy plane tickets and afford taxis.
            </p>
        `,
        "next": true
    },
    { // 1
        "text": `
            <h5>To win the game, you need to accomplish these goals:</h5>
            <ul class="mt-1">
                <li>
                    You must <b>complete the journey</b> at the point of departure. 
                </li>
                <li>
                    Your route must covered the distance of <b>36788 km (22859 miles)</b> (the length of the Tropic of Cancer).
                </li>
                <li>
                    Your route must crossed <b>all meridians</b>.
                </li>
            </ul>
        `,
        "next": true
    },
    { // 2
        "text": `
            <h6>Your <b>location</b> right now is <b>Denver</b> International Airport <b>(DEN)</b>, as you can see right here.</h6>
        `,
        "highlight": "#origin-airport-div",
        "next": true
    },
    { // 3
        "text": `
            <h6>All the information of your current stutus can be found <b>at the top.</b></h6>
        `,
        "navbar": true,
        "next": true
    },
    { // 4
        "text": `
            <h6>The current <b>in-game time</b> can be found here, now the <b>local time</b> is 5 AM, and the <b>UTC time</b> is 12 PM.</h6>
            <small>PS: When you're traveling around the world, it's good to use UTC time to keep track of time, while flight operations are based on local time.</small>
        `,
        "highlight": "#time-display-div",
        "navbar": true,
        "next": true
    },
    { // 5
        "text": `
            <h6>The distance you've covered is displayed here.</h6>
            <p>Remember: you have to travel <b>36788 km</b> to complete the circumnavigation.</p>
            <small>PS: The bar will turn green if you've accomplished the goal.</small>
        `,
        "highlight": "#distance-display-div",
        "navbar": true,
        "next": true
    },
    { // 6
        "text": `
            <h6>Your current budget is displayed here.</h6>
            <p>You have to use the budget to buy plane tickets and afford taxis.</p>
        `,
        "highlight": "#budget-display-div",
        "navbar": true,
        "next": true
    },
    { // 7
        "text": `
            <h6>To gain more budget, click the <b>logo</b> to pull up the challenge board.</h6>
        `,
        "highlight": "#nav-central-div",
        "navbar": true,
        "interact": true,
        "next": false
    },
    { // 8
        "text": `
            <h6>Every time you arrive at a new airport, the challenge deck will generate <b>3 new challenges</b>.</h6>
            <p>You can complete these challenges to gain budget.</p>
            <p>Remember: Challenges also <b>take in-game time</b>. Don't miss your flight! Check in closes <b>45 minutes</b> prior to departure time.</p>
        `,
        "interact": false,
        "next": true
    },
    { // 9
        "text": `
            <h6>Now, let's take a look at the map</h6>
        `,
        "highlight": "#map",
        "interact": false,
        "next": true
    },
    { // 10
        "text": `
            <h6>Each dot on the map is an airport.</h6>
            <ul class="mt-1">
                <li>
                    <b style="color: red;">Red</b> dot means that the airport has more than 100 destinations.
                </li>
                <li>
                    <b style="color: orange;">Yellow</b> dot means that the airport has more than 50 destinations, but less than 100.
                </li>
                <li>
                    <b style="color: blue;">Blue</b> dot means that the airport has less than 50 destinations.
                </li>
            </ul>
            <small>PS: The destination data may not be accurate. Sometimes cheaper flights can be found in smaller airports.</small>
        `,
        "highlight": "#map",
        "interact": false,
        "next": true
    },
    { // 11
        "text": `
            <h6>Now, let's book a flight to New York La Guardia Airport (LGA).</h6>
            <p>Click on the blue dot on the map, that's LGA airport in New York.</p>
        `,
        "highlight": "#map",
        "interact": true,
        "next": false
    },
    { // 12
        "text": `
            <h6>Good. Now you're searching the flights from DEN to LGA.</h6>
            <p>Note: All the flight data are scraped from Google Flights by the backend server in real time. So it may take a while.</p>
        `,
        "highlight": "#flights-div",
        "interact": false,
        "next": false
    },
    { // 13
        "text": `
            <h6>All the flight information are now displayed.</h6>
            <h6><b>Book the first flight</b> from DEN to LGA.</h6>
        `,
        "highlight": "#first-flight-div",
        "interact": true,
        "next": false
    },
    { // 14
        "text": `
            <h6>Hooray! Now you're on your flight to New York!</h6>
            <p>Now, wait for your flight to arrive.</p>
        `,
        "highlight": "#map",
        "interact": false,
        "next": false
    },
    { // 15
        "text": `
            <h6>Welcome to New York!</h6>
            <p>Now, you may have noticed something. La Guardia Airport isn't a international airport, it doesn't have any international flights. So how are we able to go onward to Europe?</p>
        `,
        "highlight": "#map",
        "interact": false,
        "next": true
    },
    { // 16
        "text": `
            <h6>Well, since most of the international flights from New York are departed from JFK airport, we're going to JFK airport (John F. Kennedy International Airport).</h6>
            <h6><b>Click on the red dot on the right</b>, that's JFK airport.</h6>
        `,
        "highlight": "#map",
        "interact": true,
        "next": false
    },
    { // 17
        "text": `
            <h6>We'll go there by taxi.</h6>
            <p><b>Click on "Ground transportation".</b></p>
        `,
        "highlight": "#flights-div",
        "interact": true,
        "next": false
    },
    { // 18
        "text": `
            <h6>Awesome! Now you have many options to fly to Europe.</h6>
            <p>Now, finish the circumnavigation! Complete challenges to gain budget, and hit the 36788 km distance goal!</p>
        `,
        "highlight": "#map",
        "interact": false,
        "next": true
    }
];

var tutorialStep = 0;

function startTutorial(){
    $("#tutorial-hud").modal('show');
    $("#tutorial-text").html(tutorialObj[tutorialStep].text);
    $('.modal-backdrop').css("z-index", 900);
    $("#tutorial-back-btn").addClass("disabled");

}

function prevTutorial(){
    if (tutorialStep === 0) {
        return;
    }
    removeHighlight(tutorialStep);
    tutorialStep--;
    console.log(tutorialStep);

    if (!tutorialObj[tutorialStep].next || tutorialStep === 0) {
        $("#tutorial-back-btn").addClass("disabled");
    }
    else {
        $("#tutorial-back-btn").removeClass("disabled");
    }

    if (tutorialObj[tutorialStep].next) {
        $("#tutorial-continue-btn").removeClass("disabled");
    }
    else {
        $("#tutorial-continue-btn").addClass("disabled");
    }

    $("#tutorial-text").html(tutorialObj[tutorialStep].text);
    addHighlight(tutorialStep);
}

function nextTutorial(){
    removeHighlight(tutorialStep);
    if (tutorialStep === 8){
        $("#challange-modal").modal("hide");
    }
    if (!tutorialObj[tutorialStep].next) {
        $("#tutorial-back-btn").addClass("disabled");
    }
    else {
        $("#tutorial-back-btn").removeClass("disabled");
    }
    if (tutorialStep === 18){
        $("#tutorial-hud").modal('hide');

        window.location.replace("../game/1");

        return;
    }

    tutorialStep++;
    console.log(tutorialStep);

    if (tutorialObj[tutorialStep].next) {
        $("#tutorial-continue-btn").removeClass("disabled");
    }
    else {
        $("#tutorial-continue-btn").addClass("disabled");
    }

    $("#tutorial-text").html(tutorialObj[tutorialStep].text);
    addHighlight(tutorialStep);

    if (tutorialStep === 11) { // click on LGA
        map.setView([40.7, -73.4], 9);
        tutorialAllowedIata = "LGA";
        $("#tutorial-dialog").removeClass('hud-bottom').addClass('hud-bottom-right');
    }
    if (tutorialStep === 12) {
        $("#tutorial-dialog").removeClass('hud-bottom-right').addClass('hud-bottom');
    }
    if (tutorialStep === 14) { // en route from DEN-LGA
        $("#tutorial-dialog").removeClass('hud-bottom').addClass('hud-top');
    }
    if (tutorialStep === 15) { // at LGA
        map.setView([50.4, -22.7], 3);

    }
    if (tutorialStep === 16) { // click on JFK
        map.setView([40.7, -73.4], 9);
        tutorialAllowedIata = "JFK";
    }
    if (tutorialStep === 17) {
        $("#tutorial-dialog").removeClass('hud-top').addClass('hud-bottom');
    }
    if (tutorialStep === 18) { // click on JFK
        $("#tutorial-dialog").removeClass('hud-bottom').addClass('hud-top');
        map.setView([50.4, -22.7], 3);
        tutorialAllowedIata = "";
        $("#tutorial-continue-btn").text("Finish");
    }
}

function addHighlight(stepIndex) {
    let tutorial = tutorialObj[stepIndex];
    if (tutorial.navbar) {
        $('#hud-navbar').css("z-index", 999);
    }
    if (tutorial.highlight) {
        if (!tutorial.navbar){
            if (tutorialStep === 13) {
                document.querySelector('#origin-airport-div').scrollIntoView(true);
            }
            else document.querySelector(tutorial.highlight).scrollIntoView(false);
            $(tutorial.highlight).css("z-index", 999).css("background-color", "white");
        }
        else {
            $(tutorial.highlight).css("background-color", "yellow");
        }
    }
    if (tutorial.interact) {
        $('.modal').css("pointer-events", "none");
    }
}

function removeHighlight(stepIndex){
    let tutorial = tutorialObj[stepIndex];
    if (tutorial.navbar) {
        $('#hud-navbar').css("z-index", "");
    }
    if (tutorial.highlight) {
        if (!tutorial.navbar){
            $(tutorial.highlight).css("z-index", "");
        }
        else {
            $(tutorial.highlight).css("background-color", "");
        }
    }
    if (tutorial.interact) {
        $('.modal').css("pointer-events", "");
    }
}

function tutorialOpenChallenge(){
    if (!clickAllowed){
        return;
    }
    $("#challange-modal").modal("show");
    if (lastIata != origin_iata) {
        lastIata = origin_iata;
        drawNewChallenges();
    }

    if (tutorialStep === 7) {
        nextTutorial();
        // $("#challange-modal").css("z-index", 800);

    }
}