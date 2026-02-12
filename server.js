const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname)));

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;
const PLAYER_RADIUS = 15;
const BULLET_RADIUS = 5;

let players = {};
let bullets = [];

io.on('connection', (socket) => {

    socket.on('joinGame', (username) => {
        players[socket.id] = {
            id: socket.id,
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            name: username || "Joueur",
            color: `hsl(${Math.random() * 360},70%,50%)`,
            hp: 100,
            score: 0,
            angle: 0
        };
        io.emit('state', { players, bullets });
    });

    socket.on('move', (data) => {
        const p = players[socket.id];
        if (!p) return;

        p.x += data.dx * PLAYER_SPEED;
        p.y += data.dy * PLAYER_SPEED;
        p.angle = data.angle;

        p.x = Math.max(PLAYER_RADIUS, Math.min(WORLD_WIDTH - PLAYER_RADIUS, p.x));
        p.y = Math.max(PLAYER_RADIUS, Math.min(WORLD_HEIGHT - PLAYER_RADIUS, p.y));
    });

    socket.on('shoot', () => {
        const p = players[socket.id];
        if (!p) return;

        bullets.push({
            x: p.x,
            y: p.y,
            angle: p.angle,
            owner: socket.id
        });
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

function gameLoop() {

    bullets.forEach((b, index) => {
        b.x += Math.cos(b.angle) * BULLET_SPEED;
        b.y += Math.sin(b.angle) * BULLET_SPEED;

        for (let id in players) {
            const p = players[id];
            if (id === b.owner) continue;

            const dx = p.x - b.x;
            const dy = p.y - b.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < PLAYER_RADIUS + BULLET_RADIUS) {
                p.hp -= 20;
                bullets.splice(index, 1);

                if (p.hp <= 0) {
                    players[b.owner].score++;
                    p.hp = 100;
                    p.x = Math.random() * WORLD_WIDTH;
                    p.y = Math.random() * WORLD_HEIGHT;
                }
            }
        }
    });

    bullets = bullets.filter(b =>
        b.x > 0 && b.x < WORLD_WIDTH &&
        b.y > 0 && b.y < WORLD_HEIGHT
    );

    io.emit('state', { players, bullets });
}

setInterval(gameLoop, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on " + PORT));
