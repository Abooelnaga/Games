/* filepath: script.js */
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
// These values define the game's proportions at a reference resolution.
// All drawn elements and speeds will be scaled relative to these.
const BASE_GAME_WIDTH = 500;
const BASE_GAME_HEIGHT = 600;
const BASE_BASKET_WIDTH = 80;
const BASE_BASKET_HEIGHT = 20;
const BASE_EGG_RADIUS = 10;
const BASE_CHICK_WIDTH = 40;
const BASE_CHICK_HEIGHT = 40;
const BASE_BASKET_SPEED = 5; // Speed at which the basket moves continuously
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
const EGG_DROP_INTERVAL = 1000; // milliseconds
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
let eggDropTimer = EGG_DROP_INTERVAL; // Initial interval
let basketDirection = 0; // -1 for left, 0 for stop, 1 for right

// --- Sound Effects (using Tone.js) ---
const collectSound = new Tone.Synth().toDestination();
collectSound.oscillator.type = 'triangle';
const missSound = new Tone.NoiseSynth({
    noise: {
        type: 'white'
    },
    envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.05,
        release: 0.2
    }
}).toDestination();
const gameOverSound = new Tone.MembraneSynth().toDestination();

// --- Helper Functions ---

/**
 * Sets up the canvas dimensions and scales game element sizes based on current canvas size.
 * This function is called on initial load and window resize.
 */
function setupCanvas() {
    // Set canvas drawing buffer size to its actual display size
    // This ensures crisp rendering on high-DPI screens and adapts to CSS sizing.
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    GAME_WIDTH = canvas.width;
    GAME_HEIGHT = canvas.height;

    // Calculate a scaling factor based on the canvas width relative to the base width.
    // Using width for scaling all elements helps maintain aspect ratio.
    const scaleFactor = GAME_WIDTH / BASE_GAME_WIDTH;

    BASKET_WIDTH = BASE_BASKET_WIDTH * scaleFactor;
    BASKET_HEIGHT = BASE_BASKET_HEIGHT * scaleFactor;
    EGG_RADIUS = BASE_EGG_RADIUS * scaleFactor;
    CHICK_WIDTH = BASE_CHICK_WIDTH * scaleFactor;
    CHICK_HEIGHT = BASE_CHICK_HEIGHT * scaleFactor;
    BASKET_SPEED = BASE_BASKET_SPEED * scaleFactor;
    EGG_SPEED_MIN = BASE_EGG_SPEED_MIN * scaleFactor;
    EGG_SPEED_MAX = BASE_EGG_SPEED_MAX * scaleFactor;

    // Re-position basket to center if game is not running (e.g., on resize before start)
    if (!gameRunning) {
        basketX = (GAME_WIDTH - BASKET_WIDTH) / 2;
    } else {
        // If game is running, adjust basket position to keep it within bounds
        basketX = Math.max(0, Math.min(GAME_WIDTH - BASKET_WIDTH, basketX));
    }

    // Re-position chicks and eggs based on new scale
    // For chicks, we want them to stay at relative positions
    chicks = [
        { x: GAME_WIDTH * 0.2, y: GAME_HEIGHT * 0.08 },
        { x: GAME_WIDTH * 0.5, y: GAME_HEIGHT * 0.08 },
        { x: GAME_WIDTH * 0.8, y: GAME_HEIGHT * 0.08 },
        { x: GAME_WIDTH * 0.35, y: GAME_HEIGHT * 0.2 },
        { x: GAME_WIDTH * 0.65, y: GAME_HEIGHT * 0.2 }
    ];

    // Eggs need to be re-scaled and re-positioned too
    eggs.forEach(egg => {
        egg.x *= scaleFactor; // Simple scaling, might not be perfect if aspect ratio changes significantly
        egg.y *= scaleFactor;
        egg.radius = EGG_RADIUS;
        egg.speed *= scaleFactor;
    });

    draw(); // Redraw immediately after resizing
}

/**
 * Displays a message box with the given text and button.
 * @param {string} message - The message to display.
 * @param {string} buttonText - The text for the button.
 * @param {function} buttonAction - The function to call when the button is clicked.
 */
function showMessageBox(message, buttonText, buttonAction) {
    messageText.textContent = message;
    startButton.textContent = buttonText;
    startButton.onclick = buttonAction;
    messageBox.style.display = 'flex';
    messageBox.style.flexDirection = 'column';
    messageBox.style.justifyContent = 'center';
    messageBox.style.alignItems = 'center';
}

/**
 * Hides the message box.
 */
function hideMessageBox() {
    messageBox.style.display = 'none';
}

// --- Game Elements Drawing Functions ---

/**
 * Draws the basket on the canvas.
 */
function drawBasket() {
    ctx.fillStyle = '#8b4513'; // Brown
    ctx.beginPath();
    // Main basket body
    ctx.roundRect(basketX, GAME_HEIGHT - BASKET_HEIGHT - (EGG_RADIUS * 2), BASKET_WIDTH, BASKET_HEIGHT, 5 * (BASKET_WIDTH / BASE_BASKET_WIDTH)); // Scale corner radius
    ctx.fill();
    // Handle for the basket (optional aesthetic)
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3 * (BASKET_WIDTH / BASE_BASKET_WIDTH); // Scale line width
    ctx.beginPath();
    ctx.arc(basketX + BASKET_WIDTH / 2, GAME_HEIGHT - BASKET_HEIGHT - (EGG_RADIUS * 2), BASKET_WIDTH / 3, Math.PI, 2 * Math.PI);
    ctx.stroke();
}

/**
 * Draws an egg on the canvas.
 * @param {object} egg - The egg object with x, y, and color properties.
 */
function drawEgg(egg) {
    ctx.fillStyle = egg.color;
    ctx.beginPath();
    // Draw an oval shape for the egg
    ctx.ellipse(egg.x, egg.y, egg.radius, egg.radius * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b0b0b0'; // Light grey border
    ctx.lineWidth = 1 * (EGG_RADIUS / BASE_EGG_RADIUS); // Scale line width
    ctx.stroke();
}

/**
 * Draws a chick on the canvas.
 * @param {object} chick - The chick object with x, y properties.
 */
function drawChick(chick) {
    ctx.fillStyle = '#ffd700'; // Gold yellow for chick body
    ctx.beginPath();
    // Body
    ctx.arc(chick.x, chick.y, CHICK_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.arc(chick.x + CHICK_WIDTH / 4, chick.y - CHICK_HEIGHT / 3, CHICK_WIDTH / 4, 0, Math.PI * 2);
    ctx.fill();
    // Beak
    ctx.fillStyle = '#ffa500'; // Orange
    ctx.beginPath();
    ctx.moveTo(chick.x + CHICK_WIDTH / 4 + CHICK_WIDTH / 8, chick.y - CHICK_HEIGHT / 3);
    ctx.lineTo(chick.x + CHICK_WIDTH / 4 + CHICK_WIDTH / 8 + (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)), chick.y - CHICK_HEIGHT / 3 - (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)));
    ctx.lineTo(chick.x + CHICK_WIDTH / 4 + CHICK_WIDTH / 8 + (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)), chick.y - CHICK_HEIGHT / 3 + (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)));
    ctx.closePath();
    ctx.fill();
    // Eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(chick.x + CHICK_WIDTH / 4 + (3 * (CHICK_WIDTH / BASE_CHICK_WIDTH)), chick.y - CHICK_HEIGHT / 3 - (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)), 2 * (CHICK_WIDTH / BASE_CHICK_WIDTH), 0, Math.PI * 2);
    ctx.fill();
}

// --- Game Logic Functions ---

/**
 * Generates a random color for an egg.
 * @returns {string} A hex color string.
 */
function getRandomEggColor() {
    const colors = ['#f8d7da', '#cce5ff', '#d4edda', '#fff3cd', '#e2e3e5']; // Pastel colors
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Creates a new egg at a random chick's position.
 */
function createEgg() {
    if (chicks.length === 0) return;
    const randomChick = chicks[Math.floor(Math.random() * chicks.length)];
    eggs.push({
        x: randomChick.x,
        y: randomChick.y + CHICK_HEIGHT / 2, // Start below the chick
        radius: EGG_RADIUS,
        speed: Math.random() * (EGG_SPEED_MAX - EGG_SPEED_MIN) + EGG_SPEED_MIN,
        color: getRandomEggColor()
    });
}

/**
 * Updates the game state for each frame.
 * @param {DOMHighResTimeStamp} currentTime - The current time provided by requestAnimationFrame.
 */
function update(currentTime) {
    if (!gameRunning) return;

    // Move the basket based on its direction and speed
    basketX += basketDirection * BASKET_SPEED;
    // Keep basket within canvas bounds
    basketX = Math.max(0, Math.min(GAME_WIDTH - BASKET_WIDTH, basketX));

    // Generate new eggs
    if (currentTime - lastEggDropTime > eggDropTimer && eggs.length < MAX_EGGS_ON_SCREEN) {
        createEgg();
        lastEggDropTime = currentTime;
        // Slightly decrease interval to increase difficulty over time
        eggDropTimer = Math.max(500, eggDropTimer - 5);
    }

    // Update egg positions and check for collisions
    for (let i = eggs.length - 1; i >= 0; i--) {
        const egg = eggs[i];
        egg.y += egg.speed;

        // Check for collision with basket
        if (egg.y + egg.radius > GAME_HEIGHT - BASKET_HEIGHT - (EGG_RADIUS * 2) && // Adjusted collision Y
            egg.x > basketX &&
            egg.x < basketX + BASKET_WIDTH) {
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            eggs.splice(i, 1); // Remove collected egg
            collectSound.triggerAttackRelease('C5', '8n'); // Play collect sound
        }
        // Check if egg hit the ground
        else if (egg.y + egg.radius > GAME_HEIGHT) {
            lives--;
            livesDisplay.textContent = `Lives: ${lives}`;
            eggs.splice(i, 1); // Remove missed egg
            missSound.triggerAttackRelease('8n'); // Play miss sound
            if (lives <= 0) {
                gameOver();
                return; // Stop updating if game is over
            }
        }
    }
}

/**
 * Draws all game elements on the canvas.
 */
function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT); // Clear canvas

    chicks.forEach(drawChick);
    eggs.forEach(drawEgg);
    drawBasket();
}

/**
 * The main game loop.
 * @param {DOMHighResTimeStamp} currentTime - The current time provided by requestAnimationFrame.
 */
function gameLoop(currentTime) {
    update(currentTime);
    draw();
    if (gameRunning) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

/**
 * Initializes the game state and starts the game.
 */
function startGame() {
    hideMessageBox();
    score = 0;
    lives = INITIAL_LIVES;
    basketX = (GAME_WIDTH - BASKET_WIDTH) / 2; // Recalculate initial basket position
    eggs = [];
    chicks = [];
    gameRunning = true;
    lastEggDropTime = performance.now();
    eggDropTimer = EGG_DROP_INTERVAL; // Reset egg drop interval
    basketDirection = 0; // Ensure basket is stopped at start

    // Create chicks at various positions using scaled coordinates
    chicks.push({ x: GAME_WIDTH * 0.2, y: GAME_HEIGHT * 0.08 });
    chicks.push({ x: GAME_WIDTH * 0.5, y: GAME_HEIGHT * 0.08 });
    chicks.push({ x: GAME_WIDTH * 0.8, y: GAME_HEIGHT * 0.08 });
    chicks.push({ x: GAME_WIDTH * 0.35, y: GAME_HEIGHT * 0.2 });
    chicks.push({ x: GAME_WIDTH * 0.65, y: GAME_HEIGHT * 0.2 });

    scoreDisplay.textContent = `Score: ${score}`;
    livesDisplay.textContent = `Lives: ${lives}`;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId); // Cancel any previous animation frame
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Ends the game and displays the game over message.
 */
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    gameOverSound.triggerAttackRelease('C2', '1n'); // Play game over sound
    showMessageBox(`Game Over! Your Score: ${score}`, 'Play Again', startGame);
}

// --- Event Listeners ---

// Keyboard controls
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
    // Only stop if the released key was one of the movement keys
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
        basketDirection = 0;
    }
});

// Touch controls for mobile (dragging on canvas)
let touchStartX = 0;
let isDragging = false;
canvas.addEventListener('touchstart', (e) => {
    if (!gameRunning) return;
    e.preventDefault(); // Prevent scrolling
    isDragging = true;
    touchStartX = e.touches[0].clientX;
});

canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning || !isDragging) return;
    e.preventDefault(); // Prevent scrolling
    const touchCurrentX = e.touches[0].clientX;
    const deltaX = touchCurrentX - touchStartX;
    // Scale touch movement to canvas coordinates
    const scale = canvas.width / canvas.offsetWidth; // Get current display scale
    basketX += deltaX * scale;
    basketX = Math.max(0, Math.min(GAME_WIDTH - BASKET_WIDTH, basketX));
    touchStartX = touchCurrentX;
});

canvas.addEventListener('touchend', () => {
    isDragging = false;
});
canvas.addEventListener('touchcancel', () => { // Handle cases where touch is interrupted
    isDragging = false;
});


// Button controls for mobile (hold to move)
leftButton.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (!gameRunning) return;
    basketDirection = -1;
});
leftButton.addEventListener('mouseup', () => {
    basketDirection = 0;
});
leftButton.addEventListener('mouseleave', () => { // Stop if mouse leaves button while held
    basketDirection = 0;
});
leftButton.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
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
rightButton.addEventListener('mouseleave', () => { // Stop if mouse leaves button while held
    basketDirection = 0;
});
rightButton.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    if (!gameRunning) return;
    basketDirection = 1;
});
rightButton.addEventListener('touchend', () => {
    basketDirection = 0;
});
rightButton.addEventListener('touchcancel', () => {
    basketDirection = 0;
});


// Initial setup and display start message
window.onload = () => {
    setupCanvas();
    showMessageBox('Collect the falling eggs!', 'Start Game', startGame);
    // Re-setup canvas on window resize to maintain responsiveness
    window.addEventListener('resize', setupCanvas);
};