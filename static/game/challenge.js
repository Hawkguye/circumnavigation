// const API_URL = "http://127.0.0.1:5000/api/"

const delay = ms => new Promise(res => setTimeout(res, ms));

const challengeCards = [
    // index: 0
    // placeholder card 
    `
    <div class="card challange-card" style="height: 350px;">
        <div class="card-body text-center">
            <div class="placeholder-glow">
                <h5 class="card-title">
                    {title}
                </h5>
                <h6 class="text-end"><span class="placeholder col-6 placeholder-sm"></span></h6>
            </div>
            <div class="container border-bottom border-info mb-2 placeholder-glow">
                <span class="placeholder col-6"></span>
                <select class="form-select form-select-sm mb-2 placeholder col-8"></select>
            </div>
            <p class="card-text placeholder-glow">
                <span class="placeholder col-7"></span>
                <span class="placeholder col-4"></span>
                <span class="placeholder col-4"></span>
                <span class="placeholder col-6"></span>
            </p>
        </div>
        <div class="card-body border-top d-flex justify-content-between">
            <div class="container placeholder-glow">
                <span class="placeholder col-6"></span>
                <select class="form-select form-select-sm mb-2  placeholder col-6"></select>
            </div>
            <button class="btn btn-primary ms-auto disabled placeholder col-3"></button>
        </div>
    </div>
    `,
    // index: 1
    // trivia card -- General Knowledge
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}trivia.png" class="card-img-top" alt="trivia">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Trivia Questions!</h5>
                <h6 class="text-end my-0"><b>-- General Knowledge</b></h6>
                <small class="fw-light">Questions sourced from <a href="https://opentdb.com/" target="_blank" rel="noopener noreferrer">Opentdb</a></small>
            </div>
            <p class="card-text">Answer up to <b>10</b> trivia questions!<br>
            Each question takes <b>5 minutes</b> of game time.</p>
        </div>
        <div class="card-body border-top d-flex justify-content-between">
            <div class="container" id="trivia-difficulty-container">
                <label for="trivia-difficulty-selector"><b>Choose the difficulty:</b></label>
                <select class="form-select form-select-sm mb-2" id="trivia-difficulty-selector">
                    <option value="">All difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
            </div>
            <button class="btn btn-primary ms-auto" id="trivia-start-button-{id}">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $<b id="trivia-reward">100</b> per question</h6>
        </div>
    </div>
    `,
    // index: 2
    // trivia card -- All Categories
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}trivia.png" class="card-img-top" alt="trivia">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Trivia Questions!</h5>
                <h6 class="text-end"><b>-- All Categories</b></h6>
                <small class="fw-light">Questions sourced from <a href="https://github.com/uberspot/OpenTriviaQA" target="_blank" rel="noopener noreferrer">@uberspot/OpenTriviaQA</a></small>
            </div>
            <p class="card-text">Answer up to <b>10</b> trivia questions!<br>
            Each question takes <b>5 minutes</b> of game time.</p>
        </div>
        <div class="card-body border-top text-center">
            <button class="btn btn-primary mx-auto" id="trivia-start-button-{id}">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $<b>100</b> per question</h6>
        </div>
    </div>
    `,
    // index: 3
    // trivia card -- Category Specified
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}trivia.png" class="card-img-top" alt="trivia">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Trivia Questions!</h5>
                <h6 class="text-end"><b>-- Choose a Category</b></h6>
                <small class="fw-light">Questions sourced from <a href="https://github.com/uberspot/OpenTriviaQA" target="_blank" rel="noopener noreferrer">@uberspot/OpenTriviaQA</a></small>
            </div>
            <div class="container border-bottom border-info mb-2" id="trivia-catagory-container">
                <label for="trivia-catagory-selector"><b>Pick a category:</b></label>
                <select class="form-select form-select-sm mb-2" id="trivia-catagory-selector">

                    <option value="animals">Animals</option>
                    <option value="brain-teasers">Brain Teasers</option>
                    <option value="celebrities">Celebrities</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="for-kids">For Kids</option>
                    <option value="general">General</option>
                    <option value="geography">Geography</option>
                    <option value="history">History</option>
                    <option value="hobbies">Hobbies</option>
                    <option value="humanities">Humanities</option>
                    <option value="literature">Literature</option>
                    <option value="movies">Movies</option>
                    <option value="music">Music</option>
                    <option value="newest">Newest</option>
                    <option value="people">People</option>
                    <option value="religion-faith">Religion & Faith</option>
                    <option value="science-technology">Science & Technology</option>
                    <option value="sports">Sports</option>
                    <option value="television">Television</option>
                    <option value="video-games">Video Games</option>
                    <option value="world">World</option>

                </select>
            </div>
            <p class="card-text">Answer up to <b>10</b> trivia questions!<br>
            Each question takes <b>5 minutes</b> of game time.</p>
        </div>
        <div class="card-body border-top text-center">
            <button class="btn btn-primary mx-auto" id="trivia-start-button-{id}">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $<b>100</b> per question</h6>
        </div>
    </div>
    `,
    // index: 4
    // minigame --2048
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}2048.png" class="card-img-top" alt="2048">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Minigame!</h5>
                <h6 class="text-end"><b>-- 2048</b></h6>
                <small class="fw-light">Source: <a href="https://github.com/gd4Ark/2048" target="_blank" rel="noopener noreferrer">@gd4Ark/2048</a></small>
            </div>
            <p class="card-text">
                Use <b>arrow keys</b> or <b>swipe</b> to slide tiles around the board.<br>
                When matching numbers touch, they combine into one bigger number.<br>
                Match tiles to reach the <b>highest score</b> you can!<br>
                Challenge Time: <b>30 minutes</b> of game time.
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="2048-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $(Your Score within 1 minute)</h6>
        </div>
    </div>
    `,
    // index: 5
    // minigame --wordle
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}wordle.png" class="card-img-top" alt="wordle">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Minigame!</h5>
                <h6 class="text-end"><b>-- Wordle</b></h6>
                <small class="fw-light">Source: <a href="https://github.com/WebDevSimplified/wordle-clone" target="_blank" rel="noopener noreferrer">@WebDevSimplified/wordle-clone</a></small>
                
            </div>
            <p class="card-text">
                Guess the 5-letter word in 6 tries!<br>
                <b style="color: green;">Green</b> = right letter, right place.<br>
                <b style="color: orange;">Yellow</b> = right letter, wrong place.<br>
                <b style="color: gray;">Gray</b> = letter not in the word.<br>
                Challenge Time: <b>30 minutes</b> of game time.
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="wordle-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $<b>10,000</b> for solving in 1 guess, $<b>5,000</b> for 2 guesses, $<b>2,000</b> for 3, $<b>1,000</b> for 4, $<b>600</b> for 5, $<b>400</b> for 6.</h6>
        </div>
    </div>
    `,
    // index: 6
    // minigame --dino
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}dino.png" class="card-img-top" alt="dino">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Minigame!</h5>
                <h6 class="text-end"><b>-- Chrome Dino</b></h6>
                <small class="fw-light">source: <a href="https://github.com/wayou/t-rex-runner" target="_blank" rel="noopener noreferrer">@wayou/t-rex-runner</a> from chromium</small>
            </div>
            <p class="card-text">
                The classic game from Google Chrome offline mode.<br>
                Jump over obstacles! Press <b>Space</b> or <b>tap</b> to jump, and <b>↓</b> to duck.<br>
                <b>You have 2 attempts.</b><br>
                Challenge Time: <b>30 minutes</b> of game time.
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="dino-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $(Your Highest Score divided by 2)</h6>
        </div>
    </div>
    `,
    // index: 7
    // minigame -- fly to a random city
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}curse.png" class="card-img-top" alt="flight">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Cursed!</h5>
                <h6 class="text-end"><b>-- Fly to a random city!</b></h6>
            </div>
            <p class="card-text">
                You have to take the <b>first direct flight</b> to a <b>random destination</b>!<br>
                <b>The flight itself will be free</b>.
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="random-flight-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $<b>800</b> after the flight</h6>
        </div>
    </div>
    `,
    // index: 8
    // minigame --snake
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}snake.png" class="card-img-top" alt="snake">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Minigame!</h5>
                <h6 class="text-end"><b>-- Snake</b></h6>
                <small class="fw-light">source: <a href="https://github.com/ramazancetinkaya/snake-game" target="_blank" rel="noopener noreferrer">@ramazancetinkaya/snake-game</a></small>
            </div>
            <p class="card-text">The classic snake game.
                Use <b>arrow keys</b> or <b>swipe</b> to move the snake.<br>
                Don't bump into the walls or yourself!<br>
                <b>You have 3 attempts.</b><br>
                Challenge Time: <b>30 minutes</b> of game time.
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="snake-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $(Your Score * 50)</h6>
        </div>
    </div>
    `,
    // index: 9
    // minigame --flappy bird
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}flappy-bird.png" class="card-img-top" alt="flappy-bird">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Minigame!</h5>
                <h6 class="text-end"><b>-- Flappy Bird</b></h6>
                <small class="fw-light">source: <a href="https://github.com/shuding/flappybird" target="_blank" rel="noopener noreferrer">@shuding/flappybird</a></small>
            </div>
            <p class="card-text">
                The classic flappy bird game.<br>
                Press <b>SPACE</b> or <b>click</b> to jump the bird.<br>
                Don't crash into the obstacles!<br>
                <b>You have 3 attempts.</b><br>
                Challenge Time: <b>30 minutes</b> of game time.
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="bird-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $(Your Score * 100)</h6>
        </div>
    </div>
    `,
    // index: 10
    // minigame --chess puzzle
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}chess.png" class="card-img-top" alt="chess">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Minigame!</h5>
                <h6 class="text-end"><b>-- Chess Puzzle</b></h6>
                <small class="fw-light">source: <a href="https://github.com/FeXd/puzzle-chess" target="_blank" rel="noopener noreferrer">@FeXd/puzzle-chess</a></small>
            </div>
            <p class="card-text">
                Solve chess puzzles! Find the best move in each position.<br>
                You'll play <b>5 puzzles</b>.<br>
                Challenge Time: <b>30 minutes</b> of game time.
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="chess-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $(Games Won * 100)</h6>
        </div>
    </div>
    `,
    // index: 11
    // cursed -- no flight longer than 6000km for 24 hrs
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}curse.png" class="card-img-top" alt="curse">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Cursed!</h5>
                <h6 class="text-end"><b>-- No Long-Haul Flights</b></h6>
            </div>
            <p class="card-text">
                You will be cursed for <b>24 hours</b> of game time!<br>
                During this time, you <b>cannot book any flights longer than 6,000 km</b>.<br>
                This will force you to take shorter, regional flights.
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="cursed-longhaul-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $<b>1000</b> immediately</h6>
        </div>
    </div>
    `,
    // index: 12
    // cursed -- only one challenge drawn for 24 hrs
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}curse.png" class="card-img-top" alt="curse">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Cursed!</h5>
                <h6 class="text-end"><b>-- Limited Challenges</b></h6>
            </div>
            <p class="card-text">
                You will be cursed for the next <b>2 cities</b> you visit!<br>
                During this time, you will only get <b>1 challenge</b> per city instead of 3.<br>
                This will make earning money much harder!
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="cursed-challenges-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $<b>500</b> immediately</h6>
        </div>
    </div>
    `,
    // index: 13
    // cursed -- no departure board for next 2 cities
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}cursed_departure.png" class="card-img-top" alt="curse">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Cursed!</h5>
                <h6 class="text-end"><b>-- No Departure Board</b></h6>
            </div>
            <p class="card-text">
                You will be cursed for the next <b>2 cities</b> you visit!<br>
                During this time, you <b>cannot view airport departure boards</b><br>
                This will make planning your routes much harder!
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="cursed-departures-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $<b>500</b> immediately</h6>
        </div>
    </div>
    `,
    // index: 14
    // cursed -- no expensive tickets for next 2 cities
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}curse.png" class="card-img-top" alt="curse">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Cursed!</h5>
                <h6 class="text-end"><b>-- No Expensive Tickets</b></h6>
            </div>
            <p class="card-text">
                For the next <b>2 flights</b> you book,<br>
                You <b>cannot book flights costing more than $1000</b>.<br>
                This will limit your flight options significantly!
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="cursed-expensive-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $<b>500</b> immediately</h6>
        </div>
    </div>
    `,
    // index: 15
    // the snack zone (empty card)
    `
    <div class="card challange-card" id="challenge-card-{id}">
        <img src="{imgDir}snackzoneintro.gif" class="card-img-top" style="height: auto; width: 100%; margin-top: 0px;" alt="The Snack Zone Intro gif">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">The Snack Zone</h5>
            </div>
            <p class="card-text">
                You have just entered <b>The SNACK ZONE</b> BABYYYY!!!
                <br>
                Takes 10 mins of game time. You get no reward, only aura.
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="snackzone-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: None</h6>
        </div>
    </div>
    `
];
var challengeCardPick = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
var finishedCategories = [];

function removeChallenge(challengeIndex) {
    challengeCardPick = challengeCardPick.filter(idx => idx !== challengeIndex);
}

function createChallengeCard(index, id){
    return challengeCards[index].replaceAll("{id}", id).replaceAll("{imgDir}", imgDir);
}

var lastIata = null;

function openChallengeModal(){
    if (!clickAllowed){
        return;
    }
    $("#challange-modal").modal("show");
    if (lastIata != origin_iata) {
        lastIata = origin_iata;
        drawNewChallenges();
    }
}

async function drawNewChallenges(){
    $("#new-challenge-alert").show();

    // Check if cursed challenges is active
    const numChallenges = cursed_challenges ? 1 : 3;

    // Initialize all challenge cards
    if (cursed_challenges){
        $("#challenge-card-1").html(challengeCards[0].replace("{title}", "<span style='color:#a10000; font-weight:bold;'>⚡ CURSED! ⚡<br><small style='color:#333;'>No Challenge Available</small></span>"));
        $("#challenge-card-2").html(challengeCards[0].replace("{title}", "<span style='color:#0057b8; font-weight:bold;'>⏳ YOUR CHALLENGE IS... ⏳</span>"));
        $("#challenge-card-3").html(challengeCards[0].replace("{title}", "<span style='color:#a10000; font-weight:bold;'>⚡ CURSED! ⚡<br><small style='color:#333;'>No Challenge Available</small></span>"));
    }
    else {
        for (let i = 1; i <= 3; i++) {
            $("#challenge-card-" + i).html(challengeCards[0].replace("{title}", "<span style='color:#0057b8; font-weight:bold;'>⏳ YOUR CHALLENGE IS... ⏳</span>"));
        }
    }
    

    // Filter out cursed challenges if another curse is active
    let availableCards = [...challengeCardPick];
    
    // If longhaul curse is active, remove the challenges curse (index 12), departures curse (index 13), and expensive curse (index 14)
    if (cursed_longhaul) {
        availableCards = availableCards.filter(card => card !== 12 && card !== 13 && card !== 14);
    }
    
    // If challenges curse is active, remove the longhaul curse (index 11), departures curse (index 13), and expensive curse (index 14)
    // if (cursed_challenges) {
    //     availableCards = availableCards.filter(card => card !== 11 && card !== 13 && card !== 14);
    // }
    
    // If departures curse is active, remove the longhaul curse (index 11), challenges curse (index 12), and expensive curse (index 14)
    // if (cursed_departures) {
    //     availableCards = availableCards.filter(card => card !== 11 && card !== 12 && card !== 14);
    // }
    
    // If expensive curse is active, remove the longhaul curse (index 11), challenges curse (index 12), and departures curse (index 13)
    if (cursed_expensive) {
        availableCards = availableCards.filter(card => card !== 11 && card !== 12 && card !== 13);
    }

    var cards = shuffle.pick(availableCards, { 'picks': numChallenges });
    
    if (cursed_challenges) {
        await delay(1000);
        $("#challenge-card-2").html(createChallengeCard(cards, 1));
        bindChallengeButton(1, cards[0]);
    } else {
        for (let i = 1; i <= 3; i++) {
            await delay(1000);
            $(`#challenge-card-${i}`).html(createChallengeCard(cards[i-1], i));
            bindChallengeButton(i, cards[i-1]);
        }
    }

    $("#new-challenge-alert").hide();
}

function bindChallengeButton(id, cardIndex){
    // trivias
    if (cardIndex === 3){
        finishedCategories.forEach(category => {
            $(`#trivia-catagory-selector`).find(`option[value=${category}]`).remove();
        });
    };
    if (cardIndex === 1){
        $(`#trivia-difficulty-selector`).on('change', function () {

            if (this.value == ""){
                $(`#trivia-reward`).text("100");
            }
            if (this.value == "easy"){
                $(`#trivia-reward`).text("75");
            }
            if (this.value == "medium"){
                $(`#trivia-reward`).text("100");
            }
            if (this.value == "hard"){
                $(`#trivia-reward`).text("150");
            }
            
        });
    }
    if (cardIndex >= 1 && cardIndex <= 3) {
        $(`#trivia-start-button-${id}`).off('click').on('click', function() {
            //opentdb
            if (cardIndex === 1) {
                startTrivia(9, $(`#trivia-difficulty-selector`).val());
                $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
                // removeChallenge(cardIndex);
            }
            // all categories
            else if (cardIndex === 2){
                startTrivia("random", "");
                $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
                removeChallenge(cardIndex);
            }
            // cate specified
            else if (cardIndex === 3){
                var category = $(`#trivia-catagory-selector`).val();
                finishedCategories.push(category);
                startTrivia(category, "");
                $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
            }
        });
    }

    // 2048
    if (cardIndex === 4){
        $(`#2048-start-btn`).off('click').on('click', function() {
            $("#challange-modal").modal("hide");
            start2048();
            $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
            removeChallenge(cardIndex);
        });
    }
    
    // wordle
    if (cardIndex === 5){
        $(`#wordle-start-btn`).off('click').on('click', function() {
            $("#challange-modal").modal("hide");
            startWordle();
            $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
            removeChallenge(cardIndex);
        });
    }
    
    // dino
    if (cardIndex === 6){
        $(`#dino-start-btn`).off('click').on('click', function() {
            $("#challange-modal").modal("hide");
            startDino();
            $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
            removeChallenge(cardIndex);
        });
    }

    // random flight
    if (cardIndex === 7){
        $(`#random-flight-start-btn`).off('click').on('click', function() {
            $("#challange-modal").modal("hide");
            startRandomFlight();
            $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
            removeChallenge(cardIndex);
        });
    }

    // snake
    if (cardIndex === 8){
        $(`#snake-start-btn`).off('click').on('click', function() {
            $("#challange-modal").modal("hide");
            startSnake();
            $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
            removeChallenge(cardIndex);
        });
    }
    
    // bird
    if (cardIndex === 9){
        $(`#bird-start-btn`).off('click').on('click', function() {
            $("#challange-modal").modal("hide");
            startBird();
            $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
            removeChallenge(cardIndex);
        });
    }
    
    // chess
    if (cardIndex === 10){
        $(`#chess-start-btn`).off('click').on('click', function() {
            $("#challange-modal").modal("hide");
            startChess();
            $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
            // removeChallenge(cardIndex);
        });
    }
    
    // cursed longhaul
    if (cardIndex === 11){
        $(`#cursed-longhaul-start-btn`).off('click').on('click', function() {
            $("#challange-modal").modal("hide");
            startCursedLonghaul();
            $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
            removeChallenge(cardIndex);
        });
    }
    
    // cursed challenges
    if (cardIndex === 12){
        $(`#cursed-challenges-start-btn`).off('click').on('click', function() {
            $("#challange-modal").modal("hide");
            startCursedChallenges();
            $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
            removeChallenge(cardIndex);
        });
    }
    
    // cursed departures
    if (cardIndex === 13){
        $(`#cursed-departures-start-btn`).off('click').on('click', function() {
            $("#challange-modal").modal("hide");
            startCursedDepartures();
            $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
            removeChallenge(cardIndex);
        });
    }
    
    // cursed expensive
    if (cardIndex === 14){
        $(`#cursed-expensive-start-btn`).off('click').on('click', function() {
            $("#challange-modal").modal("hide");
            startCursedExpensive();
            $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
            removeChallenge(cardIndex);
        });
    }

    // snake zone
    if (cardIndex === 15){
        $(`#snackzone-start-btn`).off('click').on('click', function() {
            $("#challange-modal").modal("hide");
            startSnackzone();
            $(`#challenge-card-${id}`).html(challengeCards[0].replace("{title}", "Challenge Finished."));
            removeChallenge(cardIndex);
        });
    }
}

function challangeFinished(text, cheers){
    $("#ok-modal").modal('show');
    $("#ok-title").html(text);

    if (cheers){
        confetti({
            particleCount: 150,
            spread: 180
        });
    }
}

// Add this function at the top level
function preventTouchScroll(e) {
    e.preventDefault();
}

// Add CSS styling for minigame canvas
function setupMinigameCanvas() {
    const canvas = document.getElementById("minigame-canvas");
    if (canvas) {
        canvas.style.width = "100%";
        canvas.style.maxWidth = "100vw";
        canvas.style.height = "100%";
        canvas.style.maxHeight = "100vh";
        canvas.style.overflow = "hidden";
        canvas.style.position = "fixed";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.zIndex = "1000";
        canvas.style.backgroundColor = "white";
        canvas.style.display = "flex";
        canvas.style.flexDirection = "column";
        canvas.style.alignItems = "center";
        canvas.style.justifyContent = "center";
    }
}

// 2048 (4)
async function start2048(){
    setupMinigameCanvas();
    $("#minigame-canvas").show().html(`
        <iframe src="/minigames/2048/index.html" id="2048-iframe" frameborder="0" width="90%" height="80%" style="max-width: 100%;"></iframe>
        <button class="btn btn-sm btn-outline-warning quit-button" onclick="quit2048()">Quit</button>
    `);
    await delay(100);
    document.getElementById("2048-iframe").contentWindow.focus();
    document.getElementById("minigame-canvas").addEventListener('touchmove', preventTouchScroll, { passive: false });
}

function finish2048(score){
    document.getElementById("minigame-canvas").removeEventListener('touchmove', preventTouchScroll);
    $("#minigame-canvas").html("").hide();
    challangeFinished(`Your score: ${score}.<br>You earned $${score}!<br>30 minutes in game time has passed.`, true);

    budget += score;
    $("#money-left").text(`$${budget}`);
    gameTimeUpdate(gameTime.getTime() + 30 * 60 * 1000);
}

function quit2048(){
    finish2048(0);
}

// wordle (5)
async function startWordle(){
    setupMinigameCanvas();
    $("#minigame-canvas").show().html(`
        <iframe src="/minigames/wordle/index.html" id="wordle-iframe" frameborder="0" width="90%" height="85%" style="max-width: 100%;"></iframe>
        <button class="btn btn-sm btn-outline-warning quit-button" onclick="quitWordle()">Quit</button>
    `);

    await delay(100);
    document.getElementById("wordle-iframe").contentWindow.focus();
    document.getElementById("minigame-canvas").addEventListener('touchmove', preventTouchScroll, { passive: false });
}
const wordleReward = [0, 10000, 5000, 2000, 1000, 600, 400];
function quitWordle(){
    let targetWord = document.getElementById("wordle-iframe").contentWindow.answer;
    finishWordle(false, 0, targetWord);
}
function finishWordle(ifWin, guesses, targetWord){
    document.getElementById("minigame-canvas").removeEventListener('touchmove', preventTouchScroll);
    $("#minigame-canvas").html("").hide();
    if (ifWin){
        challangeFinished(`You took ${guesses} attempts to guess the word.<br>You earned $${wordleReward[guesses]}!<br>30 minutes in game time has passed.`, true)
        budget += wordleReward[guesses];
        $("#money-left").text(`$${budget}`);
    }
    else {
        challangeFinished(`Game Over! The target word is <b>${targetWord}</b>.<br>You didn't win anything! You just wasted 40 minutes in game time!`, false);
    }
    gameTimeUpdate(gameTime.getTime() + 30 * 60 * 1000);
}

// dino (6)
async function startDino(){
    setupMinigameCanvas();
    $("#minigame-canvas").show().html(`
        <iframe src="/minigames/dino/index.html" id="dino-iframe" frameborder="0" width="90%" height="80%" style="max-width: 100%;"></iframe>
        <button class="btn btn-sm btn-outline-warning quit-button" onclick="quitDino()">Quit</button>
    `);
    await delay(100);
    document.getElementById("dino-iframe").contentWindow.focus();
    document.getElementById("minigame-canvas").addEventListener('touchmove', preventTouchScroll, { passive: false });
}

function quitDino(){
    finishDino(0);
}

function finishDino(score){
    document.getElementById("minigame-canvas").removeEventListener('touchmove', preventTouchScroll);
    $("#minigame-canvas").html("").hide();
    let reward = Math.floor(score/2);
    challangeFinished(`Highest score: ${score}.<br>You earned $${reward}!<br>30 minutes in game time has passed.`, true);
    budget += reward;
    $("#money-left").text(`$${budget}`);
    gameTimeUpdate(gameTime.getTime() + 30 * 60 * 1000);
}

// random flight (7)
let randomFlightChallenge = false;
function startRandomFlight(){
    randomFlightChallenge = false;
    resetRoute();
    randomFlightChallenge = true;
    let destination = shuffle.pick(current_dest_iatas);
    let dest_apData = findApData(destination);
    window.alert(`You are flying to ${dest_apData.municipality} (${destination}), ${dest_apData.country_name}!`);
    selectedAp = destination;
    selectAirport();
}
function finishRandomFlight(){
    randomFlightChallenge = false;
    challangeFinished(`<h6>Welcome to ${findApData(dest_iata).municipality} (<b>${dest_iata}</b>)!<h6> You earned $1000!`, true)
    budget += 800;
    $("#money-left").text(`$${budget}`);
}

// snake (8)
async function startSnake(){
    setupMinigameCanvas();
    $("#minigame-canvas").show().html(`
        <iframe src="/minigames/snake/index.html" id="snake-iframe" frameborder="0" width="90%" height="80%" style="max-width: 100%;"></iframe>
        <button class="btn btn-sm btn-outline-warning quit-button" onclick="quitSnake()">Quit</button>
    `);
    await delay(100);
    document.getElementById("snake-iframe").contentWindow.focus();
    document.getElementById("minigame-canvas").addEventListener('touchmove', preventTouchScroll, { passive: false });
}
function finishSnake(score){
    document.getElementById("minigame-canvas").removeEventListener('touchmove', preventTouchScroll);
    let reward = score * 50;
    $("#minigame-canvas").html("").hide();
    challangeFinished(`Highest score: ${score}.<br>You earned $${reward}!<br>30 minutes in game time has passed.`, true);
    budget += reward;
    $("#money-left").text(`$${budget}`);
    gameTimeUpdate(gameTime.getTime() + 30 * 60 * 1000);
}
function quitSnake(){
    finishSnake(0);
}

// bird (9)
async function startBird(){
    setupMinigameCanvas();
    $("#minigame-canvas").show().html(`
        <iframe src="/minigames/flappy-bird/index.html" id="bird-iframe" frameborder="0" width="90%" height="80%" style="max-width: 100%;"></iframe>
        <button class="btn btn-sm btn-outline-warning quit-button" onclick="quitBird()">Quit</button>
    `);
    await delay(100);
    document.getElementById("bird-iframe").contentWindow.focus();
    document.getElementById("minigame-canvas").addEventListener('touchmove', preventTouchScroll, { passive: false });
}
function finishBird(score){
    document.getElementById("minigame-canvas").removeEventListener('touchmove', preventTouchScroll);
    let reward = score * 100;
    $("#minigame-canvas").html("").hide();
    challangeFinished(`Highest score: ${score}.<br>You earned $${reward}!<br>30 minutes in game time has passed.`, true);
    budget += reward;
    $("#money-left").text(`$${budget}`);
    gameTimeUpdate(gameTime.getTime() + 30 * 60 * 1000);
}
function quitBird(){
    finishBird(0);
}

// chess puzzle (10)
async function startChess(){
    setupMinigameCanvas();
    $("#minigame-canvas").show().html(`
        <iframe src="/minigames/puzzle-chess/index.html" id="chess-iframe" frameborder="0" width="90%" height="80%" style="max-width: 100%;"></iframe>
        <button class="btn btn-sm btn-outline-warning quit-button" onclick="quitChess()">Quit</button>
    `);
    await delay(100);
    document.getElementById("chess-iframe").contentWindow.focus();
    document.getElementById("minigame-canvas").addEventListener('touchmove', preventTouchScroll, { passive: false });
}
function finishChess(score){
    document.getElementById("minigame-canvas").removeEventListener('touchmove', preventTouchScroll);
    let reward = score * 100;
    $("#minigame-canvas").html("").hide();
    challangeFinished(`You solved <b>${score}</b> puzzle(s).<br>You earned $${reward}!<br>30 minutes in game time has passed.`, true);
    budget += reward;
    $("#money-left").text(`$${budget}`);
    gameTimeUpdate(gameTime.getTime() + 30 * 60 * 1000);
}
function quitChess(){
    finishChess(0);
}

// cursed -- no flight longer than 5000km for 24 hrs (11)
let cursed_longhaul = false;
let cursed_start_time = 0;

function startCursedLonghaul(){
    cursed_longhaul = true;
    cursed_start_time = gameTime.getTime();
    challangeFinished(`
        <h6>You are now <strong>cursed</strong>!<h6>
        <p>You cannot travel on a flight longer than <b>6,000 km</b> for <b>24 hours</b>.</p>
        <p>But, you earned <b>$1000</b>!</p>
        `, false);
    budget += 1000;
    $("#money-left").text(`$${budget}`);
    updateCurseBanner();
}
function endCursedLonghaul(){
    cursed_longhaul = false;
    cursed_start_time = 0;
    updateCurseBanner();
    challangeFinished("🎉 The curse has been lifted! You can now book long-haul flights again.", true);
}

// cursed -- only one challenge drawn for next 2 cities (12)
let cursed_challenges = false;
let cursed_challenges_cities_left = 0;
function startCursedChallenges(){
    cursed_challenges = true;
    cursed_challenges_cities_left = 2;
    challangeFinished(`
        <h6>You are now <strong>cursed</strong>!<h6>
        <p>You will only get <b>1 challenge</b> per city for the next <b>2 cities</b>.</p>
        <p>But, you earned <b>$500</b>!</p>
        `, false);
    budget += 500;
    $("#money-left").text(`$${budget}`);
    updateCurseBanner();
}

function endCursedChallenges(){
    cursed_challenges = false;
    cursed_challenges_cities_left = 0;
    updateCurseBanner();
    challangeFinished("🎉 The curse has been lifted! You can now get 3 challenges per city again.", true);
}

// cursed -- no departure board for next 2 cities (13)
let cursed_departures = false;
let cursed_departures_cities_left = 0;
function startCursedDepartures(){
    cursed_departures = true;
    cursed_departures_cities_left = 2;

    challangeFinished(`
        <h6>You are now <strong>cursed</strong>!<h6>
        <p>You cannot view departure boards for the next <b>2 cities</b> you arrive in.</p>
        <p>But, you earned <b>$500</b>!</p>
        `, false);
    budget += 500;
    $("#money-left").text(`$${budget}`);
    updateCurseBanner();
}

function curseDisableDepButton(){
    $("#view-schedule-btn").prop("disabled", true).addClass("disabled");
    $("#view-origin-schedule-btn").prop("disabled", true).addClass("disabled");
    $("#view-schedule-btn-text").addClass("text-decoration-line-through");
    $("#view-origin-schedule-btn-text").addClass("text-decoration-line-through");
}

function endCursedDepartures(){
    cursed_departures = false;
    cursed_departures_cities_left = 0;
    updateCurseBanner();
    
    $("#view-schedule-btn").prop("disabled", false).removeClass("disabled");
    $("#view-origin-schedule-btn").prop("disabled", false).removeClass("disabled");
    $("#view-schedule-btn-text").removeClass("text-decoration-line-through");
    $("#view-origin-schedule-btn-text").removeClass("text-decoration-line-through");

    challangeFinished("🎉 The curse has been lifted! You can now view departure boards again.", true);
}


// cursed -- no expensive tickets for next 2 cities (14)
let cursed_expensive = false;
let cursed_expensive_cities_left = 0;

function startCursedExpensive(){
    cursed_expensive = true;
    cursed_expensive_cities_left = 2;
    challangeFinished(`
        <h6>You are now <strong>cursed</strong>!<h6>
        <p>You cannot book plane ticket costing more than $1000 for the next <b>2 flights</b>.</p>
        <p>But, you earned <b>$500</b>!</p>
        `, false);
    budget += 500;
    $("#money-left").text(`$${budget}`);
    updateCurseBanner();
}

function endCursedExpensive(){
    cursed_expensive = false;
    cursed_expensive_cities_left = 0;
    updateCurseBanner();
    challangeFinished("🎉 The curse has been lifted! You can now book expensive flights again.", true);
}



function updateCurseBanner() {
    const curseDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    let activeCurses = [];
    let timeRemaining = 0;
    
    // Check for longhaul curse
    if (cursed_longhaul && cursed_start_time > 0) {
        const timeElapsed = gameTime.getTime() - cursed_start_time;
        timeRemaining = curseDuration - timeElapsed;
        
        if (timeRemaining > 0) {
            activeCurses.push({
                type: "longhaul",
                timeRemaining: timeRemaining
            });
        } else {
            endCursedLonghaul();
        }
    }
    
    // Check for challenges curse
    if (cursed_challenges && cursed_challenges_cities_left >= 0) {
        activeCurses.push({
            type: "challenges",
            citiesLeft: cursed_challenges_cities_left
        });
    } else if (cursed_challenges && cursed_challenges_cities_left < 0) {
        endCursedChallenges();
    }
    
    // Check for departures curse
    if (cursed_departures && cursed_departures_cities_left >= 0) {
        activeCurses.push({
            type: "departures",
            citiesLeft: cursed_departures_cities_left
        });
        if (cursed_departures_cities_left == 1){
            curseDisableDepButton();
        }
    } else if (cursed_departures && cursed_departures_cities_left < 0) {
        endCursedDepartures();
    }
    
    // Check for expensive curse
    if (cursed_expensive && cursed_expensive_cities_left > 0) {
        activeCurses.push({
            type: "expensive",
            flightsLeft: cursed_expensive_cities_left
        });
    } else if (cursed_expensive && cursed_expensive_cities_left <= 0) {
        endCursedExpensive();
    }
    
    // Clear existing curse banners
    $(".curse-banner").remove();
    
    if (activeCurses.length > 0) {
        activeCurses.forEach((curse, index) => {
            let bannerHtml = '';
            
            if (curse.type === "longhaul") {
                const hours = Math.floor(curse.timeRemaining / (60 * 60 * 1000));
                const minutes = Math.floor((curse.timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
                const timeString = `${hours}h ${minutes}m`;
                bannerHtml = '<strong>🚫 CURSED!</strong> You cannot book flights longer than 6,000 km for <span id="curse-time-remaining">' + timeString + '</span>';
            } else if (curse.type === "challenges") {
                bannerHtml = '<strong>🚫 CURSED!</strong> You only get 1 challenge per city for the next <span id="curse-cities-remaining">' + curse.citiesLeft + '</span> city(ies)';
            } else if (curse.type === "departures") {
                bannerHtml = '<strong>🚫 CURSED!</strong> You cannot view departure boards for the next <span id="curse-departures-remaining">' + curse.citiesLeft + '</span> city(ies)';
            } else if (curse.type === "expensive") {
                bannerHtml = '<strong>🚫 CURSED!</strong> You cannot book flights costing more than $1000 for the next <span id="curse-expensive-remaining">' + curse.flightsLeft + '</span> flight(s)';
            }
            
            // Determine banner color based on number of active curses
            let backgroundColor = '#6a376a'; // Default purple color for single curse
            if (activeCurses.length > 1) {
                // Use different colors for multiple curses
                const colors = ['#6a376a', '#661c37', '#400004', '#1a0000'];
                backgroundColor = colors[index % colors.length];
            }
            
            // Create new banner element
            const bannerElement = $('<div class="curse-banner alert alert-danger text-center mb-0 py-1 rounded-0" style="background-color: ' + backgroundColor + '; color: white; border: none;">' + bannerHtml + '</div>');
            
            // Insert after the navbar
            $("#navbar-wrapper").append(bannerElement);
        });
    }
}

function startSnackzone() {
    challangeFinished(`
        <img src="${imgDir}snackzoneoutro.gif" alt="Snack Zone Outro" style="width: 100%; display:block; margin:0 auto 20px auto;">
        <h6 class="text-center">Thanks for kickin' it in <b>The Snack Zone</b>!</h6>
        <p class="text-center">10 minutes in game time has passed.</p>
        `, true);
    gameTimeUpdate(gameTime.getTime() + 10 * 60 * 1000);
}