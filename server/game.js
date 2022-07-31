const { GRID_SIZE } = require('./constants');

function initGame() {
    const state = createGameState();
    randomFood(state);
    return state;
}

function createGameState() {
    return {
        players: [{
            pos: {
                x: 5,
                y: 8,
            },
            vel: {
                x: 1,
                y: 0
            },
            snake: [
                { x: 3, y: 8 },
                { x: 4, y: 8 },
                { x: 5, y: 8 }
            ]
        },
        {
            pos: {
                x: 15,
                y: 12,
            },
            vel: {
                x: -1,
                y: 0
            },
            snake: [
                { x: 17, y: 12 },
                { x: 16, y: 12 },
                { x: 15, y: 12 }
            ]
        }],
        food: {
            x: 0, 
            y: 0
        },
        gridsize: GRID_SIZE
    };
}

function gameLoop(state) {
    if (!state) {
        return;
    }

    const playerOne = state.players[0];
    const playerTwo = state.players[1];
    let playerOneGrows = false;
    let playerTwoGrows = false;

    playerOne.pos.x += playerOne.vel.x;
    playerOne.pos.y += playerOne.vel.y;
    playerTwo.pos.x += playerTwo.vel.x;
    playerTwo.pos.y += playerTwo.vel.y;

    if (playerOne.pos.x < 0 || playerOne.pos.x === GRID_SIZE || playerOne.pos.y < 0 || playerOne.pos.y === GRID_SIZE) {
        return 2;
    }

    if (playerTwo.pos.x < 0 || playerTwo.pos.x === GRID_SIZE || playerTwo.pos.y < 0 || playerTwo.y === GRID_SIZE) {
        return 1;
    }

    if (state.food.x === playerOne.pos.x && state.food.y === playerOne.pos.y) {
        playerOneGrows = true;
        randomFood(state);
    }

    if (state.food.x === playerTwo.pos.x && state.food.y === playerTwo.pos.y) {
        playerTwoGrows = true;
        randomFood(state);
    }

    if (playerOne.vel.x || playerOne.vel.y) {
        for (let cell of playerOne.snake) {
            if (cell.x === playerOne.pos.x && cell.y === playerOne.pos.y) {
                return 2;
            }
        }

        playerOne.snake.push({ ...playerOne.pos });
        if (!playerOneGrows) {
            playerOne.snake.shift();
        }
    }

    if (playerTwo.vel.x || playerTwo.vel.y) {
        for (let cell of playerTwo.snake) {
            if (cell.x === playerTwo.pos.x && cell.y === playerTwo.pos.y) {
                return 1;
            }
        }

        playerTwo.snake.push({ ...playerTwo.pos });
        if (!playerTwoGrows) {
            playerTwo.snake.shift();
        }
    }

    return false;
}

function randomFood(state) {
    food = {
        x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1, 
        y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
    }

    for (let cell of state.players[0].snake) {
        if (cell.x === food.x && cell.y === food.y) {
            return randomFood(state);
        }
    }

    for (let cell of state.players[1].snake) {
        if (cell.x === food.x && cell.y === food.y) {
            return randomFood(state);
        }
    }

    state.food = food;
}

function getUpdatedVelocity(keyCode) {
    switch (keyCode) {
        case 37: // left
            return { x: -1, y: 0 };
        case 38: // down
            return { x: 0, y: -1 };
        case 39: // right
            return { x: 1, y: 0 };
        case 40: // up
            return { x: 0, y: 1 };
        default:
            break;
    }
}

module.exports = {
    initGame,
    gameLoop,
    getUpdatedVelocity
}