const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const startButton = document.getElementById('start-button');
const gameArea = document.getElementById('game-area');
const player = document.getElementById('player');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const playAgainButton = document.getElementById('play-again-button');

startButton.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  startGame();
});

playAgainButton.addEventListener('click', () => {
  startGame();
});

// --- Player movement ---

const PLAYER_SPEED = 400; // pixels per second

let playerX = 0; // current left position (px from game area's left edge)
let keys = { left: false, right: false };

function updatePlayer(deltaTime) {
  const areaWidth = gameArea.clientWidth;
  const playerWidth = player.offsetWidth;

  if (keys.left) {
    playerX -= PLAYER_SPEED * deltaTime;
  }
  if (keys.right) {
    playerX += PLAYER_SPEED * deltaTime;
  }

  // Keep the robot inside the game area.
  const minX = 0;
  const maxX = areaWidth - playerWidth;
  playerX = Math.max(minX, Math.min(maxX, playerX));

  player.style.left = playerX + 'px';
}

// --- Falling objects ---

const BASE_SPEED = 160;       // starting fall speed (px per second)
const SPEED_INCREASE = 25;    // extra px/s added on each speed-up
const SPAWN_INTERVAL = 900;   // ms between spawns
const BUG_CHANCE = 0.2;       // 20% of objects are bugs
const MAX_LIVES = 3;

let objects = [];             // active falling objects
let score = 0;
let lives = MAX_LIVES;
let spawnTimer = 0;           // ms since last spawn
let fallSpeed = BASE_SPEED;
let gameOver = false;

function spawnObject() {
  const el = document.createElement('div');
  el.classList.add('falling');

  const isBug = Math.random() < BUG_CHANCE;
  if (isBug) {
    el.textContent = '🐞';
    el.classList.add('bug');
  } else {
    el.textContent = '🟩';
    el.classList.add('data');
  }

  gameArea.appendChild(el);

  // Random horizontal position, keeping the object fully inside.
  const areaWidth = gameArea.clientWidth;
  const objWidth = el.offsetWidth;
  const x = Math.random() * (areaWidth - objWidth);

  objects.push({
    el,
    x,
    y: -objWidth, // start just above the top edge
    width: objWidth,
    height: el.offsetHeight,
    isBug,
  });
}

function updateObjects(deltaTime) {
  const areaHeight = gameArea.clientHeight;

  // Spawn on a timer.
  spawnTimer += deltaTime * 1000;
  if (spawnTimer >= SPAWN_INTERVAL) {
    spawnTimer = 0;
    spawnObject();
  }

  // Player bounding box for collision.
  const playerLeft = playerX;
  const playerRight = playerX + player.offsetWidth;
  const playerTop = player.offsetTop;
  const playerBottom = player.offsetTop + player.offsetHeight;

  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    obj.y += fallSpeed * deltaTime;

    const objLeft = obj.x;
    const objRight = obj.x + obj.width;
    const objTop = obj.y;
    const objBottom = obj.y + obj.height;

    // Collision with the player.
    const overlaps =
      objRight > playerLeft &&
      objLeft < playerRight &&
      objBottom > playerTop &&
      objTop < playerBottom;

    if (overlaps) {
      if (obj.isBug) {
        loseLife();
      } else {
        score += 1;
        updateScore();
      }
      removeObject(i);
      continue;
    }

    // Fell off the bottom without being caught.
    if (objTop > areaHeight) {
      removeObject(i);
      continue;
    }

    obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
  }
}

function removeObject(index) {
  const obj = objects[index];
  obj.el.remove();
  objects.splice(index, 1);
}

// --- Lives ---

function updateLives() {
  let hearts = '';
  for (let i = 0; i < lives; i++) {
    hearts += '❤️';
  }
  livesEl.textContent = hearts;
}

function loseLife() {
  lives -= 1;
  updateLives();

  if (lives <= 0) {
    endGame();
  }
}

// --- Scoring ---

function updateScore() {
  scoreEl.textContent = 'Score: ' + score;

  // Every 10 points, make objects fall a little faster.
  if (score % 10 === 0) {
    fallSpeed += SPEED_INCREASE;
  }
}

// --- Game over ---

function endGame() {
  gameOver = true;
  finalScoreEl.textContent = 'Final Score: ' + score;
  gameOverEl.classList.remove('hidden');
}

// --- Game lifecycle ---

function startGame() {
  // Reset state.
  objects.forEach((o) => o.el.remove());
  objects = [];
  score = 0;
  lives = MAX_LIVES;
  spawnTimer = 0;
  fallSpeed = BASE_SPEED;
  gameOver = false;

  updateScore();
  updateLives();
  gameOverEl.classList.add('hidden');

  // Center the player.
  const areaWidth = gameArea.clientWidth;
  const playerWidth = player.offsetWidth;
  playerX = (areaWidth - playerWidth) / 2;
  player.style.left = playerX + 'px';
}

// --- Game loop ---

let lastTime = 0;

function gameLoop(timestamp) {
  const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.05); // cap dt
  lastTime = timestamp;

  if (!gameOver) {
    updatePlayer(deltaTime);
    updateObjects(deltaTime);
  }

  requestAnimationFrame(gameLoop);
}

// Start the loop as soon as the page loads.
requestAnimationFrame(gameLoop);

// --- Keyboard input ---

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    keys.left = true;
    event.preventDefault();
  } else if (event.key === 'ArrowRight') {
    keys.right = true;
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowLeft') {
    keys.left = false;
    event.preventDefault();
  } else if (event.key === 'ArrowRight') {
    keys.right = false;
    event.preventDefault();
  }
});

// Keep the player centered if the window/game area resizes.
window.addEventListener('resize', () => {
  const areaWidth = gameArea.clientWidth;
  const playerWidth = player.offsetWidth;
  playerX = Math.max(0, Math.min(areaWidth - playerWidth, playerX));
  player.style.left = playerX + 'px';
});
