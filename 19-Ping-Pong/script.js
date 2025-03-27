// تهيئة الكانفاس
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var startBtn = document.getElementById("start-btn");
var pauseBtn = document.getElementById("pause-btn");
var restartBtn = document.getElementById("restart-btn");
var animationId;
var gameRunning = false;

startBtn.addEventListener("click", function () {
  if (!gameRunning) { // ابدأ اللعبة فقط إذا كانت gameRunning تساوي false
    gameRunning = true; // اجعل gameRunning تساوي true عند بدء اللعبة
    loop();
  }
});

pauseBtn.addEventListener("click", function () {
  gameRunning = false;
  cancelAnimationFrame(animationId);
});

restartBtn.addEventListener("click", function () {
  document.location.reload();
});

addEventListener("load", (event) => {
  draw();
});

// تعريف خصائص الكرة
var ballRadius = 10;
var ballX = canvas.width / 2;
var ballY = canvas.height / 2;
var ballSpeedX = 5;
var ballSpeedY = 5;

// تعريف خصائص المضرب
var paddleHeight = 80;
var paddleWidth = 10;
var leftPaddleY = canvas.height / 2 - paddleHeight / 2;
var rightPaddleY = canvas.height / 2 - paddleHeight / 2;
var paddleSpeed = 10;

// تعريف خصائص النتيجة
var leftPlayerScore = 0;
var rightPlayerScore = 0;
var maxScore = 10;

// الاستماع إلى أحداث لوحة المفاتيح
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

// معالجة ضغط المفاتيح
var upPressed = false;
var downPressed = false;
let wPressed = false;
let sPressed = false;

function keyDownHandler(e) {
  if (e.key === "ArrowUp") {
    upPressed = true;
  } else if (e.key === "ArrowDown") {
    downPressed = true;
  } else if (e.key === "w") {
    wPressed = true;
  } else if (e.key === "s") {
    sPressed = true;
  }
}

// معالجة رفع المفاتيح
function keyUpHandler(e) {
  if (e.key === "ArrowUp") {
    upPressed = false;
  } else if (e.key === "ArrowDown") {
    downPressed = false;
  } else if (e.key === "w") {
    wPressed = false;
  } else if (e.key === "s") {
    sPressed = false;
  }
}

// تحديث حالة اللعبة
function update() {
  // تحريك المضارب
  if (upPressed && rightPaddleY > 0) {
    rightPaddleY -= paddleSpeed;
  } else if (downPressed && rightPaddleY + paddleHeight < canvas.height) {
    rightPaddleY += paddleSpeed;
  }

  // تحريك المضرب الأيسر باستخدام مفتاحي "w" و "s"
  if (wPressed && leftPaddleY > 0) {
    leftPaddleY -= paddleSpeed;
  } else if (sPressed && leftPaddleY + paddleHeight < canvas.height) {
    leftPaddleY += paddleSpeed;
  }

  // تحريك الكرة
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // التحقق من اصطدام الكرة بأعلى أو أسفل الكانفاس
  if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
    ballSpeedY = -ballSpeedY;
  }

  // التحقق من اصطدام الكرة بالمضرب الأيسر
  if (
    ballX - ballRadius < paddleWidth &&
    ballY > leftPaddleY &&
    ballY < leftPaddleY + paddleHeight
  ) {
    ballSpeedX = -ballSpeedX;
  }

  // التحقق من اصطدام الكرة بالمضرب الأيمن
  if (
    ballX + ballRadius > canvas.width - paddleWidth &&
    ballY > rightPaddleY &&
    ballY < rightPaddleY + paddleHeight
  ) {
    ballSpeedX = -ballSpeedX;
  }

  // التحقق مما إذا خرجت الكرة خارج الحدود على الجانب الأيسر أو الأيمن
  if (ballX < 0) {
    rightPlayerScore++;
    reset();
  } else if (ballX > canvas.width) {
    leftPlayerScore++;
    reset();
  }

  // التحقق مما إذا فاز أحد اللاعبين
  if (leftPlayerScore === maxScore) {
    playerWin("اللاعب الأيسر");
  } else if (rightPlayerScore === maxScore) {
    playerWin("اللاعب الأيمن");
  }
}

function playerWin(player) {
  var message = "مبروك! " + player + " فاز!";
  $('#message').text(message); // تعيين نص الرسالة
  $('#message-modal').modal('show'); // عرض نافذة الرسالة المنبثقة
  reset();
}

// إعادة الكرة إلى مركز الشاشة
function reset() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  ballSpeedX = -ballSpeedX;
  ballSpeedY = Math.random() * 10 - 5;
}

// رسم الكائنات على الكانفاس
function draw() {
  // مسح الكانفاس
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#FFF";
  ctx.font = "15px Tajawal"; // استخدام خط Tajawal إذا كان متاحًا

  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.strokeStyle = "#FFF"; // تعيين لون الخط إلى الأبيض
  ctx.stroke();
  ctx.closePath();

  // رسم الكرة
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();

  // رسم المضرب الأيسر
  ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);

  // رسم المضرب الأيمن
  ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);

  // رسم النتائج
  ctx.fillText("النتيجة: " + leftPlayerScore, 180, 20);
  ctx.fillText("النتيجة: " + rightPlayerScore, canvas.width - 120, 20);
}

// حلقة اللعبة
function loop() {
  update();
  draw();
  animationId = requestAnimationFrame(loop);
}

$('#message-modal-close').on('click', function () {
  document.location.reload();
});