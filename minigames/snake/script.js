const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// const restartButton = document.getElementById('restartButton');
const scoreDisplay = document.getElementById('score');
const highscoreDisplay = document.getElementById('highscore');

const gridSize = 20;
const canvasSize = 400;
let snake, food, score, direction, gameInterval, speed;
let highscore = 0;
let attempt = 1;

function initGame() {
    snake = [{ x: gridSize * 5, y: gridSize * 5 }];
    direction = { x: 0, y: 0 };
    score = 0;
    speed = 100;
    placeFood();
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, speed);
    scoreDisplay.textContent = "00";
}

function placeFood() {
    let foodOverlap = true;
    while (foodOverlap) {
        food = {
            x: Math.floor(Math.random() * canvasSize / gridSize) * gridSize,
            y: Math.floor(Math.random() * canvasSize / gridSize) * gridSize
        };
        foodOverlap = snakeCollision(food);
    }
}

function gameLoop() {
    update();
    draw();
}

let changedDirection = false;
function update() {
    changedDirection = false;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreDisplay.textContent = score.toString().padStart(2, '0');
        highscore = Math.max(highscore, score);
        highscoreDisplay.textContent = highscore.toString().padStart(2, '0');
        snake.push({});
        placeFood();
        speed -= 5;
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, speed);
    }

    for (let i = snake.length - 1; i > 0; i--) {
        snake[i] = { ...snake[i - 1] };
    }

    snake[0] = head;

    if (head.x < 0 || head.x >= canvasSize || head.y < 0 || head.y >= canvasSize || snakeCollision(head)) {
        gameOver();
    }
}

function draw() {
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.strokeStyle = '#2c3e50';
    for (let i = 0; i < canvasSize / gridSize; i++) {
        for (let j = 0; j < canvasSize / gridSize; j++) {
            ctx.strokeRect(i * gridSize, j * gridSize, gridSize, gridSize);
        }
    }

    ctx.fillStyle = '#ffffff';
    snake.forEach(segment => ctx.fillRect(segment.x, segment.y, gridSize, gridSize));

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(food.x, food.y, gridSize, gridSize);
}

function snakeCollision(head) {
    return snake.some((segment, index) => index !== 0 && segment.x === head.x && segment.y === head.y);
}

function gameOver(){
    if (attempt === 3){
        try{
            window.parent.finishSnake(highscore);
        }
        catch{console.log('no parent')}
    }
    attempt++;
    document.getElementById('attempt').textContent = attempt;
    initGame();
}

window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
            if (direction.y === 0 && !changedDirection){
                direction = { x: 0, y: -gridSize };
                changedDirection = true;
            }
            break;
        case 's':
        case 'S':
        case 'ArrowDown':
            if (direction.y === 0 && !changedDirection) {
                direction = { x: 0, y: gridSize };
                changedDirection = true;
            }
            break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
            if (direction.x === 0 && !changedDirection) {
                direction = { x: -gridSize, y: 0 };
                changedDirection = true;
            }
            break;
        case 'd':
        case 'D':
        case 'ArrowRight':
            if (direction.x === 0 && !changedDirection) {
                direction = { x: gridSize, y: 0 };
                changedDirection = true;
            }
            break;
    }
});


// touch inputs
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 30; // Minimum distance for a swipe to be considered

// Add touch event listeners to the canvas instead of window
canvas.addEventListener('touchstart', e => {
    e.preventDefault(); // Prevent default touch behavior
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    e.preventDefault(); // Prevent default touch behavior
}, { passive: false });

canvas.addEventListener('touchend', e => {
    e.preventDefault(); // Prevent default touch behavior
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
}, { passive: false });

function handleSwipe(startX, startY, endX, endY) {
    if (changedDirection) {
        return;
    }
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                // Swipe Right
                if (direction.x === 0) direction = { x: gridSize, y: 0 };
            } else {
                // Swipe Left
                if (direction.x === 0) direction = { x: -gridSize, y: 0 };
            }
            changedDirection = true;
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
                // Swipe Down
                if (direction.y === 0) direction = { x: 0, y: gridSize };
            } else {
                // Swipe Up
                if (direction.y === 0) direction = { x: 0, y: -gridSize };
            }
            changedDirection = true;
        }
    }
}

// restartButton.addEventListener('click', initGame);

initGame();
