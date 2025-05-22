// Get the canvas element and its context
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');

// Get the button elements
const startButton = document.getElementById('startButton');
const solveButton = document.getElementById('solveButton');
const newGameButton = document.getElementById('newGameButton');
const messageContainer = document.getElementById('messageContainer');
const gameWonContainer = document.getElementById('gameWonContainer');
const newGameButtonWin = document.getElementById('newGameButtonWin');
const difficultyButtons = document.querySelectorAll('.difficulty-button');

// Game variables
let mazeSize = 15; // Default size
let cellSize;
let maze = [];
let playerPosition;
let exitPosition;
let gameWon = false;
let solving = false; // To prevent solving multiple times

// Tone.js setup
const synth = new Tone.Synth().toDestination();

// Function to play a sound
function playSound(type) {
    if (solving) return;
    const now = Tone.now();
    switch (type) {
        case 'start':
            synth.triggerAttackRelease("C4", "8n", now);
            break;
        case 'solve':
            // Add a short delay before playing the solve sound
            setTimeout(() => {
                synth.triggerAttackRelease("G4", "4n", now);
            }, 100);
            break;
        case 'win':
            // Use a more complex sound for winning
            const polySynth = new Tone.PolySynth().toDestination();
            polySynth.triggerAttackRelease(["C5", "E5", "G5", "C6"], "2n", now);
            break;
        case 'error':
            synth.triggerAttackRelease("C2", "4n", now);
            break;
    }
}

// Function to display a message
function showMessage(message, type = 'info') {
    messageContainer.textContent = message;
    messageContainer.className = 'show-message';
    // Clear previous timeout
    clearTimeout(messageContainer.timeoutId);

    if (type === 'error') {
        messageContainer.classList.add('shake-message'); // Apply shake class
        playSound('error');
    } else {
        messageContainer.classList.remove('shake-message'); // Remove shake class
    }

    // Set a timeout to hide the message after 3 seconds
    messageContainer.timeoutId = setTimeout(() => {
        messageContainer.className = '';
    }, 3000);
}

// Function to generate the maze
function generateMaze(size) {
    mazeSize = size;
    cellSize = canvas.width / size;
    maze = [];
    for (let i = 0; i < size; i++) {
        maze[i] = [];
        for (let j = 0; j < size; j++) {
            maze[i][j] = 1; // 1 = wall, 0 = path
        }
    }

    // Use recursive backtracking algorithm to generate the maze
    let stack = [];
    let startX = Math.floor(Math.random() * size);
    let startY = Math.floor(Math.random() * size);
    playerPosition = { x: startX, y: startY };
    stack.push({ x: startX, y: startY, pathLength: 0 }); // Store path length
    maze[startX][startY] = 0;

    let maxPathLength = 0; // Track the maximum path length
    let exitX = startX;
    let exitY = startY;

    while (stack.length > 0) {
        let current = stack.pop();
        let x = current.x;
        let y = current.y;
        let pathLength = current.pathLength;

        if (pathLength > maxPathLength) {
            maxPathLength = pathLength;
            exitX = x;
            exitY = y;
        }

        let directions = [{ dx: -2, dy: 0 }, { dx: 2, dy: 0 }, { dx: 0, dy: -2 }, { dx: 0, dy: 2 }];
        shuffleArray(directions);

        for (let i = 0; i < directions.length; i++) {
            let dx = directions[i].dx;
            let dy = directions[i].dy;
            let newX = x + dx;
            let newY = y + dy;

            if (newX > 0 && newX < size - 1 && newY > 0 && newY < size - 1 && maze[newX][newY] === 1) {
                maze[x + dx / 2][y + dy / 2] = 0;
                maze[newX][newY] = 0;
                stack.push({ x: newX, y: newY, pathLength: pathLength + 1 });
            }
        }
    }
    exitPosition = { x: exitX, y: exitY };
    maze[exitX][exitY] = 2; // 2 = exit
}

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Function to draw the maze
function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < mazeSize; i++) {
        for (let j = 0; j < mazeSize; j++) {
            switch (maze[i][j]) {
                case 1: // Wall
                    ctx.fillStyle = '#202040';
                    break;
                case 0: // Path
                    ctx.fillStyle = '#f5f5f5';
                    break;
                case 2: // Exit
                    ctx.fillStyle = '#ffdb58';
                    break;
                case 3: // Solution path
                    ctx.fillStyle = 'rgba(56, 189, 248, 0.7)'; // Semi-transparent blue
                    break;
            }
            ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#303050'; // Darker border color
            ctx.lineWidth = 1; // Reduced line width
            ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
    }
    // Draw player
    const centerX = playerPosition.x * cellSize + cellSize / 2;
    const centerY = playerPosition.y * cellSize + cellSize / 2;
    const radius = cellSize / 2.5;

    // Draw face (circle)
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffdb58"; // Website's yellow color
    ctx.fill();
    ctx.strokeStyle = "#4a148c"; // Website's purple color
    ctx.stroke();
    ctx.closePath();

    // Right Eye
    ctx.beginPath();
    ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#4a148c"; // Website's purple color
    ctx.fill();
    ctx.closePath();

    // Left Eye
    ctx.beginPath();
    ctx.arc(centerX + radius / 3, centerY - radius / 3, radius / 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#4a148c"; // Website's purple color
    ctx.fill();
    ctx.closePath();

    // Smile
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.arc(centerX, centerY, radius / 2, 0, Math.PI);
    ctx.strokeStyle = "#4a148c"; // Website's purple color
    ctx.stroke();
    ctx.closePath();
}

// Function to solve the maze using A* algorithm
function solveMaze() {
    if (solving) return; // Prevent multiple solves
    solving = true;
    playSound('solve');
    let start = { x: playerPosition.x, y: playerPosition.y, g: 0, h: heuristic(playerPosition, exitPosition), parent: null };
    let openSet = [start];
    let closedSet = [];

    while (openSet.length > 0) {
        // Find the node with the lowest f = g + h
        let current = openSet[0];
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].g + openSet[i].h < current.g + current.h) {
                current = openSet[i];
            }
        }

        // Remove current from openSet and add it to closedSet
        openSet = openSet.filter(node => node !== current);
        closedSet.push(current);

        // If current is the exit, we've found the path
        if (current.x === exitPosition.x && current.y === exitPosition.y) {
            let path = [];
            let node = current;
            while (node) {
                path.push({ x: node.x, y: node.y });
                node = node.parent;
            }
            path.reverse(); // Reverse the path to get it from start to finish

            // Mark the path on the maze
            for (let i = 0; i < path.length; i++) {
                if (maze[path[i].x][path[i].y] !== 2) { // Don't overwrite the exit
                    maze[path[i].x][path[i].y] = 3; // 3 = solution path
                }
            }
            drawMaze();
            solving = false;
            return;
        }

        // Get the neighbors of the current node
        let neighbors = [
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 },
        ];

        for (let neighbor of neighbors) {
            // Check if the neighbor is valid (within the maze bounds) and is not a wall
            if (neighbor.x >= 0 && neighbor.x < mazeSize && neighbor.y >= 0 && neighbor.y < mazeSize && maze[neighbor.x][neighbor.y] !== 1) {
                // Check if the neighbor is in the closed set
                let inClosedSet = false;
                for (let node of closedSet) {
                    if (node.x === neighbor.x && node.y === neighbor.y) {
                        inClosedSet = true;
                        break;
                    }
                }
                if (inClosedSet) {
                    continue;
                }

                // Calculate the g and h values for the neighbor
                let g = current.g + 1;
                let h = heuristic(neighbor, exitPosition);

                // Check if the neighbor is in the open set
                let inOpenSet = false;
                let neighborIndex = -1;
                for (let i = 0; i < openSet.length; i++) {
                    if (openSet[i].x === neighbor.x && openSet[i].y === neighbor.y) {
                        inOpenSet = true;
                        neighborIndex = i;
                        break;
                    }
                }

                if (!inOpenSet) {
                    // Add the neighbor to the open set
                    neighbor.g = g;
                    neighbor.h = h;
                    neighbor.parent = current;
                    openSet.push(neighbor);
                } else {
                    // If the neighbor is in the open set, check if the new g value is better
                    if (g < openSet[neighborIndex].g) {
                        openSet[neighborIndex].g = g;
                        openSet[neighborIndex].parent = current;
                    }
                }
            }
        }
    }
    // If we get here, there is no solution
    showMessage('No solution found!', 'error');
    solving = false;
}

// Function to calculate the heuristic (Manhattan distance)
function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Function to handle player movement
function movePlayer(dx, dy) {
    if (gameWon || solving) return;

    let newX = playerPosition.x + dx;
    let newY = playerPosition.y + dy;

    if (newX >= 0 && newX < mazeSize && newY >= 0 && newY < mazeSize && maze[newX][newY] !== 1) {
        playerPosition.x = newX;
        playerPosition.y = newY;
        drawMaze();

        if (newX === exitPosition.x && newY === exitPosition.y) {
            gameWon = true;
            playSound('win');
            gameWonContainer.classList.add('show-win-message');
            newGameButton.style.display = 'inline-flex';
        }
    } else {
        showMessage('Invalid move!', 'error');
    }
}

// Event listeners for button clicks
startButton.addEventListener('click', () => {
    if (!gameWon && !solving) {
        generateMaze(mazeSize);
        drawMaze();
        playSound('start');
        newGameButton.style.display = 'none';
        gameWonContainer.classList.remove('show-win-message');
        gameWon = false;
    }
});

solveButton.addEventListener('click', () => {
    if (!gameWon && !solving) {
        solveMaze();
    }
});

newGameButton.addEventListener('click', () => {
    generateMaze(mazeSize);
    drawMaze();
    playSound('start');
    newGameButton.style.display = 'none';
    gameWonContainer.classList.remove('show-win-message');
    gameWon = false;
    solving = false;
});

newGameButtonWin.addEventListener('click', () => {
    generateMaze(mazeSize);
    drawMaze();
    playSound('start');
    newGameButton.style.display = 'none';
    gameWonContainer.classList.remove('show-win-message');
    gameWon = false;
    solving = false;
});

difficultyButtons.forEach(button => {
    button.addEventListener('click', function () {
        const size = parseInt(this.dataset.size);
        mazeSize = size;

        difficultyButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        // Adjust canvas size based on maze size
        const maxSize = Math.min(500, window.innerWidth - 40);
        canvas.width = maxSize;
        canvas.height = maxSize;
        cellSize = canvas.width / mazeSize;

        generateMaze(mazeSize);
        drawMaze();
        newGameButton.style.display = 'none';
        gameWonContainer.classList.remove('show-win-message');
        gameWon = false;
        solving = false;
    });
});

// Initialize default difficulty button
difficultyButtons[1].click();

// Touch event listeners for on-screen controls
canvas.addEventListener('touchstart', (e) => {
    if (gameWon || solving) return;
    e.preventDefault(); // Prevents additional mouse events
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const touchY = e.touches[0].clientY - rect.top;

    const cellX = Math.floor(touchX / cellSize);
    const cellY = Math.floor(touchY / cellSize);

    // Try to move player, within a 3x3 grid
    if (Math.abs(cellX - playerPosition.x) <= 1 && Math.abs(cellY - playerPosition.y) <= 1) {
        movePlayer(cellX - playerPosition.x, cellY - playerPosition.y);
    }
}, { passive: false }); // Important for preventDefault to work

// Keyboard event listener for arrow key navigation
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
            movePlayer(1, 0);
            break;
    }
});

// Resize the canvas when the window is resized
window.addEventListener('resize', () => {
    const maxSize = Math.min(500, window.innerWidth - 40);
    canvas.width = maxSize;
    canvas.height = maxSize;
    cellSize = canvas.width / mazeSize;
    drawMaze();
});

// Initial draw
const maxSize = Math.min(500, window.innerWidth - 40);
canvas.width = maxSize;
canvas.height = maxSize;
cellSize = canvas.width / mazeSize;
generateMaze(mazeSize);
drawMaze(); 