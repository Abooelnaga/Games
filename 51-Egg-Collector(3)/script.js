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
let clouds = []; // Array to hold cloud objects
let scorePopups = []; // Array to hold score pop-up texts
let gameRunning = false;
let animationFrameId;
let lastEggDropTime = 0;
let eggDropTimer = EGG_DROP_INTERVAL; // Initial interval
let basketDirection = 0; // -1 for left, 0 for stop, 1 for right
let chickAnimationOffset = 0; // For subtle chick animation
let basketBounceOffset = 0; // For basket bounce animation

// Store previous game dimensions for scaling existing elements on resize
let previousGameWidth = BASE_GAME_WIDTH;
let previousGameHeight = BASE_GAME_HEIGHT;

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

// --- The Main Game Loop (Moved for clarity and to ensure definition before use) ---
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

    // Recalculate chick positions based on new scaled coordinates
    chicks = [
        { x: GAME_WIDTH * 0.2, y: GAME_HEIGHT * 0.08 },
        { x: GAME_WIDTH * 0.5, y: GAME_HEIGHT * 0.08 },
        { x: GAME_WIDTH * 0.8, y: GAME_HEIGHT * 0.08 },
        { x: GAME_WIDTH * 0.35, y: GAME_HEIGHT * 0.2 },
        { x: GAME_WIDTH * 0.65, y: GAME_HEIGHT * 0.2 }
    ];

    // Re-scale existing eggs based on the change in canvas size
    const widthRatio = GAME_WIDTH / previousGameWidth;
    const heightRatio = GAME_HEIGHT / previousGameHeight;

    eggs.forEach(egg => {
        egg.x *= widthRatio;
        egg.y *= heightRatio;
        egg.radius = EGG_RADIUS; // Update radius to new scaled value
        egg.speed *= heightRatio; // Scale speed proportionally
        // rotation and wobbleOffset are animation properties, no need to scale
    });

    // Re-scale existing clouds
    clouds.forEach(cloud => {
        cloud.x *= widthRatio;
        cloud.y *= heightRatio;
        cloud.radiusX *= widthRatio;
        cloud.radiusY *= heightRatio;
        cloud.speed *= widthRatio;
    });

    // Re-scale existing score popups
    scorePopups.forEach(popup => {
        popup.x *= widthRatio;
        popup.y *= heightRatio;
        popup.fontSize = 20 * scaleFactor; // Ensure font size scales with game
    });

    // Update previous dimensions for the next resize event
    previousGameWidth = GAME_WIDTH;
    previousGameHeight = GAME_HEIGHT;

    // Re-create clouds to ensure they are properly scaled and positioned if they were empty
    if (clouds.length === 0 && gameRunning) { // Only create if game is running and no clouds exist
        createClouds();
    }

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

/**
 * Creates a particle effect at a given position on the screen.
 * @param {number} x - X coordinate (canvas) for particles.
 * @param {number} y - Y coordinate (canvas) for particles.
 */
function createParticles(x, y) {
    const numParticles = 5;
    const particleBaseSize = 5; // Base size for particles
    const canvasRect = canvas.getBoundingClientRect(); // Get canvas position on screen

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        const scaledParticleSize = particleBaseSize * (EGG_RADIUS / BASE_EGG_RADIUS); // Scale particle size
        particle.style.width = `${scaledParticleSize}px`;
        particle.style.height = `${scaledParticleSize}px`;

        // Position particles relative to the canvas's screen position
        particle.style.left = `${canvasRect.left + x + (Math.random() - 0.5) * EGG_RADIUS}px`;
        particle.style.top = `${canvasRect.top + y + (Math.random() - 0.5) * EGG_RADIUS}px`;

        const hue = Math.random() * 30 + 30; // Yellowish-orange for a "sparkle" effect
        particle.style.backgroundColor = `hsl(${hue}, 100%, 70%)`;
        document.body.appendChild(particle); // Append to body for independent positioning

        // Remove particle after animation
        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }
}

/**
 * Creates initial clouds for the background.
 */
function createClouds() {
    clouds = []; // Clear existing clouds
    for (let i = 0; i < 3; i++) { // 3 clouds
        clouds.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * GAME_HEIGHT * 0.4, // Top 40% of screen
            radiusX: (50 + Math.random() * 50) * (GAME_WIDTH / BASE_GAME_WIDTH), // Scaled size
            radiusY: (20 + Math.random() * 20) * (GAME_HEIGHT / BASE_GAME_HEIGHT), // Scaled size
            speed: (0.2 + Math.random() * 0.5) * (GAME_WIDTH / BASE_GAME_WIDTH) // Scaled speed
        });
    }
}

/**
 * Draws a single cloud on the canvas.
 * @param {object} cloud - The cloud object with x, y, radiusX, radiusY properties.
 */
function drawCloud(cloud) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Semi-transparent white
    ctx.beginPath();
    // Main body
    ctx.ellipse(cloud.x, cloud.y, cloud.radiusX, cloud.radiusY, 0, 0, Math.PI * 2);
    // Smaller bumps to form cloud shape
    ctx.ellipse(cloud.x - cloud.radiusX * 0.6, cloud.y + cloud.radiusY * 0.2, cloud.radiusX * 0.5, cloud.radiusY * 0.5, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x + cloud.radiusX * 0.6, cloud.y + cloud.radiusY * 0.2, cloud.radiusX * 0.5, cloud.radiusY * 0.5, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x - cloud.radiusX * 0.3, cloud.y - cloud.radiusY * 0.5, cloud.radiusX * 0.4, cloud.radiusY * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x + cloud.radiusX * 0.3, cloud.y - cloud.radiusY * 0.5, cloud.radiusX * 0.4, cloud.radiusY * 0.4, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draws the ground/grass area at the bottom of the canvas.
 */
function drawGround() {
    ctx.fillStyle = '#8bc34a'; // Green grass color
    ctx.beginPath();
    // Draw a rounded rectangle for the ground, slightly extending below the basket
    ctx.roundRect(0, GAME_HEIGHT - (BASKET_HEIGHT * 2) - 10, GAME_WIDTH, BASKET_HEIGHT * 2 + 10, [0, 0, 10 * (GAME_WIDTH / BASE_GAME_WIDTH), 10 * (GAME_WIDTH / BASE_GAME_WIDTH)]); // Rounded bottom corners
    ctx.fill();

    // Add some darker grass texture/details
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < GAME_WIDTH; i += (20 * (GAME_WIDTH / BASE_GAME_WIDTH))) {
        ctx.beginPath();
        ctx.moveTo(i, GAME_HEIGHT - (BASKET_HEIGHT * 2) - 10);
        ctx.lineTo(i + (10 * (GAME_WIDTH / BASE_GAME_WIDTH)), GAME_HEIGHT - (BASKET_HEIGHT * 2) - 10 - (5 * (GAME_HEIGHT / BASE_GAME_HEIGHT)));
        ctx.lineTo(i + (20 * (GAME_WIDTH / BASE_GAME_WIDTH)), GAME_HEIGHT - (BASKET_HEIGHT * 2) - 10);
        ctx.fill();
    }
}


// --- Game Elements Drawing Functions ---

/**
 * Draws the basket on the canvas with modern styling and bounce effect.
 */
function drawBasket() {
    ctx.save();
    // Apply bounce offset
    ctx.translate(0, -basketBounceOffset);

    // Basket body with gradient
    const gradient = ctx.createLinearGradient(basketX, GAME_HEIGHT - BASKET_HEIGHT - (EGG_RADIUS * 2), basketX + BASKET_WIDTH, GAME_HEIGHT - (EGG_RADIUS * 2));
    gradient.addColorStop(0, '#a0522d'); // Sienna
    gradient.addColorStop(0.5, '#cd853f'); // Peru
    gradient.addColorStop(1, '#a0522d'); // Sienna
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(basketX, GAME_HEIGHT - BASKET_HEIGHT - (EGG_RADIUS * 2), BASKET_WIDTH, BASKET_HEIGHT, 5 * (BASKET_WIDTH / BASE_BASKET_WIDTH));
    ctx.fill();

    // Basket handle
    ctx.strokeStyle = '#8b4513'; // SaddleBrown
    ctx.lineWidth = 4 * (BASKET_WIDTH / BASE_BASKET_WIDTH);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(basketX + BASKET_WIDTH / 2, GAME_HEIGHT - BASKET_HEIGHT - (EGG_RADIUS * 2) - (BASKET_HEIGHT / 2), BASKET_WIDTH / 2.5, Math.PI, 2 * Math.PI);
    ctx.stroke();

    // Subtle shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10 * (BASKET_WIDTH / BASE_BASKET_WIDTH);
    ctx.shadowOffsetX = 3 * (BASKET_WIDTH / BASE_BASKET_WIDTH);
    ctx.shadowOffsetY = 3 * (BASKET_WIDTH / BASE_BASKET_WIDTH);
    ctx.fillRect(basketX, GAME_HEIGHT - BASKET_HEIGHT - (EGG_RADIUS * 2), BASKET_WIDTH, BASKET_HEIGHT); // Apply shadow to the main body
    ctx.shadowColor = 'transparent'; // Reset shadow

    ctx.restore();
}

/**
 * Draws an egg on the canvas with a more realistic look and wobble.
 * @param {object} egg - The egg object with x, y, and color properties.
 */
function drawEgg(egg) {
    ctx.save();
    ctx.translate(egg.x, egg.y); // Translate to egg's center

    // Apply wobble translation
    const wobbleX = Math.sin(egg.wobbleOffset) * (EGG_RADIUS * 0.2);
    ctx.translate(wobbleX, 0);

    ctx.rotate(egg.rotation || 0); // Apply rotation

    // Egg body with gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, EGG_RADIUS * 1.5);
    gradient.addColorStop(0, egg.color);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)'); // Lighter center for highlight
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, EGG_RADIUS, EGG_RADIUS * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 5 * (EGG_RADIUS / BASE_EGG_RADIUS);
    ctx.shadowOffsetX = 2 * (EGG_RADIUS / BASE_EGG_RADIUS);
    ctx.shadowOffsetY = 2 * (EGG_RADIUS / BASE_EGG_RADIUS);
    ctx.fill(); // Re-fill to apply shadow

    ctx.shadowColor = 'transparent'; // Reset shadow

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-EGG_RADIUS * 0.4, -EGG_RADIUS * 0.6, EGG_RADIUS * 0.3, EGG_RADIUS * 0.5, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Draws a chick on the canvas with more detail and subtle animation.
 * @param {object} chick - The chick object with x, y properties.
 */
function drawChick(chick) {
    ctx.save();
    ctx.translate(chick.x, chick.y);

    // Subtle bobbing animation
    const bobOffset = Math.sin(chickAnimationOffset * 0.1 + chick.x * 0.01) * (CHICK_HEIGHT * 0.05);
    ctx.translate(0, bobOffset);

    // Wing flapping animation
    const wingFlapAngle = Math.sin(chickAnimationOffset * 0.2 + chick.x * 0.02) * 0.3; // Max 0.3 radians (approx 17 degrees)

    // Body
    ctx.fillStyle = '#ffd700'; // Gold yellow
    ctx.beginPath();
    ctx.arc(0, 0, CHICK_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(CHICK_WIDTH / 4, -CHICK_HEIGHT / 3, CHICK_WIDTH / 4, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#ffa500'; // Orange
    ctx.beginPath();
    ctx.moveTo(CHICK_WIDTH / 4 + CHICK_WIDTH / 8, -CHICK_HEIGHT / 3);
    ctx.lineTo(CHICK_WIDTH / 4 + CHICK_WIDTH / 8 + (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)), -CHICK_HEIGHT / 3 - (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)));
    ctx.lineTo(CHICK_WIDTH / 4 + CHICK_WIDTH / 8 + (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)), -CHICK_HEIGHT / 3 + (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)));
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(CHICK_WIDTH / 4 + (3 * (CHICK_WIDTH / BASE_CHICK_WIDTH)), -CHICK_HEIGHT / 3 - (5 * (CHICK_WIDTH / BASE_CHICK_WIDTH)), 2 * (CHICK_WIDTH / BASE_CHICK_WIDTH), 0, Math.PI * 2);
    ctx.fill();

    // Wings (simple triangles with rotation)
    ctx.fillStyle = '#ffec8b'; // Lighter yellow

    // Left wing
    ctx.save();
    ctx.translate(-CHICK_WIDTH / 2, CHICK_HEIGHT * 0.1); // Pivot point
    ctx.rotate(-wingFlapAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-CHICK_WIDTH * 0.1, CHICK_HEIGHT * 0.1);
    ctx.lineTo(0, CHICK_HEIGHT * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Right wing
    ctx.save();
    ctx.translate(CHICK_WIDTH / 2, CHICK_HEIGHT * 0.1); // Pivot point
    ctx.rotate(wingFlapAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(CHICK_WIDTH * 0.1, CHICK_HEIGHT * 0.1);
    ctx.lineTo(0, CHICK_HEIGHT * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
}

// --- Game Logic Functions ---

/**
 * Generates a random color for an egg.
 * @returns {string} A hex color string.
 */
function getRandomEggColor() {
    const colors = ['#f8d7da', '#cce5ff', '#d4edda', '#fff3cd', '#e2e3e5', '#fce4ec', '#e1bee7']; // More pastel colors
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
        color: getRandomEggColor(),
        rotation: Math.random() * Math.PI * 2, // Initial random rotation
        rotationSpeed: (Math.random() - 0.5) * 0.05, // Random rotation speed
        wobbleOffset: Math.random() * Math.PI * 2 // Initial wobble phase
    });
}

/**
 * Updates the game state for each frame.
 * @param {DOMHighResTimeStamp} currentTime - The current time provided by requestAnimationFrame.
 */
function update(currentTime) {
    if (!gameRunning) return;

    // Update chick animation offset
    chickAnimationOffset += 0.05;

    // Update basket bounce
    if (basketBounceOffset > 0) {
        basketBounceOffset = Math.max(0, basketBounceOffset - (BASKET_SPEED * 0.5)); // Gradual decrease
    }

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
        egg.rotation += egg.rotationSpeed; // Update egg rotation
        egg.wobbleOffset += 0.1; // Update egg wobble phase

        // Check for collision with basket
        if (egg.y + egg.radius > GAME_HEIGHT - BASKET_HEIGHT - (EGG_RADIUS * 2) && // Adjusted collision Y
            egg.x > basketX &&
            egg.x < basketX + BASKET_WIDTH) {
            score++;
            scoreDisplay.textContent = `النقاط: ${score}`;
            scoreDisplay.classList.add('score-pulse'); // Add pulse animation
            setTimeout(() => scoreDisplay.classList.remove('score-pulse'), 300); // Remove after animation
            createParticles(egg.x, egg.y); // Create particles on collection
            basketBounceOffset = BASKET_HEIGHT * 0.5; // Apply bounce to basket
            scorePopups.push({
                x: egg.x,
                y: egg.y,
                value: '+1',
                opacity: 1,
                fontSize: 20 * (GAME_WIDTH / BASE_GAME_WIDTH) // Scaled font size
            });
            eggs.splice(i, 1); // Remove collected egg
            collectSound.triggerAttackRelease('C5', '8n'); // Play collect sound
        }
        // Check if egg hit the ground
        else if (egg.y + egg.radius > GAME_HEIGHT) {
            lives--;
            livesDisplay.textContent = `الحياة: ${lives}`;
            eggs.splice(i, 1); // Remove missed egg
            missSound.triggerAttackRelease('8n'); // Play miss sound
            if (lives <= 0) {
                gameOver();
                return; // Stop updating if game is over
            }
        }
    }

    // Update clouds position
    clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > GAME_WIDTH + cloud.radiusX * 2) {
            cloud.x = -cloud.radiusX * 2; // Loop back from left
            cloud.y = Math.random() * GAME_HEIGHT * 0.4; // New random y
            cloud.radiusX = (50 + Math.random() * 50) * (GAME_WIDTH / BASE_GAME_WIDTH);
            cloud.radiusY = (20 + Math.random() * 20) * (GAME_HEIGHT / BASE_GAME_HEIGHT);
            cloud.speed = (0.2 + Math.random() * 0.5) * (GAME_WIDTH / BASE_GAME_WIDTH);
        }
    });

    // Update score popups
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        const popup = scorePopups[i];
        popup.y -= 1; // Move up
        popup.opacity -= 0.02; // Fade out
        if (popup.opacity <= 0) {
            scorePopups.splice(i, 1);
        }
    }
}

/**
 * Draws all game elements on the canvas.
 */
function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT); // Clear canvas

    clouds.forEach(drawCloud); // Draw clouds first
    drawGround(); // Draw ground

    chicks.forEach(drawChick);
    eggs.forEach(drawEgg);
    drawBasket();

    // Draw score popups
    scorePopups.forEach(popup => {
        ctx.save();
        ctx.globalAlpha = popup.opacity;
        ctx.fillStyle = '#4CAF50'; // Green color for score
        ctx.font = `${popup.fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(popup.value, popup.x, popup.y);
        ctx.restore();
    });
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
    scorePopups = []; // Clear popups on new game
    gameRunning = true;
    lastEggDropTime = performance.now();
    eggDropTimer = EGG_DROP_INTERVAL; // Reset egg drop interval
    basketDirection = 0; // Ensure basket is stopped at start
    basketBounceOffset = 0; // Reset basket bounce

    // Create chicks at various positions using scaled coordinates
    chicks.push({ x: GAME_WIDTH * 0.2, y: GAME_HEIGHT * 0.08 });
    chicks.push({ x: GAME_WIDTH * 0.5, y: GAME_HEIGHT * 0.08 });
    chicks.push({ x: GAME_WIDTH * 0.8, y: GAME_HEIGHT * 0.08 });
    chicks.push({ x: GAME_WIDTH * 0.35, y: GAME_HEIGHT * 0.2 });
    chicks.push({ x: GAME_WIDTH * 0.65, y: GAME_HEIGHT * 0.2 });

    createClouds(); // Initialize clouds when game starts

    scoreDisplay.textContent = `النقاط: ${score}`;
    livesDisplay.textContent = `الحياة: ${lives}`;

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
    showMessageBox(`انتهت اللعبة! نقاطك: ${score}`, 'العب مرة أخرى', startGame);
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
    showMessageBox('اجمع البيض المتساقط!', 'بدء اللعبة', startGame);
    // Re-setup canvas on window resize to maintain responsiveness
    window.addEventListener('resize', setupCanvas);
};