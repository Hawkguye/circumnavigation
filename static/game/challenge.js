// const API_URL = "http://127.0.0.1:5000/api/"

const delay = ms => new Promise(res => setTimeout(res, ms));

const challengeCards = [
    // index: 0
    // placeholder card 
    `
    <div class="card challange-card border-2 border-dark" style="height: 350px;">
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
        <div class="card-footer text-center placeholder-glow">
            <h6><span class="placeholder col-4"></span></h6>
        </div>
    </div>
    `,
    // index: 1
    // trivia card -- General Knowledge
    `
    <div class="card challange-card border-2 border-dark" id="challenge-card-{id}">
        <img src="{imgDir}trivia.png" class="card-img-top" alt="trivia">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Trivia Questions!</h5>
                <h6 class="text-end my-0"><b>-- General Knowledge</b></h6>
                <small class="fw-light">Data from <a href="https://opentdb.com/" target="_blank" rel="noopener noreferrer">Opentdb</a></small>
            </div>
            <p class="card-text">Maximum 10 questions, each question takes 5 minutes in game time.</p>
        </div>
        <div class="card-body border-top d-flex justify-content-between">
            <div class="container" id="trivia-difficulty-container">
                <label for="trivia-difficulty-selector">Choose the difficulty:</label>
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
    <div class="card challange-card border-2 border-dark" id="challenge-card-{id}">
        <img src="{imgDir}trivia.png" class="card-img-top" alt="trivia">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Trivia Questions!</h5>
                <h6 class="text-end"><b>-- All Categories</b></h6>
                <small class="fw-light">Data from <a href="https://github.com/uberspot/OpenTriviaQA" target="_blank" rel="noopener noreferrer">@uberspot/OpenTriviaQA</a></small>
            </div>
            <p class="card-text">Maximum 10 questions, each question takes 5 minutes in game time.</p>
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
    <div class="card challange-card border-2 border-dark" id="challenge-card-{id}">
        <img src="{imgDir}trivia.png" class="card-img-top" alt="trivia">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Trivia Questions!</h5>
                <h6 class="text-end"><b>-- Category Specified</b></h6>
                <small class="fw-light">Data from <a href="https://github.com/uberspot/OpenTriviaQA" target="_blank" rel="noopener noreferrer">@uberspot/OpenTriviaQA</a></small>
            </div>
            <div class="container border-bottom border-info mb-2" id="trivia-catagory-container">
                <label for="trivia-catagory-selector">Choose a catagory:</label>
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
            <p class="card-text">Maximum 10 questions, each question takes 5 minutes in game time.</p>
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
    <div class="card challange-card border-2 border-dark" id="challenge-card-{id}">
        <img src="{imgDir}2048.png" class="card-img-top" alt="2048">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Minigame!</h5>
                <h6 class="text-end"><b>-- 2048</b></h6>
                <small class="fw-light">source: <a href="https://github.com/gd4Ark/2048" target="_blank" rel="noopener noreferrer">@gd4Ark/2048</a></small>
            </div>
            <p class="card-text">Use your arrow keys (or swipe) to move the tiles.<br>
            Tiles with the same number merge into one when they touch.<br>
            Try to get the highest number possible!<br>
            <b>(Takes 30 minutes in game time.)</b></p>
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
    <div class="card challange-card border-2 border-dark" id="challenge-card-{id}">
        <img src="{imgDir}wordle.png" class="card-img-top" alt="wordle">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Minigame!</h5>
                <h6 class="text-end"><b>-- Wordle</b></h6>
                <small class="fw-light">source: <a href="https://github.com/WebDevSimplified/wordle-clone" target="_blank" rel="noopener noreferrer">@WebDevSimplified/wordle-clone</a></small>
                
            </div>
            <p class="card-text">You'll have six attempts to guess a five-letter word.
             Each guess provides feedback, with letters turning <b style="color: green;">green</b> if they are in the correct position,
             <b style="color: orange;">yellow</b> if they are in the word but in the wrong position,
              and <b style="color: gray;">gray</b> if they are not in the word at all.
               The goal is to guess the word in as few attempts as possible.
               <br><b>(Takes 30 minutes in game time.)</b>
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="wordle-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: 1 to 6 guesses used respectively: $10000, $5000, $2000, $1000, $600, $400</h6>
        </div>
    </div>
    `,
    // index: 6
    // minigame --dino
    `
    <div class="card challange-card border-2 border-dark" id="challenge-card-{id}">
        <img src="{imgDir}dino.png" class="card-img-top" alt="dino">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Minigame!</h5>
                <h6 class="text-end"><b>-- Chrome Dino</b></h6>
                <small class="fw-light">source: <a href="https://github.com/wayou/t-rex-runner" target="_blank" rel="noopener noreferrer">@wayou/t-rex-runner</a> from chromium</small>
            </div>
            <p class="card-text">The classic game from Chrome offline mode.
             Press <b>Space</b> or <b>tap</b> to start the game and jump your Dino, use down arrow (↓) to duck.
                <br><b>You have 2 chances.</b>
               <br><b>(Takes 30 minutes in game time.)</b>
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="dino-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $(Your Highest Score)</h6>
        </div>
    </div>
    `,
    // index: 7
    // minigame -- fly to a random city
    `
    <div class="card challange-card border-2 border-dark" id="challenge-card-{id}">
        <img src="{imgDir}logo.png" class="card-img-top" alt="flight">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Fly to a random city!</h5>
            </div>
            <p class="card-text">
                Take a flight to a random city (direct from your current location).
                <bt>
                <b>The flight itself will be free</b>.
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="random-flight-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $<b>1000</b></h6>
        </div>
    </div>
    `,
    // index: 8
    // minigame --snake
    `
    <div class="card challange-card border-2 border-dark" id="challenge-card-{id}">
        <img src="{imgDir}dino.png" class="card-img-top" alt="dino">
        <div class="card-body text-center">
            <div>
                <h5 class="card-title">Minigame!</h5>
                <h6 class="text-end"><b>-- Snake</b></h6>
                <small class="fw-light">source: <a href="https://github.com/ramazancetinkaya/snake-game" target="_blank" rel="noopener noreferrer">@ramazancetinkaya/snake-game</a></small>
            </div>
            <p class="card-text">The classic snake game.
                Use <b>arrow keys</b> or <b>swipe</b> to move the snake.
                <br><b>Don't bump into the walls or yourself!</b>
                <br><b>You have 3 chances.</b>
               <br><b>(Takes 30 minutes in game time.)</b>
            </p>
        </div>
        <div class="card-body border-top d-flex text-center">
            <button class="btn btn-primary mx-auto" id="snake-start-btn">Start Challenge</button>
        </div>
        <div class="card-footer text-center">
            <h6>Reward: $(Your Score * 50)</h6>
        </div>
    </div>
    `
];
var challengeCardPick = [1,2,3,4,5,6,7,8];
var finishedCategories = [];

function removeChallenge(challengeIndex) {
    for (let i=0; i<challengeCardPick.length; i++){
        if (challengeCardPick[i] === challengeIndex){
            challengeCardPick.splice(i, 1);
            return;
        }
    }
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

    $("#challenge-card-1").html(challengeCards[0].replace("{title}", "Generating Challenge..."));
    $("#challenge-card-2").html(challengeCards[0].replace("{title}", "Generating Challenge..."));
    $("#challenge-card-3").html(challengeCards[0].replace("{title}", "Generating Challenge..."));

    var cards = shuffle.pick(challengeCardPick, { 'picks': 3 });
    await delay(1000);
    $("#challenge-card-1").html(createChallengeCard(cards[0], 1));
    bindChallengeButton(1, cards[0])

    await delay(1000);
    $("#challenge-card-2").html(createChallengeCard(cards[1], 2));
    bindChallengeButton(2, cards[1])

    await delay(1000);
    $("#challenge-card-3").html(createChallengeCard(cards[2], 3));
    bindChallengeButton(3, cards[2])

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
            // removeChallenge(cardIndex);
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


// 2048 (4)
async function start2048(){
    $("#minigame-canvas").show().html(`
        <iframe src="/minigames/2048/index.html" id="2048-iframe" frameborder="0" width="90%" height="80%"></iframe>
        <button class="btn btn-sm btn-outline-warning quit-button" onclick="quit2048()">Quit</button>
    `);
    await delay(100);
    document.getElementById("2048-iframe").contentWindow.focus();
}
function finish2048(score){
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
    $("#minigame-canvas").show().html(`
        <iframe src="/minigames/wordle/index.html" id="wordle-iframe" frameborder="0" width="90%" height="85%"></iframe>
        <button class="btn btn-sm btn-outline-warning quit-button" onclick="quitWordle()">Quit</button>
    `);

    await delay(100);
    document.getElementById("wordle-iframe").contentWindow.focus();
}
const wordleReward = [0, 10000, 5000, 2000, 1000, 600, 400];
function quitWordle(){
    let targetWord = document.getElementById("wordle-iframe").contentWindow.answer;
    finishWordle(false, 0, targetWord);
}
function finishWordle(ifWin, guesses, targetWord){
    $("#minigame-canvas").html("").hide();
    if (ifWin){
        // console.log(guesses)
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
    $("#minigame-canvas").show().html(`
        <iframe src="/minigames/dino/index.html" id="dino-iframe" frameborder="0" width="90%" height="80%"></iframe>
        <button class="btn btn-sm btn-outline-warning quit-button" onclick="quitDino()">Quit</button>
    `);
    await delay(100);
    document.getElementById("dino-iframe").contentWindow.focus();
}
function finishDino(score){
    $("#minigame-canvas").html("").hide();
    challangeFinished(`Highest score: ${score}.<br>You earned $${score}!<br>30 minutes in game time has passed.`, true);
    budget += score;
    $("#money-left").text(`$${budget}`);
    gameTimeUpdate(gameTime.getTime() + 30 * 60 * 1000);
}
function quitDino(){
    finishDino(0);
}

// random flight (7)
let randomFlightChallenge = false;
function startRandomFlight(){
    randomFlightChallenge = true;
    let destination = shuffle.pick(current_dest_iatas);
    window.alert(`You are flying to ${destination}!`);
    selectedAp = destination;
    selectAirport();
}
function finishRandomFlight(){
    randomFlightChallenge = false;
    challangeFinished(`<h6>Welcome to <b>${dest_iata}</b>!<h6> You earned $1000!`, true)
    budget += 1000;
    $("#money-left").text(`$${budget}`);
}

// snake (8)
async function startSnake(){
    $("#minigame-canvas").show().html(`
        <iframe src="/minigames/snake/index.html" id="snake-iframe" frameborder="0" width="90%" height="80%"></iframe>
        <button class="btn btn-sm btn-outline-warning quit-button" onclick="quitSnake()">Quit</button>
    `);
    await delay(100);
    document.getElementById("snake-iframe").contentWindow.focus();
}
function finishSnake(score){
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

