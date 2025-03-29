document.addEventListener("DOMContentLoaded", () => {
    const cells = document.querySelectorAll(".cell");
    const statusText = document.querySelector("#status");
    const restartBtn = document.querySelector("#restart");
    const modeRadios = document.getElementsByName("mode-radio");
    const symbolRadios = document.getElementsByName("symbol-radio");

    let board = ["", "", "", "", "", "", "", "", ""];
    let currentPlayer = "X";
    let gameActive = true;
    let isVsComputer = false;
    let playerSymbol = "X";
    let computerSymbol = "O";

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    // Event listeners for mode and symbol selection
    modeRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            isVsComputer = radio.value === "computer";
            restartGame();
        });
    });

    symbolRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            playerSymbol = radio.value;
            computerSymbol = playerSymbol === "X" ? "O" : "X";
            restartGame();
        });
    });

    cells.forEach(cell => {
        cell.addEventListener("click", () => handleCellClick(cell));
    });

    restartBtn.addEventListener("click", restartGame);

    function handleCellClick(cell) {
        const index = cell.dataset.index;
        if (board[index] !== "" || !gameActive) return;

        board[index] = currentPlayer;
        cell.textContent = currentPlayer;

        if (checkWinner()) return;

        currentPlayer = currentPlayer === "X" ? "O" : "X";

        if (isVsComputer && currentPlayer === computerSymbol) {
            setTimeout(computerMove, 500);
        }
    }

    function computerMove() {
        let availableCells = board.map((cell, index) => cell === "" ? index : null).filter(index => index !== null);
        if (availableCells.length === 0) return;

        let randomIndex = availableCells[Math.floor(Math.random() * availableCells.length)];
        board[randomIndex] = computerSymbol;
        cells[randomIndex].textContent = computerSymbol;

        if (checkWinner()) return;

        currentPlayer = playerSymbol;
    }

    function checkWinner() {
        for (let condition of winningConditions) {
            let [a, b, c] = condition;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                statusText.textContent = `${board[a]} فاز!`;
                gameActive = false;
                return true;
            }
        }

        if (!board.includes("")) {
            statusText.textContent = "تعادل!";
            gameActive = false;
            return true;
        }
        return false;
    }

    function restartGame() {
        board = ["", "", "", "", "", "", "", "", ""];
        gameActive = true;
        currentPlayer = playerSymbol;
        statusText.textContent = "";
        cells.forEach(cell => cell.textContent = "");
    }
});

restartBtn.querySelector("p").setAttribute("data-start", "حظاً سعيداً!");
restartBtn.querySelector("p").setAttribute("data-text", "ابدأ!");
restartBtn.querySelector("p").setAttribute("data-title", "لعبة جديدة");


