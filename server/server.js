const { createServer } = require('http');

const httpServer = createServer();
const io = require('socket.io')(httpServer, {
    cors: {
        credentials: true,
        origin: "https://boisterous-syrniki-4eeaa2.netlify.app"
      }
});
const { initGame, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');
const { generateRoomId } = require('./utils');

const state = {};
const clientRooms = {};

io.on('connection', client => {
    client.on('keydown', handleKeydown);
    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);
    client.on('rematchGame', handleRematch);

    function handleNewGame() {
        let roomId = generateRoomId(5);
        clientRooms[client.id] = roomId;
        client.emit('gameCode', roomId);

        state[roomId] = initGame();

        client.join(roomId);
        client.number = 1;
        client.emit('init', 1);
    }

    function handleJoinGame(gameCode) {
        const room = io.sockets.adapter.rooms.get(gameCode);

        let numClients = 0;
        if (room) {
            numClients = room.size;
        }

        if (numClients === 0) {
            client.emit('unknownGame');
            return;
        } else if (numClients > 1) {
            client.emit('tooManyPlayers');
            return;
        }

        clientRooms[client.id] = gameCode;

        client.join(gameCode);
        client.number = 2;
        client.emit('init', 2);

        startCountdown(gameCode);
    }

    function handleRematch(gameCode) {
        const room = io.sockets.adapter.rooms.get(gameCode);

        let numClients = 0;
        if (room) {
            numClients = room.size;
        }

        if (numClients == 2) {
            state[gameCode] = initGame();
            io.sockets.in(gameCode).emit('rematch');
            startCountdown(gameCode);
        }
    }

    function handleKeydown(keyCode) {         
        const roomId = clientRooms[client.id];

        if (!roomId || !state[roomId]) {
            return;
        }

        try {
            keyCode = parseInt(keyCode);
        } catch (e) {
            console.log(e);
            return;
        }
    
        const vel = getUpdatedVelocity(state[roomId].players[client.number - 1], keyCode);
    
        if (vel) {
            state[roomId].players[client.number - 1].vel = vel;
        }
    }
});

function startCountdown(roomId) {
    const intervalId = setInterval(() => {
        if (state.countdown > -1) {
            emitCountDown(roomId, state[roomId]);
        } else {
            clearInterval(intervalId);
            startGameInterval(roomId);
        }

        state.countdown -= 1;
    }, 1000);
}

function startGameInterval(roomId) {
    const intervalId = setInterval(() => {
        const winner = gameLoop(state[roomId]);

        if (!winner) {
            emitGameState(roomId, state[roomId]);
        } else {
            emitGameOver(roomId, winner);
            state[roomId] = null;
            clearInterval(intervalId);
        }
    }, 1000 / FRAME_RATE);
}

function emitCountDown(roomId, state) {
    io.sockets.in(roomId)
        .emit('countdown', JSON.stringify(state));
}

function emitGameState(roomId, state) {
    io.sockets.in(roomId)
        .emit('gameState', JSON.stringify(state));
}

function emitGameOver(roomId, winner) {
    io.sockets.in(roomId)
        .emit('gameOver', JSON.stringify({ winner }));
}

httpServer.listen(process.env.PORT || 3000);