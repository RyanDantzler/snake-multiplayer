const BG_COLOR = '#333';
const FOOD_COLOR = '#faf';
const SNAKE_COLOR = '#aff';
let gameActive = false;
let initialPaint = true;
// const CORRECT_COLOR = '#f4f';
// const WRONG_COLOR = '#4ff';

const socket = io('https://desolate-sea-20141.herokuapp.com/');

socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownGame', handleUnknownGame);
socket.on('tooManyPlayers', handleTooManyPlayers);

const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const gameCode = document.getElementById('gameCode');
const gameScore = document.getElementById('gameScore');
const player1Score = document.getElementById('scoreOne');
const player2Score = document.getElementById('scoreTwo');

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);

function newGame() {
    socket.emit('newGame');
    init();
}

function joinGame() {
    const code = gameCodeInput.value;
    socket.emit('joinGame', code);
    init();
}

let canvas, ctx;
let playerNumber;

function init() {
    initialScreen.style.display = "none";
    gameScreen.style.display = "block";

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = canvas.height = 600;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ctx.font = '30px Arial';
    // ctx.textAlign = 'center';
    // let text = 'hello world';
    // const textDim = ctx.measureText(text);
    // ctx.fillStyle = CORRECT_COLOR;
    // ctx.fillText("width:" + textDim.width, canvas.width / 2, 50);
    // ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    // ctx.globalCompositeOperation = 'destination-over';
    // ctx.fillStyle = '#aaa';
    // ctx.fillRect((canvas.width - textDim.width) / 2, (canvas.height / 2) - textDim.actualBoundingBoxAscent, 190, textDim.actualBoundingBoxAscent + textDim.actualBoundingBoxDescent);
    // ctx.globalCompositeOperation = 'source-over';

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
    document.getElementById('btn-up').addEventListener('click', () => handleButtonClick('up'));
    document.getElementById('btn-down').addEventListener('click', () => handleButtonClick('down'));
    document.getElementById('btn-left').addEventListener('click', () => handleButtonClick('left'));
    document.getElementById('btn-right').addEventListener('click', () => handleButtonClick('right'));

    gameActive = true;
}

function handleClick(e) {
    console.log(e);
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
    // console.log(keycode);
    socket.emit('keydown', keycode);
}

function paintGame(state) {
    if (initialPaint) {
        gameCode.style.display = "none";
        gameScore.style.display = "block";
        initialPaint = false;
    }

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const food = state.food;
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;

    ctx.fillStyle = FOOD_COLOR;
    ctx.fillRect(food.x * size, food.y * size, size, size);

    paintPlayer(state.players[0], size, SNAKE_COLOR);
    paintPlayer(state.players[1], size, 'blue');
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

function handleGameOver(data) {
    if (!gameActive) {
        return;
    }

    // window.alert("Game Over");
    data = JSON.parse(data);
    
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    let text = '';
    
    if (data.winner == playerNumber) {
        text = 'You Win!';
    } else {
        text = 'You lose.';
    }
    const textDim = ctx.measureText(text);
    ctx.fillStyle = SNAKE_COLOR;
    // ctx.fillText("width:" + textDim.width, canvas.width / 2, 50);
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    gameActive = false;
}

function handleGameCode(gameCode) {
    gameCodeDisplay.innerText = gameCode;
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
    player1Score.innerText = state.players[0].score;
    player2Score.innerText = state.players[1].score;
}

function reset() {
    playerNumber = null;
    gameCodeInput.value = "";
    gameCodeDisplay.innerText = "";
    initialScreen.style.display = "block";
    gameScreen.style.display = "none";
}

function handleInit(number) {
    playerNumber = number;
}