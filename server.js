
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname)));

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;
const PLAYER_RADIUS = 15;

let players = {};

io.on('connection', (socket) => {

    socket.on('joinGame', (username) => {
        players[socket.id] = {
            id: socket.id,
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            name: username || "Joueur",
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            score: 0
        };

        io.emit('updatePlayers', players);
    });

    socket.on('move', (data) => {
        if (!players[socket.id]) return;

        // Server validates position
        let newX = Math.max(PLAYER_RADIUS, Math.min(WORLD_WIDTH - PLAYER_RADIUS, data.x));
        let newY = Math.max(PLAYER_RADIUS, Math.min(WORLD_HEIGHT - PLAYER_RADIUS, data.y));

        players[socket.id].x = newX;
        players[socket.id].y = newY;

        io.emit('updatePlayers', players);
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
