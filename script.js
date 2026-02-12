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

let joystick = {
    active: false,
    x: 0,
    y: 0,
    dx: 0,
    dy: 0
};

function rejoindre(){
    const name = document.getElementById("pseudo").value;
    document.getElementById("menu").style.display="none";
    socket.emit("joinGame", name);
}

socket.on("connect", () => {
    myId = socket.id;
});

/* ================= PC CONTROLS ================= */

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener("click", () => {
    socket.emit("shoot");
});

/* ================= MOBILE CONTROLS ================= */

canvas.addEventListener("touchstart", e => {
    const touch = e.touches[0];

    // Joystick gauche
    if(touch.clientX < window.innerWidth / 2){
        joystick.active = true;
        joystick.x = touch.clientX;
        joystick.y = touch.clientY;
    } 
    // Tir droite
    else {
        socket.emit("shoot");
    }
});

canvas.addEventListener("touchmove", e => {
    const touch = e.touches[0];

    if(joystick.active){
        const dx = touch.clientX - joystick.x;
        const dy = touch.clientY - joystick.y;
        const length = Math.sqrt(dx*dx + dy*dy);

        if(length > 0){
            joystick.dx = dx / length;
            joystick.dy = dy / length;
        }
    }

    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
});

canvas.addEventListener("touchend", () => {
    joystick.active = false;
    joystick.dx = 0;
    joystick.dy = 0;
});

/* ================= GAME STATE ================= */

socket.on("state", (data)=>{
    players = data.players;
    bullets = data.bullets;
});

function update(){
    if(!players[myId]) return;

    let dx = 0, dy = 0;

    // PC
    if(keys["z"] || keys["w"]) dy = -1;
    if(keys["s"]) dy = 1;
    if(keys["q"] || keys["a"]) dx = -1;
    if(keys["d"]) dx = 1;

    // Mobile override
    if(joystick.active){
        dx = joystick.dx;
        dy = joystick.dy;
    }

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

    // Draw joystick visual
    if(joystick.active){
        ctx.beginPath();
        ctx.arc(joystick.x, joystick.y, 40, 0, Math.PI*2);
        ctx.strokeStyle = "white";
        ctx.stroke();
    }
}

function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
