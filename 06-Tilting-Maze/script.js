Math.minmax = (value, limit) => {
  return Math.max(Math.min(value, limit), -limit);
};

const distance2D = (p1, p2) => {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
};

// Angle between the two points
const getAngle = (p1, p2) => {
  let angle = Math.atan((p2.y - p1.y) / (p2.x - p1.x));
  if (p2.x - p1.x < 0) angle += Math.PI;
  return angle;
};

// The closest a ball and a wall cap can be
const closestItCanBe = (cap, ball) => {
  let angle = getAngle(cap, ball);

  const deltaX = Math.cos(angle) * (wallW / 2 + ballSize / 2);
  const deltaY = Math.sin(angle) * (wallW / 2 + ballSize / 2);

  return { x: cap.x + deltaX, y: cap.y + deltaY };
};

// Roll the ball around the wall cap
const rollAroundCap = (cap, ball) => {
  let impactAngle = getAngle(ball, cap);
  let heading = getAngle(
    { x: 0, y: 0 },
    { x: ball.velocityX, y: ball.velocityY }
  );
  let impactHeadingAngle = impactAngle - heading;
  const velocityMagnitude = distance2D(
    { x: 0, y: 0 },
    { x: ball.velocityX, y: ball.velocityY }
  );
  const velocityMagnitudeDiagonalToTheImpact =
    Math.sin(impactHeadingAngle) * velocityMagnitude;
  const closestDistance = wallW / 2 + ballSize / 2;
  const rotationAngle = Math.atan(
    velocityMagnitudeDiagonalToTheImpact / closestDistance
  );
  const deltaFromCap = {
    x: Math.cos(impactAngle + Math.PI - rotationAngle) * closestDistance,
    y: Math.sin(impactAngle + Math.PI - rotationAngle) * closestDistance,
  };
  const x = ball.x;
  const y = ball.y;
  const velocityX = ball.x - (cap.x + deltaFromCap.x);
  const velocityY = ball.y - (cap.y + deltaFromCap.y);
  const nextX = x + velocityX;
  const nextY = y + velocityY;

  return { x, y, velocityX, velocityY, nextX, nextY };
};

// Decreases the absolute value of a number but keeps its sign
const slow = (number, difference) => {
  if (Math.abs(number) <= difference) return 0;
  if (number > difference) return number - difference;
  return number + difference;
};

const mazeElement = document.getElementById("maze");
const joystickHeadElement = document.getElementById("joystick-head");
const noteElement = document.getElementById("note");

let hardMode = false;
let previousTimestamp;
let gameInProgress;
let mouseStartX;
let mouseStartY;
let accelerationX;
let accelerationY;
let frictionX;
let frictionY;

const pathW = 25;
const wallW = 10;
const ballSize = 10;
const holeSize = 18;

const debugMode = false;

let balls = [];
let ballElements = [];
let holeElements = [];

resetGame();

balls.forEach(({ x, y }) => {
  const ball = document.createElement("div");
  ball.setAttribute("class", "ball");
  ball.style.cssText = `left: ${x}px; top: ${y}px; `;
  mazeElement.appendChild(ball);
  ballElements.push(ball);
});

const walls = [
  { column: 0, row: 0, horizontal: true, length: 10 },
  { column: 0, row: 0, horizontal: false, length: 9 },
  { column: 0, row: 9, horizontal: true, length: 10 },
  { column: 10, row: 0, horizontal: false, length: 9 },
  { column: 0, row: 6, horizontal: true, length: 1 },
  { column: 0, row: 8, horizontal: true, length: 1 },
  { column: 1, row: 1, horizontal: true, length: 2 },
  { column: 1, row: 7, horizontal: true, length: 1 },
  { column: 2, row: 2, horizontal: true, length: 2 },
  { column: 2, row: 4, horizontal: true, length: 1 },
  { column: 2, row: 5, horizontal: true, length: 1 },
  { column: 2, row: 6, horizontal: true, length: 1 },
  { column: 3, row: 3, horizontal: true, length: 1 },
  { column: 3, row: 8, horizontal: true, length: 3 },
  { column: 4, row: 6, horizontal: true, length: 1 },
  { column: 5, row: 2, horizontal: true, length: 2 },
  { column: 5, row: 7, horizontal: true, length: 1 },
  { column: 6, row: 1, horizontal: true, length: 1 },
  { column: 6, row: 6, horizontal: true, length: 2 },
  { column: 7, row: 3, horizontal: true, length: 2 },
  { column: 7, row: 7, horizontal: true, length: 2 },
  { column: 8, row: 1, horizontal: true, length: 1 },
  { column: 8, row: 2, horizontal: true, length: 1 },
  { column: 8, row: 3, horizontal: true, length: 1 },
  { column: 8, row: 4, horizontal: true, length: 2 },
  { column: 8, row: 8, horizontal: true, length: 2 },
  { column: 1, row: 1, horizontal: false, length: 2 },
  { column: 1, row: 4, horizontal: false, length: 2 },
  { column: 2, row: 2, horizontal: false, length: 2 },
  { column: 2, row: 5, horizontal: false, length: 1 },
  { column: 2, row: 7, horizontal: false, length: 2 },
  { column: 3, row: 0, horizontal: false, length: 1 },
  { column: 3, row: 4, horizontal: false, length: 1 },
  { column: 3, row: 6, horizontal: false, length: 2 },
  { column: 4, row: 1, horizontal: false, length: 2 },
  { column: 4, row: 6, horizontal: false, length: 1 },
  { column: 5, row: 0, horizontal: false, length: 2 },
  { column: 5, row: 6, horizontal: false, length: 1 },
  { column: 5, row: 8, horizontal: false, length: 1 },
  { column: 6, row: 4, horizontal: false, length: 1 },
  { column: 6, row: 6, horizontal: false, length: 1 },
  { column: 7, row: 1, horizontal: false, length: 4 },
  { column: 7, row: 7, horizontal: false, length: 2 },
  { column: 8, row: 2, horizontal: false, length: 1 },
  { column: 8, row: 4, horizontal: false, length: 2 },
  { column: 9, row: 1, horizontal: false, length: 1 },
  { column: 9, row: 5, horizontal: false, length: 2 },
].map((wall) => ({
  x: wall.column * (pathW + wallW),
  y: wall.row * (pathW + wallW),
  horizontal: wall.horizontal,
  length: wall.length * (pathW + wallW),
}));

walls.forEach(({ x, y, horizontal, length }) => {
  const wall = document.createElement("div");
  wall.setAttribute("class", "wall");
  wall.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        width: ${wallW}px;
        height: ${length}px;
        transform: rotate(${horizontal ? -90 : 0}deg);
      `;
  mazeElement.appendChild(wall);
});

const holes = [
  { column: 0, row: 5 },
  { column: 2, row: 0 },
  { column: 2, row: 4 },
  { column: 4, row: 6 },
  { column: 6, row: 2 },
  { column: 6, row: 8 },
  { column: 8, row: 1 },
  { column: 8, row: 2 },
].map((hole) => ({
  x: hole.column * (wallW + pathW) + (wallW / 2 + pathW / 2),
  y: hole.row * (wallW + pathW) + (wallW / 2 + pathW / 2),
}));

joystickHeadElement.addEventListener("mousedown", function (event) {
  if (!gameInProgress) {
    mouseStartX = event.clientX;
    mouseStartY = event.clientY;
    gameInProgress = true;
    window.requestAnimationFrame(main);
    noteElement.style.opacity = 0;
    joystickHeadElement.style.cssText = `
          animation: none;
          cursor: grabbing;
        `;
  }
});

window.addEventListener("mousemove", function (event) {
  if (gameInProgress) {
    const mouseDeltaX = -Math.minmax(mouseStartX - event.clientX, 15);
    const mouseDeltaY = -Math.minmax(mouseStartY - event.clientY, 15);

    joystickHeadElement.style.cssText = `
          left: ${mouseDeltaX}px;
          top: ${mouseDeltaY}px;
          animation: none;
          cursor: grabbing;
        `;

    const rotationY = mouseDeltaX * 0.8;
    const rotationX = mouseDeltaY * 0.8;

    mazeElement.style.cssText = `
          transform: rotateY(${rotationY}deg) rotateX(${-rotationX}deg)
        `;

    const gravity = 2;
    const friction = 0.01;

    accelerationX = gravity * Math.sin((rotationY / 180) * Math.PI);
    accelerationY = gravity * Math.sin((rotationX / 180) * Math.PI);
    frictionX = gravity * Math.cos((rotationY / 180) * Math.PI) * friction;
    frictionY = gravity * Math.cos((rotationX / 180) * Math.PI) * friction;
  }
});

window.addEventListener("keydown", function (event) {
  if (![" ", "H", "h", "E", "e"].includes(event.key)) return;
  event.preventDefault();

  if (event.key == " ") {
    resetGame();
    return;
  }

  if (event.key == "H" || event.key == "h") {
    hardMode = true;
    resetGame();
    return;
  }

  if (event.key == "E" || event.key == "e") {
    hardMode = false;
    resetGame();
    return;
  }
});

function resetGame() {
  previousTimestamp = undefined;
  gameInProgress = false;
  mouseStartX = undefined;
  mouseStartY = undefined;
  accelerationX = undefined;
  accelerationY = undefined;
  frictionX = undefined;
  frictionY = undefined;

  mazeElement.style.cssText = `
        transform: rotateY(0deg) rotateX(0deg)
      `;

  joystickHeadElement.style.cssText = `
        left: 0;
        top: 0;
        animation: glow;
        cursor: grab;
      `;

  if (hardMode) {
    noteElement.innerHTML = `انقر على عصا التحكم للبدء!
          <p>الوضع الصعب، تجنب الثقوب السوداء. العودة للوضع السهل؟ اضغط E</p>`;
  } else {
    noteElement.innerHTML = `انقر على عصا التحكم للبدء!
          <p>حرك كل الكرات إلى المركز. جاهز للوضع الصعب؟ اضغط H</p>`;
  }
  noteElement.style.opacity = 1;

  balls = [
    { column: 0, row: 0 },
    { column: 9, row: 0 },
    { column: 0, row: 8 },
    { column: 9, row: 8 },
  ].map((ball) => ({
    x: ball.column * (wallW + pathW) + (wallW / 2 + pathW / 2),
    y: ball.row * (wallW + pathW) + (wallW / 2 + pathW / 2),
    velocityX: 0,
    velocityY: 0,
  }));

  if (ballElements.length) {
    balls.forEach(({ x, y }, index) => {
      ballElements[index].style.cssText = `left: ${x}px; top: ${y}px; `;
    });
  }

  holeElements.forEach((holeElement) => {
    mazeElement.removeChild(holeElement);
  });
  holeElements = [];

  if (hardMode) {
    holes.forEach(({ x, y }) => {
      const ball = document.createElement("div");
      ball.setAttribute("class", "black-hole");
      ball.style.cssText = `left: ${x}px; top: ${y}px; `;
      mazeElement.appendChild(ball);
      holeElements.push(ball);
    });
  }
}

function main(timestamp) {
  if (!gameInProgress) return;

  if (previousTimestamp === undefined) {
    previousTimestamp = timestamp;
    window.requestAnimationFrame(main);
    return;
  }

  const maxVelocity = 1.5;
  const timeElapsed = (timestamp - previousTimestamp) / 16;

  try {
    if (accelerationX != undefined && accelerationY != undefined) {
      const velocityChangeX = accelerationX * timeElapsed;
      const velocityChangeY = accelerationY * timeElapsed;
      const frictionDeltaX = frictionX * timeElapsed;
      const frictionDeltaY = frictionY * timeElapsed;

      balls.forEach((ball) => {
        if (velocityChangeX == 0) {
          ball.velocityX = slow(ball.velocityX, frictionDeltaX);
        } else {
          ball.velocityX = ball.velocityX + velocityChangeX;
          ball.velocityX = Math.max(Math.min(ball.velocityX, 1.5), -1.5);
          ball.velocityX =
            ball.velocityX - Math.sign(velocityChangeX) * frictionDeltaX;
          ball.velocityX = Math.minmax(ball.velocityX, maxVelocity);
        }

        if (velocityChangeY == 0) {
          ball.velocityY = slow(ball.velocityY, frictionDeltaY);
        } else {
          ball.velocityY = ball.velocityY + velocityChangeY;
          ball.velocityY =
            ball.velocityY - Math.sign(velocityChangeY) * frictionDeltaY;
          ball.velocityY = Math.minmax(ball.velocityY, maxVelocity);
        }

        ball.nextX = ball.x + ball.velocityX;
        ball.nextY = ball.y + ball.velocityY;

        walls.forEach((wall, wi) => {
          if (wall.horizontal) {
            if (
              ball.nextY + ballSize / 2 >= wall.y - wallW / 2 &&
              ball.nextY - ballSize / 2 <= wall.y + wallW / 2
            ) {
              const wallStart = { x: wall.x, y: wall.y };
              const wallEnd = { x: wall.x + wall.length, y: wall.y };

              if (
                ball.nextX + ballSize / 2 >= wallStart.x - wallW / 2 &&
                ball.nextX < wallStart.x
              ) {
                const distance = distance2D(wallStart, {
                  x: ball.nextX,
                  y: ball.nextY,
                });
                if (distance < ballSize / 2 + wallW / 2) {
                  const closest = closestItCanBe(wallStart, {
                    x: ball.nextX,
                    y: ball.nextY,
                  });
                  const rolled = rollAroundCap(wallStart, {
                    x: closest.x,
                    y: closest.y,
                    velocityX: ball.velocityX,
                    velocityY: ball.velocityY,
                  });
                  Object.assign(ball, rolled);
                }
              }

              if (
                ball.nextX - ballSize / 2 <= wallEnd.x + wallW / 2 &&
                ball.nextX > wallEnd.x
              ) {
                const distance = distance2D(wallEnd, {
                  x: ball.nextX,
                  y: ball.nextY,
                });
                if (distance < ballSize / 2 + wallW / 2) {
                  const closest = closestItCanBe(wallEnd, {
                    x: ball.nextX,
                    y: ball.nextY,
                  });
                  const rolled = rollAroundCap(wallEnd, {
                    x: closest.x,
                    y: closest.y,
                    velocityX: ball.velocityX,
                    velocityY: ball.velocityY,
                  });
                  Object.assign(ball, rolled);
                }
              }

              if (ball.nextX >= wallStart.x && ball.nextX <= wallEnd.x) {
                if (ball.nextY < wall.y) {
                  ball.nextY = wall.y - wallW / 2 - ballSize / 2;
                } else {
                  ball.nextY = wall.y + wallW / 2 + ballSize / 2;
                }
                ball.y = ball.nextY;
                ball.velocityY = -ball.velocityY / 3;
              }
            }
          } else {
            if (
              ball.nextX + ballSize / 2 >= wall.x - wallW / 2 &&
              ball.nextX - ballSize / 2 <= wall.x + wallW / 2
            ) {
              const wallStart = { x: wall.x, y: wall.y };
              const wallEnd = { x: wall.x, y: wall.y + wall.length };

              if (
                ball.nextY + ballSize / 2 >= wallStart.y - wallW / 2 &&
                ball.nextY < wallStart.y
              ) {
                const distance = distance2D(wallStart, {
                  x: ball.nextX,
                  y: ball.nextY,
                });
                if (distance < ballSize / 2 + wallW / 2) {
                  const closest = closestItCanBe(wallStart, {
                    x: ball.nextX,
                    y: ball.nextY,
                  });
                  const rolled = rollAroundCap(wallStart, {
                    x: closest.x,
                    y: closest.y,
                    velocityX: ball.velocityX,
                    velocityY: ball.velocityY,
                  });
                  Object.assign(ball, rolled);
                }
              }

              if (
                ball.nextY - ballSize / 2 <= wallEnd.y + wallW / 2 &&
                ball.nextY > wallEnd.y
              ) {
                const distance = distance2D(wallEnd, {
                  x: ball.nextX,
                  y: ball.nextY,
                });
                if (distance < ballSize / 2 + wallW / 2) {
                  const closest = closestItCanBe(wallEnd, {
                    x: ball.nextX,
                    y: ball.nextY,
                  });
                  const rolled = rollAroundCap(wallEnd, {
                    x: closest.x,
                    y: closest.y,
                    velocityX: ball.velocityX,
                    velocityY: ball.velocityY,
                  });
                  Object.assign(ball, rolled);
                }
              }

              if (ball.nextY >= wallStart.y && ball.nextY <= wallEnd.y) {
                if (ball.nextX < wall.x) {
                  ball.nextX = wall.x - wallW / 2 - ballSize / 2;
                } else {
                  ball.nextX = wall.x + wallW / 2 + ballSize / 2;
                }
                ball.x = ball.nextX;
                ball.velocityX = -ball.velocityX / 3;
              }
            }
          }
        });

        if (hardMode) {
          holes.forEach((hole, hi) => {
            const distance = distance2D(hole, {
              x: ball.nextX,
              y: ball.nextY,
            });
            if (distance <= holeSize / 2) {
              holeElements[hi].style.backgroundColor = "red";
              throw Error("The ball fell into a hole");
            }
          });
        }

        ball.x = ball.x + ball.velocityX;
        ball.y = ball.y + ball.velocityY;
      });

      balls.forEach(({ x, y }, index) => {
        ballElements[index].style.cssText = `left: ${x}px; top: ${y}px; `;
      });
    }

    if (
      balls.every(
        (ball) => distance2D(ball, { x: 350 / 2, y: 315 / 2 }) < 65 / 2
      )
    ) {
      noteElement.innerHTML = `تهانينا، لقد نجحت!
          ${!hardMode ? "<p>اضغط H للوضع الصعب</p>" : ""}
          <p></p>`;
      noteElement.style.opacity = 1;
      gameInProgress = false;
    } else {
      previousTimestamp = timestamp;
      window.requestAnimationFrame(main);
    }
  } catch (error) {
    if (error.message == "The ball fell into a hole") {
      noteElement.innerHTML = `لقد سقطت كرة في ثقب أسود! اضغط المسافة لإعادة اللعبة.
          <p>العودة للوضع السهل؟ اضغط E</p>`;
      noteElement.style.opacity = 1;
      gameInProgress = false;
    } else throw error;
  }
}