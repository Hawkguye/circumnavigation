let gameCnt = 0;
function gameFinished(score){
    console.log(score);
    if (gameCnt === 1){
        window.parent.finishDino(score);
    }
    gameCnt += 1;
}