const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");

const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#best-score");
const finalScoreElement = document.querySelector("#final-score");
const startScreen = document.querySelector("#start-screen");
const gameOverScreen = document.querySelector("#game-over-screen");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const soundButton = document.querySelector("#sound-button");

const WORLD = { width: 720, height: 900 };
const PLAYER_SIZE = 52;
const STORAGE_KEY = "neon-dodge-best-score";

const state = {
  running: false,
  score: 0,
  best: Number(localStorage.getItem(STORAGE_KEY)) || 0,
  speed: 260,
  obstacleTimer: 0,
  energyTimer: 0,
  lastTime: 0,
  muted: false,
  keys: { left: false, right: false },
  player: { x: WORLD.width / 2 - PLAYER_SIZE / 2, y: 800, width: PLAYER_SIZE, height: PLAYER_SIZE },
  obstacles: [],
  energies: [],
  particles: [],
  stars: [],
};

for (let index = 0; index < 70; index += 1) {
  state.stars.push({
    x: Math.random() * WORLD.width,
    y: Math.random() * WORLD.height,
    radius: Math.random() * 1.6 + 0.4,
    speed: Math.random() * 30 + 15,
    alpha: Math.random() * 0.55 + 0.2,
  });
}

bestScoreElement.textContent = formatScore(state.best);

function formatScore(value) {
  return String(Math.floor(value)).padStart(3, "0");
}

function resetGame() {
  state.score = 0;
  state.speed = 260;
  state.obstacleTimer = 0;
  state.energyTimer = 0;
  state.lastTime = performance.now();
  state.player.x = WORLD.width / 2 - PLAYER_SIZE / 2;
  state.obstacles = [];
  state.energies = [];
  state.particles = [];
  scoreElement.textContent = "000";
}

function startGame() {
  resetGame();
  state.running = true;
  startScreen.hidden = true;
  gameOverScreen.hidden = true;
  playTone(420, 0.09, "sine");
  requestAnimationFrame(gameLoop);
}

function endGame() {
  state.running = false;
  const finalScore = Math.floor(state.score);
  finalScoreElement.textContent = finalScore;

  if (finalScore > state.best) {
    state.best = finalScore;
    localStorage.setItem(STORAGE_KEY, String(finalScore));
    bestScoreElement.textContent = formatScore(finalScore);
  }

  playTone(110, 0.24, "sawtooth");
  gameOverScreen.hidden = false;
}

function spawnObstacle() {
  const width = 54 + Math.random() * 92;
  state.obstacles.push({
    x: Math.random() * (WORLD.width - width),
    y: -80,
    width,
    height: 34 + Math.random() * 44,
    rotation: Math.random() * Math.PI,
    rotationSpeed: (Math.random() - 0.5) * 1.5,
  });
}

function spawnEnergy() {
  state.energies.push({
    x: 34 + Math.random() * (WORLD.width - 68),
    y: -40,
    radius: 15,
    pulse: Math.random() * Math.PI * 2,
  });
}

function createParticles(x, y, color, amount) {
  for (let index = 0; index < amount; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const force = 80 + Math.random() * 190;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * force,
      vy: Math.sin(angle) * force,
      life: 1,
      color,
      size: Math.random() * 5 + 2,
    });
  }
}

function intersectsRectangle(a, b) {
  const padding = 7;
  return (
    a.x + padding < b.x + b.width &&
    a.x + a.width - padding > b.x &&
    a.y + padding < b.y + b.height &&
    a.y + a.height - padding > b.y
  );
}

function intersectsCircle(rectangle, circle) {
  const closestX = Math.max(rectangle.x, Math.min(circle.x, rectangle.x + rectangle.width));
  const closestY = Math.max(rectangle.y, Math.min(circle.y, rectangle.y + rectangle.height));
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  return distanceX * distanceX + distanceY * distanceY < circle.radius * circle.radius;
}

function update(deltaTime) {
  const moveSpeed = 520;

  if (state.keys.left) state.player.x -= moveSpeed * deltaTime;
  if (state.keys.right) state.player.x += moveSpeed * deltaTime;
  state.player.x = Math.max(16, Math.min(WORLD.width - state.player.width - 16, state.player.x));

  state.score += deltaTime * 4;
  state.speed = Math.min(560, 260 + state.score * 1.7);
  state.obstacleTimer -= deltaTime;
  state.energyTimer -= deltaTime;

  if (state.obstacleTimer <= 0) {
    spawnObstacle();
    state.obstacleTimer = Math.max(0.28, 0.78 - state.score / 320);
  }

  if (state.energyTimer <= 0) {
    spawnEnergy();
    state.energyTimer = 1.4 + Math.random() * 1.25;
  }

  state.stars.forEach((star) => {
    star.y += (star.speed + state.speed * 0.08) * deltaTime;
    if (star.y > WORLD.height) {
      star.y = -4;
      star.x = Math.random() * WORLD.width;
    }
  });

  state.obstacles.forEach((obstacle) => {
    obstacle.y += state.speed * deltaTime;
    obstacle.rotation += obstacle.rotationSpeed * deltaTime;
    if (intersectsRectangle(state.player, obstacle)) endGame();
  });

  state.energies.forEach((energy) => {
    energy.y += state.speed * 0.78 * deltaTime;
    energy.pulse += deltaTime * 5;

    if (!energy.collected && intersectsCircle(state.player, energy)) {
      energy.collected = true;
      state.score += 15;
      createParticles(energy.x, energy.y, "#ffd65a", 18);
      playTone(760, 0.08, "sine");
    }
  });

  state.particles.forEach((particle) => {
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    particle.life -= deltaTime * 1.8;
  });

  state.obstacles = state.obstacles.filter((obstacle) => obstacle.y < WORLD.height + 120);
  state.energies = state.energies.filter((energy) => energy.y < WORLD.height + 60 && !energy.collected);
  state.particles = state.particles.filter((particle) => particle.life > 0);
  scoreElement.textContent = formatScore(state.score);
}

function roundedRectangle(x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawBackground() {
  const gradient = context.createLinearGradient(0, 0, 0, WORLD.height);
  gradient.addColorStop(0, "#111727");
  gradient.addColorStop(1, "#080a11");
  context.fillStyle = gradient;
  context.fillRect(0, 0, WORLD.width, WORLD.height);

  context.strokeStyle = "rgba(101, 244, 220, 0.055)";
  context.lineWidth = 1;
  for (let x = 0; x <= WORLD.width; x += 72) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, WORLD.height);
    context.stroke();
  }
  for (let y = 0; y <= WORLD.height; y += 72) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(WORLD.width, y);
    context.stroke();
  }

  state.stars.forEach((star) => {
    context.globalAlpha = star.alpha;
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fill();
  });
  context.globalAlpha = 1;
}

function drawPlayer() {
  const { x, y, width, height } = state.player;

  context.save();
  context.shadowColor = "#65f4dc";
  context.shadowBlur = 25;
  roundedRectangle(x, y, width, height, 15);
  context.fillStyle = "#65f4dc";
  context.fill();
  context.shadowBlur = 0;

  context.fillStyle = "#0b1716";
  context.beginPath();
  context.moveTo(x + width * 0.5, y + 10);
  context.lineTo(x + width - 12, y + height - 12);
  context.lineTo(x + 12, y + height - 12);
  context.closePath();
  context.fill();

  const flame = 8 + Math.sin(performance.now() / 45) * 5;
  context.fillStyle = "#ffd65a";
  context.beginPath();
  context.moveTo(x + width * 0.38, y + height);
  context.lineTo(x + width * 0.5, y + height + flame);
  context.lineTo(x + width * 0.62, y + height);
  context.fill();
  context.restore();
}

function drawObstacles() {
  state.obstacles.forEach((obstacle) => {
    context.save();
    context.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
    context.rotate(obstacle.rotation);
    context.shadowColor = "#ff5572";
    context.shadowBlur = 18;
    roundedRectangle(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height, 10);
    context.fillStyle = "#ff5572";
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = "rgba(75, 4, 24, 0.55)";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(-obstacle.width * 0.26, -obstacle.height * 0.22);
    context.lineTo(obstacle.width * 0.26, obstacle.height * 0.22);
    context.stroke();
    context.restore();
  });
}

function drawEnergies() {
  state.energies.forEach((energy) => {
    const pulseRadius = energy.radius + 6 + Math.sin(energy.pulse) * 3;
    context.strokeStyle = "rgba(255, 214, 90, 0.34)";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(energy.x, energy.y, pulseRadius, 0, Math.PI * 2);
    context.stroke();

    context.shadowColor = "#ffd65a";
    context.shadowBlur = 22;
    context.fillStyle = "#ffd65a";
    context.beginPath();
    context.arc(energy.x, energy.y, energy.radius, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
  });
}

function drawParticles() {
  state.particles.forEach((particle) => {
    context.globalAlpha = Math.max(0, particle.life);
    context.fillStyle = particle.color;
    context.fillRect(particle.x, particle.y, particle.size, particle.size);
  });
  context.globalAlpha = 1;
}

function draw() {
  drawBackground();
  drawEnergies();
  drawObstacles();
  drawParticles();
  drawPlayer();
}

function gameLoop(timestamp) {
  if (!state.running) {
    draw();
    return;
  }

  const deltaTime = Math.min((timestamp - state.lastTime) / 1000, 0.04);
  state.lastTime = timestamp;
  update(deltaTime);
  draw();

  if (state.running) requestAnimationFrame(gameLoop);
}

function playTone(frequency, duration, waveType) {
  if (state.muted) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = waveType;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.08, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
  oscillator.addEventListener("ended", () => audioContext.close());
}

function setMovement(direction, active) {
  state.keys[direction] = active;
}

function bindHoldButton(selector, direction) {
  const button = document.querySelector(selector);
  ["pointerdown", "touchstart"].forEach((eventName) => {
    button.addEventListener(eventName, (event) => {
      event.preventDefault();
      setMovement(direction, true);
    }, { passive: false });
  });

  ["pointerup", "pointercancel", "pointerleave", "touchend"].forEach((eventName) => {
    button.addEventListener(eventName, () => setMovement(direction, false));
  });
}

document.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
  if (event.code === "ArrowLeft" || event.code === "KeyA") setMovement("left", true);
  if (event.code === "ArrowRight" || event.code === "KeyD") setMovement("right", true);
  if (event.code === "Space" && !state.running) startGame();
});

document.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") setMovement("left", false);
  if (event.code === "ArrowRight" || event.code === "KeyD") setMovement("right", false);
});

window.addEventListener("blur", () => {
  state.keys.left = false;
  state.keys.right = false;
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
soundButton.addEventListener("click", () => {
  state.muted = !state.muted;
  soundButton.setAttribute("aria-pressed", String(state.muted));
  soundButton.setAttribute("aria-label", state.muted ? "Включить звук" : "Выключить звук");
});

bindHoldButton("#left-button", "left");
bindHoldButton("#right-button", "right");

draw();
