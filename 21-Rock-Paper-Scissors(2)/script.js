const choices = document.querySelectorAll('.choice');
const playerScoreElem = document.querySelector('.player-score');
const computerScoreElem = document.querySelector('.computer-score');
const resultElem = document.querySelector('#result');
const playAgainBtn = document.querySelector('#play-again');
const countdownElem = document.querySelector('#countdown');
const computerChoiceElem = document.querySelector('#computer-choice');

const weapons = ['rock', 'paper', 'scissors'];
let playerScore = 0;
let computerScore = 0;
let countdown = 10;
let timeout;

// Function to generate random weapon for computer
function computerPlay() {
  const weaponIndex = Math.floor(Math.random() * weapons.length);
  return weapons[weaponIndex];
}

// Function to update score and display result
function updateScore(playerWeapon, computerWeapon) {
  clearTimeout(timeout);
  if (playerWeapon) {
    computerChoiceElem.innerHTML = `اختيار الحاسوب: ${arabicWeaponName(computerWeapon)}`;
    if (playerWeapon === computerWeapon) {
      resultElem.innerHTML = "تعادل!";
    } else if (
      (playerWeapon === 'rock' && computerWeapon === 'scissors') ||
      (playerWeapon === 'paper' && computerWeapon === 'rock') ||
      (playerWeapon === 'scissors' && computerWeapon === 'paper')
    ) {
      resultElem.innerHTML = 'أنت الفائز!';
      playerScore++;
      playerScoreElem.innerHTML = `اللاعب: ${playerScore}`;
    } else {
      resultElem.innerHTML = 'الحاسوب هو الفائز!';
      computerScore++;
      computerScoreElem.innerHTML = `الحاسوب: ${computerScore}`;
    }
    startTimer();
  } else {
    computerChoiceElem.innerHTML = `انتهت اللعبة`;
    resultElem.innerHTML = 'لم تختر شيئاً! | خسرت اللعبة!';
    resultElem.style.color = 'red';
    disableOptions();
  }

  if (playerScore === 5) {
    resultElem.textContent = 'لقد فزت باللعبة!';
    resultElem.style.color = 'green';
    computerChoiceElem.innerHTML = 'انتهت اللعبة';
    disableOptions();
    stopTimer();
  }

  if (computerScore === 5) {
    resultElem.textContent = 'لقد خسرت اللعبة!';
    resultElem.style.color = 'red';
    computerChoiceElem.innerHTML = 'انتهت اللعبة';
    disableOptions();
    stopTimer();
  }
}

// Add this new helper function
function arabicWeaponName(weapon) {
  const weaponNames = {
    'rock': 'حجر',
    'paper': 'ورقة',
    'scissors': 'مقص'
  };
  return weaponNames[weapon];
}

// Function to handle player choice
function selectWeapon() {
  clearTimeout(timeout);
  countdownElem.innerHTML = '10';
  countdown = 10;
  const playerWeapon = this.id;
  const computerWeapon = computerPlay();
  updateScore(playerWeapon, computerWeapon);
}

// Function to start countdown timer
function startTimer() {
  countdown--;
  countdownElem.innerHTML = countdown;
  if (countdown === 0) {
    const computerWeapon = computerPlay();
    updateScore(null, computerWeapon);
  } else {
    timeout = setTimeout(startTimer, 1000);
  }
}

function stopTimer() {
  clearInterval(timeout);
  countdown = 10;
  countdownElem.textContent = countdown;
}

// Function to reset the game
function resetGame() {
  playerScore = 0;
  computerScore = 0;
  countdown = 10;
  playerScoreElem.innerHTML = 'اللاعب: 0';
  computerScoreElem.innerHTML = 'الحاسوب: 0';
  resultElem.innerHTML = 'اختر سلاحك!';
  countdownElem.innerHTML = '10';
  resultElem.style.color = '#660033';
  computerChoiceElem.innerHTML = '';
  enableOptions();
  startTimer();
}

function disableOptions() {
  choices.forEach((choice) => {
    choice.style.pointerEvents = 'none';
  });
}

function enableOptions() {
  choices.forEach((choice) => {
    choice.style.pointerEvents = 'auto';
  });
}

// Event listeners
choices.forEach((choice) => choice.addEventListener('click', selectWeapon));
playAgainBtn.addEventListener('click', resetGame);

// Start countdown timer when page loads
countdownElem.innerHTML = countdown; // Set initial value of countdown in HTML
timeout = setTimeout(startTimer, 1000);