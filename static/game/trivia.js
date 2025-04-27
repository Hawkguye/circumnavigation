var correctCnt = 0;
var answeredCnt = 0;
var reward = 0;
var countdownTimer = null;

var triviaToken = "";
var triviaQuestions = [];

const triviaReward = {
    "": 100,
    "easy": 75,
    "medium": 100,
    "hard": 150
}

const triviaCatagoryID = {
    "Books": 10,
    "Film": 11,
    "Music": 12,
    "Television": 14,
    "Video Games": 15,
    "Sports": 21,
    "Geography": 22,
    "History": 23,
    "Science & Nature": 17,
    "Computers": 18,
    "Mathematics": 19,
    "Animals": 27
};


async function getTriviaToken(){
    fetch(`https://opentdb.com/api_token.php?command=request`)
    .then(response => response.json())
    .then(data => {
        triviaToken = data.token;
        // console.log(data.response_message);
    })
    .catch(error => console.error("Unable to fetch trivia token:", error));
}

function startTrivia(category, difficulty){
    $("#challange-modal").modal("hide");
    $("#trivia-canvas").show();
    $("#quitChallenge").hide();
    correctCnt = 0;
    answeredCnt = 0;

    if (category == 9){
        reward = triviaReward[difficulty];
        $("#next-trivia-btn").off('click').on('click', askTrivia);
        fetchTrivia(false, category, difficulty);
    }
    
    else {
        reward = 100;
        $("#next-trivia-btn").off('click').on('click', function () {
            if (answeredCnt === 10){
                triviaFinished();
            }
            else {
                fetchTriviaV2(category);
            }
        });
        fetchTriviaV2(category);
    }
}

async function fetchTriviaV2(category) {
    $("#next-trivia-div").hide();
    $("#trivia-question").text("Loading...");
    $("#trivia-category").text("");
    $("#trivia-answers").html("");
    $("#quitChallenge").hide();

    fetch(`${API_URL}get_trivia/${category}`)
    .then(response => response.json())
    .then(data => {
        // console.log(data);
        
        // console.log(results);
        var question = data.question;
        var choices = data.choices;
        var answer = data.answer;
        var category = data.category;

        shuffle(choices);

        $("#trivia-question").text(question);
        $("#trivia-category").text(`Category: ${category}`);
        $("#trivia-counter").text(`${answeredCnt+1}/10`);

        choices.forEach(choice => {
            $("#trivia-answers").append(`
            <button class="btn btn-outline-primary trivia-answer my-1" type="button">${choice}</button>
            `);
        });
        $('.trivia-answer').off('click').on('click', function() {
            var selectedAnswer = $(this).text();
            validateTriviaAnswer(selectedAnswer, answer);
        });
        countdownTimer = $("#progressTimer").countdownTimer({
            timeLimit: 20,
            warningThreshold: 13,
            dangerThreshold: 17,
            baseStyle: 'bg-success',
            warningStyle: 'bg-warning',
            completeStyle: 'bg-danger',
            onFinish: function() {
                validateTriviaAnswer("", answer);
            }
        });
    })
    .catch(error => console.error("Unable to fetch trivia question:", error));
}

// opentdb
async function fetchTrivia(wait, category, difficulty){
    if (wait) {
        await delay(6000);
    }
    fetch(`https://opentdb.com/api.php?amount=10&category=${category}&difficulty=${difficulty}&token=${triviaToken}`)
    .then(response => response.json())
    .then(data => {
        // console.log(data);
        var response_code = data.response_code;
        if (response_code === 0){
            triviaQuestions = data.results;
            console.log(`fetched ${triviaQuestions.length} trivia questions`)
            askTrivia();
        }
        else if (response_code === 5){
            fetchTrivia(true, category, difficulty);
        }
        else {
            console.error("Fetching opentdb unexpected error:", response_code);
        }
    })
    .catch(error => console.error("Unable to fetch trivia question:", error));
}
// opentdb
function askTrivia(){
    $("#next-trivia-div").hide();
    $("#trivia-question").text("Loading...");
    $("#trivia-answers").html("");
    $("#quitChallenge").hide();

    var results = triviaQuestions.pop();
    // no more questions
    if (results === undefined) {
        triviaFinished();
        return;
    }
    // console.log(results);
    var question = results.question;
    var answers = results.incorrect_answers;
    var correctAnswer = results.correct_answer;
    answers.push(correctAnswer);
    shuffle(answers);

    $("#trivia-counter").text(`${answeredCnt+1}/10`);
    $("#trivia-question").text(he.decode(question));
    answers.forEach(answer => {
        $("#trivia-answers").append(`
        <button class="btn btn-outline-primary trivia-answer my-1" type="button">${he.decode(answer)}</button>
        `);

        
    });
    $('.trivia-answer').off('click').on('click', function() {
        var selectedAnswer = $(this).text();
        validateTriviaAnswer(selectedAnswer, he.decode(correctAnswer));
    });
    countdownTimer = $("#progressTimer").countdownTimer({
        timeLimit: 20,
        warningThreshold: 13,
        dangerThreshold: 17,
        baseStyle: 'bg-success',
        warningStyle: 'bg-warning',
        completeStyle: 'bg-danger',
        onFinish: function() {
            validateTriviaAnswer("", he.decode(correctAnswer));
        }
    });
}

function validateTriviaAnswer(selectedAnswer, correctAnswer){
    countdownTimer.stopCountdown();
    $("#quitChallenge").show();
    answeredCnt += 1;

    $('.trivia-answer').each(function() {
        var answer = $(this).text();
        if (answer === correctAnswer) {
            $(this).removeClass('btn-outline-primary').addClass('btn-success');
        } else if (answer === selectedAnswer || selectedAnswer === "") {
            $(this).removeClass('btn-outline-primary').addClass('btn-danger');
        }
        $(this).off('click');
    });

    $("#next-trivia-div").show();

    if (selectedAnswer === correctAnswer) {
        correctCnt += 1;
        // console.log("Correct!");
        confetti({
            particleCount: 150,
            spread: 180,
            zIndex: 2000
        });
    } else {
        // console.log("Wrong answer. The correct answer was: " + correctAnswer);
    }
}

function quitChallenge(){
    // countdownTimer.stopCountdown();
    triviaFinished();
}

function triviaFinished(){
    $("#next-trivia-div").hide();
    $("#trivia-question").text("Loading...");
    $("#trivia-category").text("");
    $("#trivia-answers").html("");
    $("#quitChallenge").hide();
    $("#trivia-canvas").hide();
    $("#trivia-counter").text(`0/10`);


    var timePassed = answeredCnt * 5;

    challangeFinished(`You answered ${correctCnt} questions correctly!<br>You earned $${correctCnt * reward}.<br>${timePassed} min in game time passed.`, true);

    budget += (correctCnt * reward);
    $("#money-left").text(`$${budget}`);

    gameTimeUpdate(gameTime.getTime() + timePassed * 60 * 1000);
}

// getTriviaToken();