
// TODO: Improve this
const tutorialObj = [
    { // 0
        "text": `
            <h4>Welcome to Circumnavigation!</h4>
            <p>
            This is a daily game where you try to <b>travel around the world</b> as fast as you can!
            </p>
            <p>
            Earn money by <b>completing challenges</b>. Use that money to buy plane tickets and pay for taxis.
            </p>
        `,
        "next": true
    },
    { // 1
        "text": `
            <h5>To win the game, you need to:</h5>
            <ul class="mt-1">
                <li>
                    <b>Return to your starting point</b> after traveling around the world.
                </li>
                <li>
                    Travel at least <b>36,788 km (22,859 miles)</b> — the distance around the Earth at the Tropic of Cancer.
                </li>
                <li>
                    <b>Cross every line of longitude</b> on the map.
                </li>
            </ul>
        `,
        "next": true
    },
    { // 2
        "text": `
            <h6>Your journey starts at <b>Denver International Airport (DEN)</b>. You can see it marked here.</h6>
        `,
        "highlight": "#origin-airport-div",
        "next": true
    },
    { // 3
        "text": `
            <h6>You can see your current status <b>at the top of the screen</b>.</h6>
        `,
        "navbar": true,
        "next": true
    },
    { // 4
        "text": `
            <h6>This is the <b>current in-game time</b>. Right now it's 5 AM local time (UTC-7) and 12 PM UTC (Coordinated Universal Time).</h6>
            <small>Tip: Timezones are a mess, use UTC to stay on schedule. Flights follow local time, so plan carefully!</small>
        `,
        "highlight": "#time-display-div",
        "navbar": true,
        "next": true
    },
    { // 5
        "text": `
            <h6>This shows how far you've traveled so far.</h6>
            <p>You need to travel <b>36,788 km</b> to complete the circumnavigation.</p>
            <small>The bar turns green when you reach your goal!</small>
        `,
        "highlight": "#distance-display-div",
        "navbar": true,
        "next": true
    },
    { // 6
        "text": `
            <h6>This is your current budget.</h6>
            <p>You’ll spend it on flights and taxis, so use it wisely!</p>
        `,
        "highlight": "#budget-display-div",
        "navbar": true,
        "next": true
    },
    { // 7
        "text": `
            <h6>Need more budget?</h6>
            <p><b>Click the logo</b> at the top to open the challenge board.</p>
        `,
        "highlight": "#nav-central-div",
        "navbar": true,
        "interact": true,
        "next": false
    },
    { // 8
        "text": `
            <h6>Every time you land at a new airport, you’ll get <b>3 new challenges</b>.</h6>
            <p>Complete them to earn more budget.</p>
            <p><b>Watch the clock!</b> Challenges take time. Check-in closes <b>45 minutes</b> before your flight leaves. Don't miss your desired flight!</p>
        `,
        "interact": false,
        "next": true
    },
    { // 9
        "text": `
            <h6>Let’s check out the map.</h6>
        `,
        "highlight": "#map",
        "interact": false,
        "next": true
    },
    { // 10
        "text": `
            <h6>Each dot is an airport.</h6>
            <ul class="mt-1">
                <li>
                    <b style="color: red;">Red</b> = over 100 destinations.
                </li>
                <li>
                    <b style="color: orange;">Yellow</b> = 51 to 100 destinations.
                </li>
                <li>
                    <b style="color: blue;">Blue</b> = 50 or fewer destinations.
                </li>
            </ul>
        `,
        "highlight": "#map",
        "interact": false,
        "next": true
    },
    { // 11
        "text": `
            <h6>Let’s book a flight to New York’s LaGuardia Airport (LGA).</h6>
            <p>Click the <b>blue dot</b> on the map for LGA.</p>
        `,
        "highlight": "#map",
        "interact": true,
        "next": false
    },
    { // 12
        "text": `
            <h6>Great! You're now searching flights from Denver (DEN) to New York (LGA).</h6>
            <p>Note: The game uses real-time data from Google Flights, so it might take a moment to load.</p>
        `,
        "highlight": "#flights-div",
        "interact": false,
        "next": false
    },
    { // 13
        "text": `
            <h6>Your flight options are now shown.</h6>
            <h6><b>Click to book the first available flight</b> from DEN to LGA.</h6>
        `,
        "highlight": "#first-flight-div",
        "interact": true,
        "next": false
    },
    { // 14
        "text": `
            <h6>Nice! You’re on your way to New York!</h6>
            <p>Sit back and wait for your arrival.</p>
        `,
        "highlight": "#map",
        "interact": false,
        "next": false
    },
    { // 15
        "text": `
            <h6>Welcome to New York!</h6>
            <p>But LaGuardia Airport doesn’t have international flights. So, how do we go onwards to Europe?</p>
        `,
        "highlight": "#map",
        "interact": false,
        "next": true
    },
    { // 16
        "text": `
            <h6>We’ll head to <b>JFK Airport</b> for international flights.</h6>
            <p><b>Click the red dot</b> to the right to go to JFK.</p>
        `,
        "highlight": "#map",
        "interact": true,
        "next": false
    },
    { // 17
        "text": `
            <h6>We’re taking a taxi to get there.</h6>
            <p><b>Click “Ground transportation”.</b></p>
        `,
        "highlight": "#flights-div",
        "interact": true,
        "next": false
    },
    { // 18
        "text": `
            <h6>Awesome! Now you have lots of flight options to Europe.</h6>
            <p>Keep completing challenges and traveling until you finish the journey around the world!</p>
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