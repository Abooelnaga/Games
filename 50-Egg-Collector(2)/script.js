const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const startButton = document.getElementById('startButton');
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');

// --- Base Game Configuration (Reference for scaling) ---
const BASE_GAME_WIDTH = 500;
const BASE_GAME_HEIGHT = 600;
const BASE_BASKET_WIDTH = 80;
const BASE_BASKET_HEIGHT = 20;
const BASE_EGG_RADIUS = 10;
const BASE_CHICK_WIDTH = 40;
const BASE_CHICK_HEIGHT = 40;
const BASE_BASKET_SPEED = 5;
const BASE_EGG_SPEED_MIN = 2;
const BASE_EGG_SPEED_MAX = 4;

// --- Game Configuration (Dynamic, scaled values) ---
let GAME_WIDTH;
let GAME_HEIGHT;
let BASKET_WIDTH;
let BASKET_HEIGHT;
let EGG_RADIUS;
let CHICK_WIDTH;
let CHICK_HEIGHT;
let BASKET_SPEED;
let EGG_SPEED_MIN;
let EGG_SPEED_MAX;

const INITIAL_LIVES = 3;
const EGG_DROP_INTERVAL = 1000;
const MAX_EGGS_ON_SCREEN = 10;

// --- Game State Variables ---
let score = 0;
let lives = INITIAL_LIVES;
let basketX;
let eggs = [];
let chicks = [];
let gameRunning = false;
let animationFrameId;
let lastEggDropTime = 0;
let eggDropTimer = EGG_DROP_INTERVAL;
let basketDirection = 0;
let chickAnimationOffset = 0;

// --- Sound Effects (using Tone.js) ---
const collectSound = new Tone.Synth().toDestination();
collectSound.oscillator.type = 'triangle';
const missSound = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.2 }
}).toDestination();
const gameOverSound = new Tone.MembraneSynth().toDestination();

// --- Helper Functions ---
function setupCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    GAME_WIDTH = canvas.width;
    GAME_HEIGHT = canvas.height;
    const scaleFactor = GAME_WIDTH / BASE_GAME_WIDTH;
    BASKET_WIDTH = BASE_BASKET_WIDTH * scaleFactor;
    BASKET_HEIGHT = BASE_BASKET_HEIGHT * scaleFactor;
    EGG_RADIUS = BASE_EGG_RADIUS * scaleFactor;
    CHICK_WIDTH = BASE_CHICK_WIDTH * scaleFactor;
    CHICK_HEIGHT = BASE_CHICK_HEIGHT * scaleFactor;
    BASKET_SPEED = BASE_BASKET_SPEED * scaleFactor;
    EGG_SPEED_MIN = BASE_EGG_SPEED_MIN * scaleFactor;
    EGG_SPEED_MAX = BASE_EGG_SPEED_MAX * scaleFactor;
    if (!gameRunning) {
        basketX = (GAME_WIDTH - BASKET_WIDTH) / 2;
    } else {
        basketX = Math.max(0, Math.min(GAME_WIDTH - BASKET_WIDTH, basketX));
    }
    chicks = [
        { x: GAME_WIDTH * 0.2, y: GAME_HEIGHT * 0.08 },
        { x: GAME_WIDTH * 0.5, y: GAME_HEIGHT * 0.08 },
        { x: GAME_WIDTH * 0.8, y: GAME_HEIGHT * 0.08 },
        { x: GAME_WIDTH * 0.35, y: GAME_HEIGHT * 0.2 },
        { x: GAME_WIDTH * 0.65, y: GAME_HEIGHT * 0.2 }
    ];
    eggs.forEach(egg => {
        const oldScaleFactor = egg.x / (BASE_GAME_WIDTH * (egg.originalX / BASE_GAME_WIDTH));
        egg.x = (egg.x / oldScaleFactor) * scaleFactor;
        egg.y = (egg.y / oldScaleFactor) * scaleFactor;
        egg.radius = EGG_RADIUS;
        egg.speed = (egg.speed / oldScaleFactor) * scaleFactor;
    });
    draw();
}

function showMessageBox(message, buttonText, buttonAction) {
    messageText.textContent = message;
    startButton.textContent = buttonText;
    startButton.onclick = buttonAction;
    messageBox.style.display = 'flex';
    messageBox.style.flexDirection = 'column';
    messageBox.style.justifyContent = 'center';
    messageBox.style.alignItems = 'center';
}

function hideMessageBox() {
    messageBox.style.display = 'none';
}

function createParticles(x, y) {
    const numParticles = 5;
    const particleSize = EGG_RADIUS / 2;
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.width = `${particleSize}px`;
        particle.style.height = `${particleSize}px`;
        particle.style.left = `${x + (Math.random() - 0.5) * EGG_RADIUS}px`;
        particle.style.top = `${y + (Math.random() - 0.5) * EGG_RADIUS}px`;
        const hue = Math.random() * 30 + 30;
        particle.style.backgroundColor = `hsl(${hue}, 100%, 70%)`;
        canvas.parentNode.appendChild(particle);
        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }
}

// --- Drawing Functions ---
function drawBasket() {
    const gradient = ctx.createLinearGradient(basketX, GAME_HEIGHT - BASKET_HEIGHT - (EGG_RADIUS * 2), basketX + BASKET_WIDTH, GAME_HEIGHT - (EGG_RADIUS * 2));
    gradient.addColorStop(0, '#a0522d');
    gradient.addColorStop(0.5, '#cd853f');
    gradient.addColorStop(1, '#a0522d');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(basketX, GAME_HEIGHT - BASKET_HEIGHT - (EGG_RADIUS * 2), BASKET_WIDTH, BASKET_HEIGHT, 5 * (BASKET_WIDTH / BASE_BASKET_WIDTH));
    ctx.fill();
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 4 * (BASKET_WIDTH / BASE_BASKET_WIDTH);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(basketX + BASKET_WIDTH / 2, GAME_HEIGHT - BASKET_HEIGHT - (EGG_RADIUS * 2) - (BASKET_HEIGHT / 2), BASKET_WIDTH / 2.5, Math.PI, 2 * Math.PI);
    ctx.stroke();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10 * (BASKET_WIDTH / BASE_BASKET_WIDTH);
    ctx.shadowOffsetX = 3 * (BASKET_WIDTH / BASE_BASKET_WIDTH);
    ctx.shadowOffsetY = 3 * (BASKET_WIDTH / BASE_BASKET_WIDTH);
    ctx.fillRect(basketX, GAME_HEIGHT - BASKET_HEIGHT - (EGG_RADIUS * 2), BASKET_WIDTH, BASKET_HEIGHT);
    ctx.shadowColor = 'transparent';
}

function drawEgg(egg) {
    ctx.save();
    ctx.translate(egg.x, egg.y);
    ctx.rotate(egg.rotation || 0);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, egg.radius * 1.5);
    gradient.addColorStop(0, egg.color);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, egg.radius, egg.radius * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 5 * (EGG_RADIUS / BASE_EGG_RADIUS);
    ctx.shadowOffsetX = 2 * (EGG_RADIUS / BASE_EGG_RADIUS);
    ctx.shadowOffsetY = 2 * (EGG_RADIUS / BASE_EGG_RADIUS);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-egg.radius * 0.4, -egg.radius * 0.6, egg.radius * 0.3, egg.radius * 0.5, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawChick(chick) {
    ctx.save();
    ctx.translate(chick.x, chick.y);
    const bobOffset = Math.sin(chickAnimationOffset * 0.1 + chick.x * 0.01) * (CHICK_HEIGHT * 0.05);
    ctx.translate(0, bobOffset);
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(0, 0, CHICK_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(CHICK_WIDTH / 4, -CHICK_HEIGHT / 3, CHICK_WIDTH / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffa500';
    ctx.beginPath();
    ctx.moveTo(CHICK_WIDTH / 4 + CHICK_WIDTH / 8, -CHICK_HEIGHT / 3);
    ctx.lineTo(CHICK_WIDTH / 4 + CHICK_WIDTH / 8 + (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)), -CHICK_HEIGHT / 3 - (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)));
    ctx.lineTo(CHICK_WIDTH / 4 + CHICK_WIDTH / 8 + (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)), -CHICK_HEIGHT / 3 + (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(CHICK_WIDTH / 4 + (3 * (CHICK_WIDTH / BASE_CHICK_WIDTH)), -CHICK_HEIGHT / 3 - (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)), 2 * (CHICK_WIDTH / BASE_CHICK_WIDTH), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffec8b';
    ctx.beginPath();
    ctx.moveTo(-CHICK_WIDTH / 2, 0);
    ctx.lineTo(-CHICK_WIDTH / 2 - (CHICK_WIDTH * 0.1), CHICK_HEIGHT * 0.2);
    ctx.lineTo(-CHICK_WIDTH / 2, CHICK_HEIGHT * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(CHICK_WIDTH / 2, 0);
    ctx.lineTo(CHICK_WIDTH / 2 + (CHICK_WIDTH * 0.1), CHICK_HEIGHT * 0.2);
    ctx.lineTo(CHICK_WIDTH / 2, CHICK_HEIGHT * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// --- Game Logic Functions ---
function getRandomEggColor() {
    const colors = ['#f8d7da', '#cce5ff', '#d4edda', '#fff3cd', '#e2e3e5', '#fce4ec', '#e1bee7'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function createEgg() {
    if (chicks.length === 0) return;
    const randomChick = chicks[Math.floor(Math.random() * chicks.length)];
    eggs.push({
        x: randomChick.x,
        y: randomChick.y + CHICK_HEIGHT / 2,
        radius: EGG_RADIUS,
        speed: Math.random() * (EGG_SPEED_MAX - EGG_SPEED_MIN) + EGG_SPEED_MIN,
        color: getRandomEggColor(),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05
    });
}

function update(currentTime) {
    if (!gameRunning) return;
    chickAnimationOffset += 0.05;
    basketX += basketDirection * BASKET_SPEED;
    basketX = Math.max(0, Math.min(GAME_WIDTH - BASKET_WIDTH, basketX));
    if (currentTime - lastEggDropTime > eggDropTimer && eggs.length < MAX_EGGS_ON_SCREEN) {
        createEgg();
        lastEggDropTime = currentTime;
        eggDropTimer = Math.max(500, eggDropTimer - 5);
    }
    for (let i = eggs.length - 1; i >= 0; i--) {
        const egg = eggs[i];
        egg.y += egg.speed;
        egg.rotation += egg.rotationSpeed;
        if (egg.y + egg.radius > GAME_HEIGHT - BASKET_HEIGHT - (EGG_RADIUS * 2) &&
            egg.x > basketX &&
            egg.x < basketX + BASKET_WIDTH) {
            score++;
            scoreDisplay.textContent = `النقاط: ${score}`;
            scoreDisplay.classList.add('score-pulse');
            setTimeout(() => scoreDisplay.classList.remove('score-pulse'), 300);
            createParticles(egg.x, egg.y);
            eggs.splice(i, 1);
            collectSound.triggerAttackRelease('C5', '8n');
        } else if (egg.y + egg.radius > GAME_HEIGHT) {
            lives--;
            livesDisplay.textContent = `الحياة: ${lives}`;
            eggs.splice(i, 1);
            missSound.triggerAttackRelease('8n');
            if (lives <= 0) {
                gameOver();
                return;
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    chicks.forEach(drawChick);
    eggs.forEach(drawEgg);
    drawBasket();
}

function gameLoop(currentTime) {
    update(currentTime);
    draw();
    if (gameRunning) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    hideMessageBox();
    score = 0;
    lives = INITIAL_LIVES;
    basketX = (GAME_WIDTH - BASKET_WIDTH) / 2;
    eggs = [];
    chicks = [];
    gameRunning = true;
    lastEggDropTime = performance.now();
    eggDropTimer = EGG_DROP_INTERVAL;
    basketDirection = 0;
    chicks.push({ x: GAME_WIDTH * 0.2, y: GAME_HEIGHT * 0.08 });
    chicks.push({ x: GAME_WIDTH * 0.5, y: GAME_HEIGHT * 0.08 });
    chicks.push({ x: GAME_WIDTH * 0.8, y: GAME_HEIGHT * 0.08 });
    chicks.push({ x: GAME_WIDTH * 0.35, y: GAME_HEIGHT * 0.2 });
    chicks.push({ x: GAME_WIDTH * 0.65, y: GAME_HEIGHT * 0.2 });
    scoreDisplay.textContent = `النقاط: ${score}`;
    livesDisplay.textContent = `الحياة: ${lives}`;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    gameOverSound.triggerAttackRelease('C2', '1n');
    showMessageBox(`انتهت اللعبة! نقاطك: ${score}`, 'العب مرة أخرى', startGame);
}

// --- Event Listeners ---
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        basketDirection = -1;
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        basketDirection = 1;
    }
});
document.addEventListener('keyup', (e) => {
    if (!gameRunning) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
        basketDirection = 0;
    }
});
let touchStartX = 0;
let isDragging = false;
canvas.addEventListener('touchstart', (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    isDragging = true;
    touchStartX = e.touches[0].clientX;
});
canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning || !isDragging) return;
    e.preventDefault();
    const touchCurrentX = e.touches[0].clientX;
    const deltaX = touchCurrentX - touchStartX;
    const scale = canvas.width / canvas.offsetWidth;
    basketX += deltaX * scale;
    basketX = Math.max(0, Math.min(GAME_WIDTH - BASKET_WIDTH, basketX));
    touchStartX = touchCurrentX;
});
canvas.addEventListener('touchend', () => {
    isDragging = false;
});
canvas.addEventListener('touchcancel', () => {
    isDragging = false;
});
leftButton.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (!gameRunning) return;
    basketDirection = -1;
});
leftButton.addEventListener('mouseup', () => {
    basketDirection = 0;
});
leftButton.addEventListener('mouseleave', () => {
    basketDirection = 0;
});
leftButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameRunning) return;
    basketDirection = -1;
});
leftButton.addEventListener('touchend', () => {
    basketDirection = 0;
});
leftButton.addEventListener('touchcancel', () => {
    basketDirection = 0;
});
rightButton.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (!gameRunning) return;
    basketDirection = 1;
});
rightButton.addEventListener('mouseup', () => {
    basketDirection = 0;
});
rightButton.addEventListener('mouseleave', () => {
    basketDirection = 0;
});
rightButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameRunning) return;
    basketDirection = 1;
});
rightButton.addEventListener('touchend', () => {
    basketDirection = 0;
});
rightButton.addEventListener('touchcancel', () => {
    basketDirection = 0;
});
window.onload = () => {
    setupCanvas();
    showMessageBox('اجمع البيض المتساقط!', 'بدء اللعبة', startGame);
    window.addEventListener('resize', setupCanvas);
};
