const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');

// --- Game Constants & Configuration ---
const TILE_SIZE = 20; // Size of each grid square
const PAC_COLOR = '#f0f030'; // Retro Yellow
const WALL_COLOR = '#3030f0'; // Retro Blue
const DOT_COLOR = '#ffffff'; // White
const GHOST_COLOR = '#f03030'; // Retro Red
const GHOST_COLOR_PURPLE = '#8A2BE2'; // Purple ghost
const GHOST_COLOR_GREEN = '#00FF00'; // Green ghost
const BACKGROUND_COLOR = '#000000'; // Black background inside canvas
const EYE_COLOR = '#000000'; // Black eye

const PAC_SPEED = 1; // Tiles per move cycle (keep it 1 for simplicity)
const GHOST_SPEED = 1; // Tiles per move cycle

// --- Maze Layout ---
// 0 = Path, 1 = Wall, 2 = Dot, 3 = Empty (after dot eaten), 4 = Ghost Start, 5 = Pac Start
const initialMaze = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1, 1], // 0 area for ghost house
    [0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 4, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0], // Use 0 to allow entry/exit
    [1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 5, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1], // 5 = Pac Start
    [1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// عناصر الصوت للعبة
const introMusic = new Audio('audio/intro.wav'); // صوت الافتتاح
const eatSound = new Audio('audio/munch.wav'); // صوت أكل النقاط
const eatFruitSound = new Audio('audio/fruit.wav'); // صوت أكل الفاكهة
const eatGhostSound = new Audio('audio/ghost.wav'); // صوت أكل الأشباح
const extraLifeSound = new Audio('audio/extra.wav'); // صوت الحياة الإضافية
const intermissionSound = new Audio('audio/intermission.wav'); // صوت الفاصل
const deathSound = new Audio('audio/death.wav'); // صوت الموت

let maze = []; // This will hold the current state of the maze
let score = 0;
let totalDots = 0;
let pacBoy;
let ghost;
let ghostPurple;
let ghostGreen;
let gameLoopInterval;
let gameOver = false;
let gameWon = false;
const GAME_SPEED_MS = 180; // Milliseconds per game tick (controls speed)

// --- Helper Functions ---
function getTile(x, y) {
    const gridX = Math.floor(x / TILE_SIZE);
    const gridY = Math.floor(y / TILE_SIZE);
    if (gridY >= 0 && gridY < maze.length && gridX >= 0 && gridX < maze[0].length) {
        return maze[gridY][gridX];
    }
    return 1; // Treat out of bounds as a wall
}

function isWall(gridX, gridY) {
    if (gridY < 0 || gridY >= maze.length || gridX < 0 || gridX >= maze[0].length) {
        return true; // Out of bounds is a wall
    }
    return maze[gridY][gridX] === 1;
}

function deepCopyMaze(mazeToCopy) {
    return JSON.parse(JSON.stringify(mazeToCopy));
}

function showMessage(text) {
    messageElement.textContent = text;
    messageElement.classList.remove('hidden');
}

function hideMessage() {
    messageElement.classList.add('hidden');
}

// --- Character Class (Base for PacBoy and Ghost) ---
class Character {
    constructor(x, y, speed, color) {
        this.x = x; // Grid X
        this.y = y; // Grid Y
        this.speed = speed; // Tiles per move
        this.color = color;
        this.dx = 0; // Direction x (-1 left, 1 right)
        this.dy = 0; // Direction y (-1 up, 1 down)
    }

    // Basic draw function (can be overridden)
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(
            this.x * TILE_SIZE + TILE_SIZE / 2,
            this.y * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE / 2 * 0.8, // Slightly smaller than tile
            0, Math.PI * 2
        );
        ctx.fill();
        ctx.closePath();
    }

    // Check if the character is centered on a tile
    isAtTileCenter() {
        // In a grid-based movement, we are always 'at the center' before a move
        return true;
    }

    // Get potential valid moves from current position
    getValidMoves() {
        const moves = [];
        // Check Up
        if (!isWall(this.x, this.y - 1)) moves.push({ dx: 0, dy: -1 });
        // Check Down
        if (!isWall(this.x, this.y + 1)) moves.push({ dx: 0, dy: 1 });
        // Check Left
        if (!isWall(this.x - 1, this.y)) moves.push({ dx: -1, dy: 0 });
        // Check Right
        if (!isWall(this.x + 1, this.y)) moves.push({ dx: 1, dy: 0 });
        return moves;
    }
}

// --- PacBoy Class ---
class PacBoy extends Character {
    constructor(x, y, speed, color) {
        super(x, y, speed, color);
        this.nextDx = 1; // Start moving right
        this.nextDy = 0;
        this.dx = 1; // Current direction
        this.dy = 0;
        this.mouthOpen = 0.2; // For animation (0.0 to 0.5)
        this.mouthOpening = true;
    }

    draw(ctx) {
        // Animate mouth
        const angleOffset = this.mouthOpen * Math.PI;
        let startAngle = angleOffset;
        let endAngle = Math.PI * 2 - angleOffset;

        // Adjust angles based on direction
        if (this.dx === 1) { // Right
            // Default angles are fine
        } else if (this.dx === -1) { // Left
            startAngle += Math.PI;
            endAngle += Math.PI;
        } else if (this.dy === -1) { // Up
            startAngle += Math.PI * 1.5;
            endAngle += Math.PI * 1.5;
        } else if (this.dy === 1) { // Down
            startAngle += Math.PI * 0.5;
            endAngle += Math.PI * 0.5;
        }


        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(
            this.x * TILE_SIZE + TILE_SIZE / 2,
            this.y * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE / 2 * 0.8,
            startAngle,
            endAngle
        );
        ctx.lineTo(this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE + TILE_SIZE / 2); // Line to center to close mouth
        ctx.fill();
        ctx.closePath();

        // Eye (simple version)
        ctx.fillStyle = EYE_COLOR;
        let eyeX = this.x * TILE_SIZE + TILE_SIZE / 2;
        let eyeY = this.y * TILE_SIZE + TILE_SIZE / 2;

        if (this.dx === 1) eyeX += TILE_SIZE * 0.15; // Right
        else if (this.dx === -1) eyeX -= TILE_SIZE * 0.15; // Left

        if (this.dy === 1) eyeY += TILE_SIZE * 0.15; // Down
        else if (this.dy === -1) eyeY -= TILE_SIZE * 0.15; // Up

        // Default eye position slightly up if moving horizontally, slightly right if moving vertically
        if (this.dx !== 0) eyeY -= TILE_SIZE * 0.2;
        else if (this.dy !== 0) eyeX += TILE_SIZE * 0.2;
        else eyeY -= TILE_SIZE * 0.2; // Default when stopped (shouldn't happen often)


        ctx.beginPath();
        ctx.arc(eyeX, eyeY, TILE_SIZE * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        // Update mouth animation state
        if (this.mouthOpening) {
            this.mouthOpen += 0.05;
            if (this.mouthOpen >= 0.4) this.mouthOpening = false;
        } else {
            this.mouthOpen -= 0.05;
            if (this.mouthOpen <= 0.05) this.mouthOpening = true;
        }
    }

    setDirection(dx, dy) {
        this.nextDx = dx;
        this.nextDy = dy;
    }

    update() {
        let targetX = this.x;
        let targetY = this.y;
        let currentTileChanged = false;

        // Check if the *next* direction is valid from the current spot
        const canTurn = !isWall(this.x + this.nextDx, this.y + this.nextDy);

        if (canTurn) {
            // Only change actual direction if the new direction is different
            if (this.dx !== this.nextDx || this.dy !== this.nextDy) {
                this.dx = this.nextDx;
                this.dy = this.nextDy;
                currentTileChanged = true; // Direction changed, may need to re-evaluate move
            }
        }

        // Check if the *current* direction is valid
        const canMove = !isWall(this.x + this.dx, this.y + this.dy);

        if (canMove) {
            targetX = this.x + this.dx;
            targetY = this.y + this.dy;
        } else {
            // If we can't move forward, try the next direction again just in case
            // This helps turning in corners immediately
            if (canTurn && !currentTileChanged) { // Avoid double move if direction just changed
                this.dx = this.nextDx;
                this.dy = this.nextDy;
                if (!isWall(this.x + this.dx, this.y + this.dy)) {
                    targetX = this.x + this.dx;
                    targetY = this.y + this.dy;
                } else {
                    // Hit a wall in the new direction too, stop
                    this.dx = 0;
                    this.dy = 0;
                }
            } else {
                // Hit a wall, stop moving in this direction
                this.dx = 0;
                this.dy = 0;
            }
        }

        // Update position
        this.x = targetX;
        this.y = targetY;

        // --- Handle Wrapping ---
        // If PacBoy goes off left edge
        if (this.x < 0 && this.y === 8) { // Assuming row 8 is the wrap-around tunnel
            this.x = maze[0].length - 1;
        }
        // If PacBoy goes off right edge
        else if (this.x >= maze[0].length && this.y === 8) {
            this.x = 0;
        }

        // --- Eat Dot ---
        if (maze[this.y][this.x] === 2) {
            maze[this.y][this.x] = 3; // Mark as eaten (3 = Empty Path)
            score++;
            scoreElement.textContent = score;
            eatSound.currentTime = 0;
            eatSound.play();
            // Check win condition
            if (score === totalDots) {
                gameWon = true;
                gameOver = true;
                extraLifeSound.currentTime = 0;
                extraLifeSound.play();
            }
        }
    }
}

// --- Ghost Class ---
class Ghost extends Character {
    constructor(x, y, speed, color) {
        super(x, y, speed, color);
        // Initial random direction (optional, can be refined)
        this.dx = 1;
        this.dy = 0;
    }

    draw(ctx) {
        const GHOST_SIZE = TILE_SIZE * 0.8;
        const GHOST_RADIUS = GHOST_SIZE / 2;
        const cx = this.x * TILE_SIZE + TILE_SIZE / 2;
        const cy = this.y * TILE_SIZE + TILE_SIZE / 2;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Main body (arc)
        ctx.arc(cx, cy, GHOST_RADIUS, Math.PI, 0); // Top semi-circle
        // Bottom wavy part
        const baseHeight = cy + GHOST_RADIUS;
        const waveHeight = GHOST_SIZE * 0.15;
        const waveWidth = GHOST_SIZE / 3;
        ctx.lineTo(cx + GHOST_RADIUS, baseHeight);
        ctx.lineTo(cx + waveWidth, baseHeight - waveHeight);
        ctx.lineTo(cx, baseHeight);
        ctx.lineTo(cx - waveWidth, baseHeight - waveHeight);
        ctx.lineTo(cx - GHOST_RADIUS, baseHeight);

        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFF'; // White part of eyes
        const eyeRadius = GHOST_SIZE * 0.15;
        const eyeOffsetX = GHOST_RADIUS * 0.4;
        const eyeOffsetY = GHOST_RADIUS * 0.3;
        // Left Eye
        ctx.beginPath();
        ctx.arc(cx - eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        // Right Eye
        ctx.beginPath();
        ctx.arc(cx + eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (move based on ghost direction)
        ctx.fillStyle = '#000'; // Black pupils
        const pupilRadius = eyeRadius * 0.5;
        let pupilShiftX = 0;
        let pupilShiftY = 0;
        if (this.dx === 1) pupilShiftX = eyeRadius * 0.4;
        else if (this.dx === -1) pupilShiftX = -eyeRadius * 0.4;
        if (this.dy === 1) pupilShiftY = eyeRadius * 0.4;
        else if (this.dy === -1) pupilShiftY = -eyeRadius * 0.4;

        // Left Pupil
        ctx.beginPath();
        ctx.arc(cx - eyeOffsetX + pupilShiftX, cy - eyeOffsetY + pupilShiftY, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
        // Right Pupil
        ctx.beginPath();
        ctx.arc(cx + eyeOffsetX + pupilShiftX, cy - eyeOffsetY + pupilShiftY, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
    }


    update() {
        // Simple AI: At tile center, find valid moves, pick one randomly
        // Avoid reversing direction unless it's the only option (dead end)
        if (this.isAtTileCenter()) {
            const validMoves = this.getValidMoves();
            let possibleTurns = [];

            if (validMoves.length > 0) {
                // Filter out reversing direction unless it's the only option
                possibleTurns = validMoves.filter(move =>
                    !(move.dx === -this.dx && move.dy === -this.dy)
                );

                // If filtering leaves no options (dead end), allow reversal
                if (possibleTurns.length === 0 && validMoves.length > 0) {
                    possibleTurns = validMoves;
                }
            }


            if (possibleTurns.length > 0) {
                // Check if current direction is still a valid choice among the non-reversing turns
                const canContinueStraight = possibleTurns.some(move => move.dx === this.dx && move.dy === this.dy);

                // Bias towards continuing straight if possible and not at a major intersection (more than 2 non-reversing options)
                if (canContinueStraight && possibleTurns.length <= 2) {
                    // Keep current direction if it's valid and not a complex choice point
                    // (This check already happened implicitly by it being in possibleTurns)
                }
                else {
                    // Choose a random new direction from the possible turns
                    const chosenMove = possibleTurns[Math.floor(Math.random() * possibleTurns.length)];
                    this.dx = chosenMove.dx;
                    this.dy = chosenMove.dy;
                }

            } else {
                // Ghost is trapped? Stop it.
                this.dx = 0;
                this.dy = 0;
            }
        }

        // Check if the chosen direction is valid before moving
        const nextX = this.x + this.dx;
        const nextY = this.y + this.dy;

        if (!isWall(nextX, nextY)) {
            this.x = nextX;
            this.y = nextY;
        } else {
            // Hit a wall unexpectedly? Try to force a new direction calculation next tick.
            // This shouldn't happen often with the current logic but acts as a fallback.
            const validMoves = this.getValidMoves();
            if (validMoves.length > 0) {
                const chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                this.dx = chosenMove.dx;
                this.dy = chosenMove.dy;
                // Don't move this tick, just set new direction
            } else {
                this.dx = 0; // Truly stuck
                this.dy = 0;
            }

        }

        // --- Handle Wrapping ---
        // If Ghost goes off left edge
        if (this.x < 0 && this.y === 8) { // Assuming row 8 is the wrap-around tunnel
            this.x = maze[0].length - 1;
        }
        // If Ghost goes off right edge
        else if (this.x >= maze[0].length && this.y === 8) {
            this.x = 0;
        }
    }
}

// --- Drawing Functions ---
function drawMaze() {
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[0].length; x++) {
            ctx.fillStyle = BACKGROUND_COLOR; // Default background
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            if (maze[y][x] === 1) { // Wall
                ctx.fillStyle = WALL_COLOR;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (maze[y][x] === 2) { // Dot
                ctx.fillStyle = DOT_COLOR;
                ctx.beginPath();
                ctx.arc(
                    x * TILE_SIZE + TILE_SIZE / 2,
                    y * TILE_SIZE + TILE_SIZE / 2,
                    TILE_SIZE * 0.15, // Dot size
                    0, Math.PI * 2
                );
                ctx.fill();
                ctx.closePath();
            }
            // No need to explicitly draw 0 (path) or 3 (eaten dot path) as background covers it
        }
    }
}

// --- Game Logic ---
function gameLoop() {
    if (gameOver) {
        clearInterval(gameLoopInterval);
        if (gameWon) {
            showMessage("لقد فزت! جاري إعادة التشغيل...");
            intermissionSound.currentTime = 0;
            intermissionSound.play();
        } else {
            showMessage("انتهت اللعبة! جاري إعادة التشغيل...");
            deathSound.currentTime = 0;
            deathSound.play();
        }
        // Automatically restart after a delay
        setTimeout(initGame, 2500); // 2.5 second delay
        return;
    }

    // 1. Clear Canvas (or redraw maze background)
    // ctx.clearRect(0, 0, canvas.width, canvas.height); // Option 1: Clear all
    // Option 2: Redraw maze background (handles eaten dots correctly)
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Update Characters
    pacBoy.update();
    ghost.update();
    ghostPurple.update();
    ghostGreen.update();

    // 3. Check Collisions
    if (pacBoy.x === ghost.x && pacBoy.y === ghost.y ||
        pacBoy.x === ghostPurple.x && pacBoy.y === ghostPurple.y ||
        pacBoy.x === ghostGreen.x && pacBoy.y === ghostGreen.y) {
        gameOver = true;
        gameWon = false;
        // Don't return yet, let the final frame draw
    }

    // 4. Draw Everything
    drawMaze(); // Draw walls and remaining dots
    pacBoy.draw(ctx);
    ghost.draw(ctx);
    ghostPurple.draw(ctx);
    ghostGreen.draw(ctx);

}

// --- Initialization ---
function initGame() {
    hideMessage();
    gameOver = false;
    gameWon = false;
    score = 0;
    totalDots = 0;
    scoreElement.textContent = score;

    // Start intro music
    introMusic.loop = true;
    introMusic.currentTime = 0;
    introMusic.play();

    // Deep copy the initial maze state for a fresh game
    maze = deepCopyMaze(initialMaze);

    // Find starting positions and count dots
    let pacStartX, pacStartY, ghostStartX, ghostStartY;
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[0].length; x++) {
            if (maze[y][x] === 2) {
                totalDots++;
            } else if (maze[y][x] === 5) {
                pacStartX = x;
                pacStartY = y;
                maze[y][x] = 3; // Change start point to empty path after getting coords
            } else if (maze[y][x] === 4) {
                ghostStartX = x;
                ghostStartY = y;
                maze[y][x] = 0; // Change ghost start to empty path
            }
        }
    }

    if (totalDots === 0) {
        console.error("تحذير: لم يتم العثور على نقاط في المتاهة!");
    }
    if (pacStartX === undefined || ghostStartX === undefined) {
        console.error("خطأ: لم يتم العثور على موقع بداية باك بوي أو الشبح في المتاهة (تحتاج إلى المربعات 5 و 4).");
        return; // إيقاف التهيئة إذا كانت العناصر الأساسية مفقودة
    }


    // Set Canvas Size based on maze
    canvas.width = maze[0].length * TILE_SIZE;
    canvas.height = maze.length * TILE_SIZE;

    // Create characters
    pacBoy = new PacBoy(pacStartX, pacStartY, PAC_SPEED, PAC_COLOR);
    ghost = new Ghost(ghostStartX, ghostStartY, GHOST_SPEED, GHOST_COLOR);

    // Create additional ghosts with different starting positions
    // Position the purple ghost one tile to the right of the original ghost
    ghostPurple = new Ghost(ghostStartX + 1, ghostStartY, GHOST_SPEED, GHOST_COLOR_PURPLE);
    // Position the green ghost one tile to the left of the original ghost
    ghostGreen = new Ghost(ghostStartX - 1, ghostStartY, GHOST_SPEED, GHOST_COLOR_GREEN);

    // Clear any existing interval
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
    }
    // Start game loop
    gameLoopInterval = setInterval(gameLoop, GAME_SPEED_MS);
}

// --- Event Listener for Input ---
window.addEventListener('keydown', (e) => {
    // Prevent arrow keys from scrolling the page
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    if (gameOver) return; // Don't take input if game is over

    switch (e.key) {
        case 'ArrowUp':
            pacBoy.setDirection(0, -1);
            break;
        case 'ArrowDown':
            pacBoy.setDirection(0, 1);
            break;
        case 'ArrowLeft':
            pacBoy.setDirection(-1, 0);
            break;
        case 'ArrowRight':
            pacBoy.setDirection(1, 0);
            break;
    }
});

// --- Start the Game ---
initGame();