const BG_COLOR = '#333';
const FOOD_COLOR = '#faf';
const TEXT_COLOR = '#aff';
const SNAKE_PLAYER_COLOR = '#aff';
const SNAKE_OPPONENT_COLOR = '#ffcd00';

let gameActive = false;
let initialPaint = true;
let gameRoom;
let canvas, ctx;
let playerNumber;
let player1Color;
let player2Color;

const socket = io('https://desolate-sea-20141.herokuapp.com/');

socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('countdown', handleCountdown);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownGame', handleUnknownGame);
socket.on('tooManyPlayers', handleTooManyPlayers);
socket.on('rematch', handleRestart);

const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const countdownDisplay = document.getElementById('countdown');
const gameCode = document.getElementById('gameCode');
const gameScore = document.getElementById('gameScore');
const playerScore = document.getElementById('playerScore');
const opponentScore = document.getElementById('opponentScore');
const rematchButton = document.getElementById('rematchButton');

document.ondblclick = function(e) {
    e.preventDefault();
}

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);
rematchButton.addEventListener('click', handleRematch);

function newGame() {
    socket.emit('newGame');
    init();
}

function joinGame() {
    const code = gameCodeInput.value;
    socket.emit('joinGame', code);
    gameRoom = code;
    init();
}

function handleRematch() {
    playerScore.innerText = 0;
    opponentScore.innerText = 0;

    socket.emit('rematchGame', gameRoom);
    init();
}

function handleRestart() {
    init();
    countdownDisplay.innerText = "";
    countdownDisplay.style.display = "block";
}

function init() {
    initialScreen.style.display = "none";
    gameScreen.style.display = "flex";
    rematchButton.style.visibility = "hidden";

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = canvas.height = 600;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (initialPaint) {
        document.addEventListener('keydown', handleKeydown);
        document.getElementById('btn-up').addEventListener('click', () => handleButtonClick('up'));
        document.getElementById('btn-down').addEventListener('click', () => handleButtonClick('down'));
        document.getElementById('btn-left').addEventListener('click', () => handleButtonClick('left'));
        document.getElementById('btn-right').addEventListener('click', () => handleButtonClick('right'));
    }

    gameActive = true;
}

function handleKeydown(e) {
    socket.emit('keydown', e.keyCode);
}

function handleButtonClick(direction) {
    let keycode = 0;

    switch (direction) {
        case 'left':
            keycode = 37;
            break;
        case 'up':
            keycode = 38;
            break;
        case 'right':
            keycode = 39;
            break;
        case 'down':
            keycode = 40;
            break;
        default:
            break;
    }

    socket.emit('keydown', keycode);
}

function paintGame(state) {
    if (initialPaint) {
        gameCode.style.display = "none";
        gameScore.style.display = "block";
        initialPaint = false;
        player1Color = playerNumber == 1 ? SNAKE_PLAYER_COLOR : SNAKE_OPPONENT_COLOR;
        player2Color = playerNumber == 2 ? SNAKE_PLAYER_COLOR : SNAKE_OPPONENT_COLOR;
    }

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const food = state.food;
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;

    ctx.fillStyle = FOOD_COLOR;
    ctx.fillRect(food.x * size, food.y * size, size, size);

    paintPlayer(state.players[0], size, player1Color);
    paintPlayer(state.players[1], size, player2Color);
    updateScore(state);
}

function paintPlayer(playerState, size, color) {
    const snake = playerState.snake;

    ctx.fillStyle = color;
    for (let cell of snake) {
        ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
}

function handleGameState(gameState) {
    if (!gameActive) {
        return;
    }

    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => paintGame(gameState));
}

function handleCountdown(state) {
    console.log("countdown message recieved.");
    state = JSON.parse(state);
    if (state.countdown == 3) {
        paintGame(state);
    }

    if (state.countdown > 0) {
        countdownDisplay.innerText = state.countdown;
    } else {
        countdownDisplay.innerText = 'GO';
        setTimeout(() => {
            countdownDisplay.style.display = "none";
        }, 1000);
    }
}

function handleGameOver(data) {
    if (!gameActive) {
        return;
    }

    data = JSON.parse(data);
    
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    let text = '';
    
    if (data.winner == playerNumber) {
        text = 'You Win!';
    } else {
        text = 'You lose.';
    }

    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    rematchButton.style.visibility = "visible";
    gameActive = false;
}

function handleGameCode(gameCode) {
    gameCodeDisplay.innerText = gameCode;
    gameRoom = gameCode;
}

function handleUnknownGame() {
    reset();
    alert("Unknown game code.");
}

function handleTooManyPlayers() {
    reset();
    alert("This game is already in progress.");
}

function updateScore(state) {
    if (playerNumber == 1) {
        playerScore.innerText = state.players[0].score;
        opponentScore.innerText = state.players[1].score;
    }
    else {
        playerScore.innerText = state.players[1].score;
        opponentScore.innerText = state.players[0].score;
    }
}

function reset() {
    playerNumber = null;
    gameCodeInput.value = "";
    gameCodeDisplay.innerText = "";
    initialScreen.style.display = "flex";
    gameScreen.style.display = "none";
}

function handleInit(number) {
    playerNumber = number;
}