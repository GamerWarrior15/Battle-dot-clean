
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const socket = io();

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let myPlayer = { x: 100, y: 100, name: "" };
let allPlayers = {};

function rejoindre() {
    myPlayer.name = document.getElementById('pseudo').value;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('scoreboard').style.display = 'block';
    socket.emit('joinGame', myPlayer.name);
    gameLoop();
}

window.addEventListener('mousemove', (e) => {
    myPlayer.x = e.clientX;
    myPlayer.y = e.clientY;
    socket.emit('move', { x: myPlayer.x, y: myPlayer.y });
});

socket.on('updatePlayers', (data) => {
    allPlayers = data;
    updateScore();
});

function updateScore() {
    const list = document.getElementById('list');
    list.innerHTML = Object.values(allPlayers)
        .sort((a, b) => b.score - a.score)
        .map(p => `<li>${p.name}: ${p.score}</li>`)
        .join('');
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let id in allPlayers) {
        let p = allPlayers[id];
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.fillText(p.name, p.x - 15, p.y - 25);
    }

    requestAnimationFrame(gameLoop);
}
