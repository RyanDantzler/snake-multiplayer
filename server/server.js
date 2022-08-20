const { createServer } = require('http');
const { instrument } = require("@socket.io/admin-ui");

const httpServer = createServer();
const io = require('socket.io')(httpServer, {
    cors: {
        origin: ["https://boisterous-syrniki-4eeaa2.netlify.app", "https://admin.socket.io"],
        credentials: true
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
    client.on('getGameLobbies', handleGetGameLobbies);

    function handleNewGame(game) {
        game = JSON.parse(game);
        let roomId = generateRoomId(8);
        clientRooms[client.id] = roomId;
        client.emit('gameCode', roomId);

        state[roomId] = initGame(game.name, game.password);

        client.join(roomId);
        client.number = 1;
        client.emit('initGame', 1);
    }

    function handleJoinGame(game) {
        game = JSON.parse(game);

        if (state[game.code].password !== game.password) {
            client.emit('incorrectPassword');
            return;
        }

        const room = io.sockets.adapter.rooms.get(game.code);

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

        clientRooms[client.id] = game.code;

        client.join(game.code);
        client.number = 2;
        client.emit('initGame', 2);

        startCountdown(game.code);
    }

    function handleGetGameLobbies() {
        emitGameLobbies(client);
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
        if (state[roomId].countdown > -1) {
            emitCountDown(roomId, state[roomId]);
        } else {
            clearInterval(intervalId);
            startGameInterval(roomId);
        }

        state[roomId].countdown -= 1;
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

function emitGameLobbies(client) {
    client.emit('gameLobbies', JSON.stringify(state));
}

function emitGameOver(roomId, winner) {
    io.sockets.in(roomId)
        .emit('gameOver', JSON.stringify({ winner }));
}

instrument(io, {
    auth: false
  });

httpServer.listen(process.env.PORT || 3000);