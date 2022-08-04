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
        const room = io.sockets.adapter.rooms[gameCode];

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

        startGameInterval(gameCode);
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
    
        const vel = getUpdatedVelocity(keyCode);
    
        if (vel) {
            state[roomId].players[client.number - 1].vel = vel;
        }
    }
});

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

function emitGameState(roomId, state) {
    io.sockets.in(roomId)
        .emit('gameState', JSON.stringify(state));
}

function emitGameOver(roomId, winner) {
    io.sockets.in(roomId)
        .emit('gameOver', JSON.stringify({ winner }));
}

httpServer.listen(process.env.PORT || 3000);