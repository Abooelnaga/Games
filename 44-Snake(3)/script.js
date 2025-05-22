// Get the canvas element and its 2D rendering context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Get the score display element
const scoreDisplay = document.getElementById("scoreDisplay");
let score = 0;

// Get the start button
const startButton = document.getElementById("startButton");

// Game variables
const gridSize = 20;
let snake = [{ x: 10, y: 10 }]; // Initial snake position
let food = {}; // Food position
let direction = "right"; // Initial direction
let gameOver = false;
let gameInterval;
let gameSpeed = 100; // Adjust for desired speed

// Function to generate a random food position
function generateFood() {45-Snake(3)
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize)),
    };
}

// Function to draw the snake
function drawSnake() {
    snake.forEach((segment) => {
        ctx.fillStyle = "#4CAF50"; // Green snake
        ctx.fillRect(
            segment.x * gridSize,
            segment.y * gridSize,
            gridSize,
            gridSize
        );
        ctx.strokeStyle = "#2e7d32"; // Darker green border
        ctx.strokeRect(
            segment.x * gridSize,
            segment.y * gridSize,
            gridSize,
            gridSize
        );
    });
}

// Function to draw the food
function drawFood() {
    ctx.fillStyle = "#FF5252"; // Red food
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    ctx.strokeStyle = "#B80000";  // Darker red border
    ctx.strokeRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

// Function to update the game state
function updateGame() {
    if (gameOver) return;

    const head = { x: snake[0].x, y: snake[0].y };

    // Move the snake's head
    switch (direction) {
        case "up":
            head.y--;
            break;
        case "down":
            head.y++;
            break;
        case "left":
            head.x--;
            break;
        case "right":
            head.x++;
            break;
    }

    // Check for collision with walls
    if (
        head.x < 0 ||
        head.x >= canvas.width / gridSize ||
        head.y < 0 ||
        head.y >= canvas.height / gridSize
    ) {
        gameOver = true;
        clearInterval(gameInterval);
        alert("Game Over! Score: " + score);
        startButton.textContent = "Start New Game";
        return;
    }

    // Check for collision with itself
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver = true;
            clearInterval(gameInterval);
            alert("Game Over! Score: " + score);
            startButton.textContent = "Start New Game";
            return;
        }
    }

    snake.unshift(head); // Add the new head to the snake

    // Check if the snake ate the food
    if (head.x === food.x && head.y === food.y) {
        score++;
        generateFood();
        scoreDisplay.textContent = `Score: ${score}`;
    } else {
        snake.pop(); // Remove the tail if no food was eaten
    }

    // Clear the canvas and draw the updated game state
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFood();
    drawSnake();
}

// Function to handle keyboard input
function handleKeyDown(event) {
    switch (event.key) {
        case "ArrowUp":
            if (direction !== "down") direction = "up";
            break;
        case "ArrowDown":
            if (direction !== "up") direction = "down";
            break;
        case "ArrowLeft":
            if (direction !== "right") direction = "left";
            break;
        case "ArrowRight":
            if (direction !== "left") direction = "right";
            break;
    }
}

// Function to start the game
function startGame() {
    if (gameInterval) clearInterval(gameInterval);
    snake = [{ x: 10, y: 10 }];
    direction = "right";
    score = 0;
    gameOver = false;
    scoreDisplay.textContent = `Score: ${score}`;
    generateFood();
    gameInterval = setInterval(updateGame, gameSpeed);
    startButton.textContent = "Restart Game";
    document.addEventListener("keydown", handleKeyDown);
}

// Event listener for the start button
startButton.addEventListener("click", startGame);

// Initial call to generate food
generateFood();
drawFood();
drawSnake();