const socket = io();
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let keys = {};
let mouse = { x:0, y:0 };
let players = {};
let bullets = [];
let myId = null;

function rejoindre(){
    const name = document.getElementById("pseudo").value;
    document.getElementById("menu").style.display="none";
    socket.emit("joinGame", name);
}

socket.on("connect", () => {
    myId = socket.id;
});

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener("click", () => {
    socket.emit("shoot");
});

socket.on("state", (data)=>{
    players = data.players;
    bullets = data.bullets;
});

function update(){
    if(!players[myId]) return;

    let dx = 0, dy = 0;

    if(keys["z"] || keys["w"]) dy = -1;
    if(keys["s"]) dy = 1;
    if(keys["q"] || keys["a"]) dx = -1;
    if(keys["d"]) dx = 1;

    const angle = Math.atan2(
        mouse.y - players[myId].y,
        mouse.x - players[myId].x
    );

    socket.emit("move", { dx, dy, angle });
}

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    for(let id in players){
        const p = players[id];

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle="white";
        ctx.fillText(p.name, p.x-15, p.y-25);

        // HP bar
        ctx.fillStyle="red";
        ctx.fillRect(p.x-20, p.y+20, 40, 5);

        ctx.fillStyle="lime";
        ctx.fillRect(p.x-20, p.y+20, 40*(p.hp/100), 5);
    }

    bullets.forEach(b=>{
        ctx.fillStyle="yellow";
        ctx.beginPath();
        ctx.arc(b.x,b.y,5,0,Math.PI*2);
        ctx.fill();
    });
}

function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
