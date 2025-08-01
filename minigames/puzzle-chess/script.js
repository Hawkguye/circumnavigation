// https://github.com/jayasurian123/fen-validator
// js-chess-engine currently lacks a validator so use this
import validateFEN from './fen-validator/index.js';

// https://github.com/josefjadrny/js-chess-engine
// Option 1 - With in-memory (should allow us to deal with promotion)
import { Game } from './js-chess-engine/lib/js-chess-engine.mjs';
let game = new Game();

const fenPositions = ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8', 'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7', 'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6', 'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5', 'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4', 'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2', 'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'];
const pieces = ['r', 'n', 'b', 'q', 'k', 'p', 'R', 'N', 'B', 'Q', 'K', 'P'];
const speed = 300;
const game_version = '0.0.2';

let puzzle_solved = false;
let puzzle_solved_clean = true;
let currentPuzzle = '';
let currentFEN = '';
let currentStatus = '';
let lastPuzzleMoveIndex = 0;
let puzzles = {};
let playerRating = 1000;

let games_played = 0;
let games_won = 0;
let games_lost = 0; // Track games lost

window.addEventListener("DOMContentLoaded", (event) => {
    setUpBoard();
    setUpButtons();

    playerRating = getLocalPlayerRating();        
    
    // Initialize game counter
    updateGameCounter();

    fetch('./puzzles/offline/puzzles.csv')
        .then(response => response.text())
        .then(csvString => {
            puzzles = initPuzzles(csvString);
            if (puzzles['param'] == null) {
                loadRandomPuzzle();
            } else {
                loadPuzzle(puzzles['param']);
            }
        })
        .catch(error => {
            console.error('Error fetching puzzles:', error);
        });
});

function setUpBoard() {
    document.getElementById("no-js").remove();

    const board = document.getElementById('board');
    const squares = board.querySelectorAll('div');
    squares.forEach(square => {
        square.addEventListener('pointerdown', function () {
            squareClicked(square)
        });
    });

    const squareClicked = (square) => {
        // console.log(`${square} was clicked!`);
        if (puzzle_solved) {
            return;
        }
        // You may be temped to refactor, but why?
        // unselectAll is catching **edge case** for multiple selected squares
        // you still need to unselect the selected square, if user wants to undo selection
        if (square.classList.contains('selected')) {
            unselectAll();
        } else if (square.classList.contains('circle')) {
            const selected = document.querySelector('.selected');
            unselectAll();
            playerMove(selected.id, square.id);
        } else {
            unselectAll();

            let containsPiece = false;
            for (let i = 0; i < pieces.length; i++) {
                if (square.classList.contains(pieces[i])) {
                    containsPiece = true;
                    break
                }
            }

            // only add selected if piece exists
            if (containsPiece) {
                selectPiece(square);
            }
        }
    }
}

function setUpButtons() {
    const title = document.getElementById('title');
    const menuButton = document.getElementById('menu-button');
    const closeButtons = document.querySelectorAll('.close-button');

    title.addEventListener('dblclick', function () {
        let element = document.getElementById('debug'); 
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
    });

    menuButton.addEventListener('pointerdown', function () {
        document.getElementById('info-modal').style.display = 'flex';
    });

    menuButton.addEventListener('pointerdown', function () {
        document.getElementById('info-modal').style.display = 'flex';
    });

    closeButtons.forEach(closeButton => {
        closeButton.addEventListener('pointerdown', function () {
            this.parentNode.parentNode.style.display = 'none';
        });
    });
}

function unselectAll() {
    const board = document.getElementById('board');
    const squares = board.querySelectorAll('div');
    squares.forEach(square => {
        square.classList.remove('selected');
        square.classList.remove('circle');
    });
}

function clearBoard() {
    const board = document.getElementById('board');
    const squares = board.querySelectorAll('div');
    squares.forEach(square => {
        square.classList = '';
    });
}

function loadBoard(fen) {
    const fenArr = fen.split(' ');
    const piecePlacement = fenArr[0];

    clearBoard();

    // replace numbers with spaces and remove forward slashes
    let newPiecePlacement = piecePlacement.replace(/[0-8/]/g, (match) => {
        if (match === '/') {
            return ''; // remove forward slash
        } else {
            return " ".repeat(parseInt(match)); // repeat " " for the number of times matched
        }
    });

    // add pieces to board
    for (let i = 0; i < newPiecePlacement.length; i++) {
        const square = document.getElementById(fenPositions[i]);
        if (newPiecePlacement[i] !== ' ') {
            square.classList.add(newPiecePlacement[i]);
        }
    }
}

function flipBoard(shouldFlip) {
    const board = document.getElementById('board');
    if (shouldFlip) {
        board.classList.add('flip');
    } else {
        board.classList.remove('flip');
    }
}

function selectPiece(element) {

    const selectedPiece = currentStatus.pieces[element.id.toUpperCase()];

    let canSelectPiece = false;
    if(currentStatus.turn === 'white' && selectedPiece === selectedPiece.toUpperCase()) {
        // white turn and white piece selected
        canSelectPiece = true;
    } else if(currentStatus.turn === 'black' && selectedPiece === selectedPiece.toLowerCase()) {
        // black turn and black piece selected
        canSelectPiece = true;
    }

    const selectedPieceValidMoves = currentStatus.moves[element.id.toUpperCase()];

    if(canSelectPiece) {
        element.classList.add('selected');

        for (let i = 0; i < selectedPieceValidMoves?.length; i++) {
            const square = document.getElementById(selectedPieceValidMoves[i].toLowerCase());
            square.classList.add('circle');
        }
    }
}

function computerMove(from, to) {
    // wait 1 second then move piece
    setTimeout(() => {
        movePiece(from, to);
    }, speed);
}

function playerMove(from, to) {
    let best_move = currentPuzzle.moves[lastPuzzleMoveIndex+1];
    // check if move is solution - slice to avoid possible promotion char
    if(best_move.slice(0,4) === `${from}${to}`) {
        lastPuzzleMoveIndex++;
        // if best_move is length 5, it has promotion
        if (best_move.length === 5) {
            // grab char for promotion
            puzzleMoveGood(from, to, best_move.slice(4));
        } else {
            puzzleMoveGood(from, to);
        }
    } else {
        puzzleMoveBad(from, to);
    }
}

function puzzleMoveGood(from, to, promote = null) {
    movePiece(from, to, promote);
    lastPuzzleMoveIndex++;
    if(currentStatus.isFinished || lastPuzzleMoveIndex >= currentPuzzle.moves.length) {
        updateMessage('<p>Puzzle complete!</p><p class="show">Click for next puzzle.</p>', 'good');
        puzzle_solved = true;

        games_won++; // Increment games_won when puzzle is solved
        // console.log(games_won);

        if(puzzle_solved_clean) {
            calculateRatingChange(currentPuzzle.rating, true);  
        }
        enableNextPuzzle();
    } else {
        updateMessage('<p>Good move, keep going.</p>');
        setTimeout(() => {
            
            computerMove(currentPuzzle.moves[lastPuzzleMoveIndex].substring(0, 2), currentPuzzle.moves[lastPuzzleMoveIndex].substring(2, 4));
        }, speed);
    }
}

function puzzleMoveBad(from, to) {
    const backupStatus = currentFEN;
    const backupPrevious = document.querySelectorAll('.previous');
    movePiece(from, to);
    updateMessage('<p>Wrong move! You did not finish this puzzle.</p><p class="show">Click for next puzzle.</p>', 'bad');
    puzzle_solved_clean = false;
    calculateRatingChange(currentPuzzle.rating, false);
    games_lost++; // Increment games_lost when a bad move is made
    puzzle_solved = true; // Mark puzzle as solved/failed
    enableNextPuzzle(); // Allow user to click to continue
}

function movePiece(from, to, promote = null) {
    game.move(from, to);
    if (promote) {
        if (currentStatus.turn === "white") {
            game.setPiece(to,promote.toUpperCase());
        } else {
            game.setPiece(to,promote.toLowerCase());
        }
    }
    currentStatus = game.exportJson();
    currentFEN = game.exportFEN(currentStatus);
    loadBoard(currentFEN);
    document.getElementById(from).classList.add('previous');
    document.getElementById(to).classList.add('previous');
}

const loadRandomPuzzle = () => {
    const minRating = Math.max(0, getLocalPlayerRating() - 100);
    const maxRating = getLocalPlayerRating() + 100;

    const eligibleRatings = Object.keys(puzzles).filter(rating => rating >= minRating && rating <= maxRating);

    if (eligibleRatings.length === 0) {
        console.error('No puzzles found within the specified rating range.');
        return;
    }

    const randomRating = eligibleRatings[Math.floor(Math.random() * eligibleRatings.length)];
    const randomPuzzle = puzzles[randomRating][Math.floor(Math.random() * puzzles[randomRating].length)];

    loadPuzzle(randomPuzzle);
    puzzle_solved_clean = true;

    disableNextPuzzle();
}

function updateMessage(text, type = '') {
    const message = document.getElementById('message');
    message.innerHTML = text;
    message.classList = type;
}

function loadFen(fen) {
    if (validateFEN(fen)) {
        currentFEN = fen;
        game = new Game(currentFEN);
        currentStatus = game.exportJson();
        loadBoard(currentFEN);
    } else {
        console.log('invalid FEN');
    }
}

function loadPuzzle(puzzle) {
    if (games_played == 5) {
        try {
            window.parent.finishChess(games_won);
        } catch {
            console.log('no parent');
        }
    }
    games_played++;
    puzzle_solved = false;
    currentPuzzle = puzzle;
    loadFen(currentPuzzle.fen); 
    if(currentStatus.turn === 'white') {
        updateMessage('<p>Find the best move for <u>black</u>.</p>');
        flipBoard(true);
    } else {
        updateMessage('<p>Find the best move for <u>white</u>.</p>');
        flipBoard(false);
    }
    computerMove(currentPuzzle.moves[0].substring(0, 2), currentPuzzle.moves[0].substring(2, 4));
    lastPuzzleMoveIndex = 0;

    updateGameInfo();
    updateGameCounter();
    updateDebug();
}

function enableNextPuzzle() {
    document.getElementById('message').addEventListener('click', loadRandomPuzzle);
    document.getElementById('message').classList.add('clickable');
}

function disableNextPuzzle() {
    document.getElementById('message').removeEventListener('click', loadRandomPuzzle);
}

function updateDebug() {
    document.getElementById('debug').innerHTML = `
    <strong>DEBUG INFO</strong>: 
    Puzzle ID: <a href="https://lichess.org/training/${currentPuzzle.puzzle_id}">${currentPuzzle.puzzle_id}</a> - 
    Puzzle Rating: ${currentPuzzle.rating} - 
    Player Rating: ${getLocalPlayerRating()} - 
    Games Won: ${games_won} - Games Lost: ${games_lost}
    `;
}

function updateGameInfo() {
    document.getElementById('game-info').innerHTML = `
    <em>Build v${game_version}</em><br>
    Current Rating: <strong>${getLocalPlayerRating()}</strong><br>
    Games Won: <strong>${games_won}</strong><br>
    Games Lost: <strong>${games_lost}</strong><br>
    `;
}

function updateGameCounter() {
    const gameCounter = document.getElementById('game-counter');
    if (gameCounter) {
        gameCounter.textContent = `Game: ${games_played}/5`;
    }
}

function initPuzzles(csvString) {
    const lines = csvString.split('\n');
    const puzzles = {};

    lines.forEach(line => {
        if (line.trim() !== '') {
        const [puzzle_id, fen, moves, rating] = line.split(',');
        const puzzle = { puzzle_id, fen, moves: moves.split(' '), rating };

        if (!puzzles[rating]) {
            puzzles[rating] = [];
        }

        puzzles[rating].push(puzzle);

        }
    });

    return puzzles;
}

function calculateRatingChange(puzzleRating, solved) {
    const kFactor = 32; // K-factor determines the maximum rating change per game
    const playerWinProbability = 1 / (1 + Math.pow(10, (puzzleRating - getLocalPlayerRating()) / 400));

    const ratingChange = Math.round(kFactor * (solved ? 1 - playerWinProbability : 0 - playerWinProbability));

    storeLocalPlayerRating(getLocalPlayerRating() + ratingChange);
}

// Store the player's rating in localStorage, if available
function storeLocalPlayerRating(rating) {
    playerRating = rating;
}

// Retrieve the player's rating from localStorage, if available
function getLocalPlayerRating() {
    return playerRating;
}
