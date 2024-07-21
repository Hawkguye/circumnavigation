var timeLeft = 60;
const timeEl = document.getElementById("time-left");

function updateTime(){
    timeLeft -= 1;
    timeEl.innerHTML = timeLeft;
    // console.log(data.score);
    if (timeLeft <= 0){
        gameOver();
    } 
}

function gameOver(){
    clearInterval(updateInterval);
    window.parent.finish2048(data.score);
}

const updateInterval = setInterval(updateTime, 1000);