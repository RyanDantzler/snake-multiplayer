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
      lastDirection: 'right',
      snake: [
        { x: 3, y: 8 },
        { x: 4, y: 8 },
        { x: 5, y: 8 }
      ],
      score: 0
    },
    {
    //   pos: {
    //     x: 15,
    //     y: 12,
    //   },
      pos: {
        x: 25,
        y: 22,
      },
      vel: {
        x: -1,
        y: 0
      },
      lastDirection: 'left',
    //   snake: [
    //     { x: 17, y: 12 },
    //     { x: 16, y: 12 },
    //     { x: 15, y: 12 }
    //   ],
      snake: [
        { x: 27, y: 22 },
        { x: 26, y: 22 },
        { x: 25, y: 22 }
      ],
      score: 0
    }],
    food: {
      x: 0,
      y: 0
    },
    gridsize: GRID_SIZE,
    countdown: 3
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

  if (playerOne.vel.x == 1) {
    playerOne.lastDirection = 'right';
  } else if (playerOne.vel.x == -1) {
    playerOne.lastDirection = 'left';
  } else if (playerOne.vel.y == 1) {
    playerOne.lastDirection = 'up';
  } else {
    playerOne.lastDirection = 'down';
  }

  if (playerTwo.vel.x == 1) {
    playerTwo.lastDirection = 'right';
  } else if (playerTwo.vel.x == -1) {
    playerTwo.lastDirection = 'left';
  } else if (playerTwo.vel.y == 1) {
    playerTwo.lastDirection = 'up';
  } else {
    playerTwo.lastDirection = 'down';
  }

  if (playerOne.pos.x < 0 || playerOne.pos.x === GRID_SIZE || playerOne.pos.y < 0 || playerOne.pos.y === GRID_SIZE) {
    return 2;
  }

  if (playerTwo.pos.x < 0 || playerTwo.pos.x === GRID_SIZE || playerTwo.pos.y < 0 || playerTwo.pos.y === GRID_SIZE) {
    return 1;
  }

  if (state.food.x === playerOne.pos.x && state.food.y === playerOne.pos.y) {
    playerOneGrows = true;
    playerOne.score += 1;
    randomFood(state);
  }

  if (state.food.x === playerTwo.pos.x && state.food.y === playerTwo.pos.y) {
    playerTwoGrows = true;
    playerTwo.score += 1;
    randomFood(state);
  }

  if (playerOne.vel.x || playerOne.vel.y) {
    for (let cell of playerOne.snake) {
      if (cell.x === playerOne.pos.x && cell.y === playerOne.pos.y) {
        return 2;
      }
    }

    for (let cell of playerTwo.snake) {
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

    for (let cell of playerOne.snake) {
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

function getUpdatedVelocity(player, keyCode) {
    switch (keyCode) {
        case 37: // left
            if (player.lastDirection !== 'right') return { x: -1, y: 0 };
            break;
        case 38: // up
            if (player.lastDirection !== 'up') return { x: 0, y: -1 };
            break;
        case 39: // right
            if (player.lastDirection !== 'left') return { x: 1, y: 0 };
            break;
        case 40: // down
            if (player.lastDirection !== 'down') return { x: 0, y: 1 };
            break;
        default:
            break;
    }

    return player.vel;
}

module.exports = {
  initGame,
  gameLoop,
  getUpdatedVelocity
}