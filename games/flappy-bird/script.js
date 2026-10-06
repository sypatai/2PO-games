// ===== Flappy Bird =====
(function () {
  "use strict";

  const W = 360, H = 540, GROUND = 70;
  const GRAVITY = 1500;   // как быстро птица падает
  const FLAP = -420;      // сила взмаха
  const BIRD_X = 90;
  const PIPE_W = 56;
  const SPACING = 200;    // расстояние между трубами

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min((typeof window !== "undefined" && window.devicePixelRatio) || 1, 3);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const FONT = "Impact, 'Arial Black', sans-serif";
  const TEXT = "'Trebuchet MS', Verdana, sans-serif";

  let bird, pipes, clouds, score, best, state, t, groundOff, overT;
  // state: ready | playing | paused | over

  function loadBest() {
    try { return Number(localStorage.getItem("flappy-bird-best")) || 0; } catch (e) { return 0; }
  }
  function saveBest() {
    try { localStorage.setItem("flappy-bird-best", String(best)); } catch (e) {}
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const speed = () => 150 + Math.min(score * 2, 50);

  function makePipe(x) {
    const gap = 150;
    return { x, gap, gapY: rnd(80 + gap / 2, H - GROUND - 80 - gap / 2), passed: false };
  }

  function resetGame() {
    bird = { y: 250, vy: 0, rot: 0 };
    pipes = [];
    score = 0;
    overT = 0;
  }

  function die() {
    state = "over";
    overT = 0;
    if (score > best) { best = score; saveBest(); }
  }

  function flap() {
    if (state === "ready") { state = "playing"; bird.vy = FLAP; }
    else if (state === "playing") { bird.vy = FLAP; }
    else if (state === "paused") { state = "playing"; }
    else if (state === "over" && overT > 0.5) {
      resetGame();
      state = "playing";
      bird.vy = FLAP;
    }
  }

  function togglePause() {
    if (state === "playing") state = "paused";
    else if (state === "paused") state = "playing";
  }

  function update(dt) {
    if (state === "paused") return;
    t += dt;

    // облака плывут всегда
    clouds.forEach(c => { c.x -= c.s * dt; if (c.x < -80) { c.x = W + 60; c.y = rnd(40, 260); } });

    if (state === "ready") {
      bird.y = 250 + Math.sin(t * 4) * 8;
      bird.rot = 0;
      groundOff += 150 * dt;
      return;
    }

    bird.vy += GRAVITY * dt;
    bird.y += bird.vy * dt;
    bird.rot = clamp(bird.vy / 600, -0.5, 1.2);
    if (bird.y < 12) { bird.y = 12; if (bird.vy < 0) bird.vy = 0; }

    const floor = H - GROUND - 12;
    if (bird.y >= floor) {
      bird.y = floor;
      bird.vy = 0;
      if (state === "playing") die();
    }

    if (state === "over") { overT += dt; return; }

    const sp = speed();
    groundOff += sp * dt;
    pipes.forEach(p => { p.x -= sp * dt; });
    if (!pipes.length || pipes[pipes.length - 1].x < W - SPACING) pipes.push(makePipe(W + 20));
    while (pipes.length && pipes[0].x + PIPE_W + 10 < 0) pipes.shift();

    const bx = BIRD_X - 12, by = bird.y - 9, bw = 24, bh = 18;
    for (const p of pipes) {
      if (!p.passed && p.x + PIPE_W < BIRD_X - 12) { p.passed = true; score++; }
      if (bx + bw > p.x && bx < p.x + PIPE_W) {
        const top = p.gapY - p.gap / 2, bottom = p.gapY + p.gap / 2;
        if (by < top || by + bh > bottom) { die(); break; }
      }
    }
  }

  // ---------- рисование ----------
  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H - GROUND);
    g.addColorStop(0, "#4EC0CA");
    g.addColorStop(1, "#BDEBF0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255,255,255,.85)";
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 18 * c.k, 0, Math.PI * 2);
      ctx.arc(c.x + 20 * c.k, c.y - 8 * c.k, 22 * c.k, 0, Math.PI * 2);
      ctx.arc(c.x + 44 * c.k, c.y, 18 * c.k, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPipePart(x, y, w, h) {
    if (h <= 0) return;
    ctx.fillStyle = "#73BF2E";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#9BE04A";
    ctx.fillRect(x + 6, y, 8, h);
    ctx.fillStyle = "#558C22";
    ctx.fillRect(x + w - 8, y, 8, h);
    ctx.strokeStyle = "#2F4F10";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  function drawPipe(p) {
    const top = p.gapY - p.gap / 2, bottom = p.gapY + p.gap / 2;
    const capH = 24, capX = p.x - 4, capW = PIPE_W + 8;
    drawPipePart(p.x, 0, PIPE_W, top - capH);
    drawPipePart(capX, top - capH, capW, capH);
    drawPipePart(p.x, bottom + capH, PIPE_W, H - GROUND - bottom - capH);
    drawPipePart(capX, bottom, capW, capH);
  }

  function drawGround() {
    const y = H - GROUND;
    ctx.fillStyle = "#DED895";
    ctx.fillRect(0, y, W, GROUND);
    ctx.fillStyle = "#73BF2E";
    ctx.fillRect(0, y, W, 14);
    ctx.fillStyle = "#558C22";
    const off = groundOff % 24;
    for (let x = -24 - off; x < W + 24; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x + 24, y);
      ctx.lineTo(x + 36, y);
      ctx.lineTo(x + 24, y + 14);
      ctx.lineTo(x + 12, y + 14);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#2F4F10";
    ctx.fillRect(0, y, W, 3);
    ctx.fillStyle = "#C9BF74";
    ctx.fillRect(0, y + 14, W, 3);
  }

  function drawBird() {
    const wing = state === "over" ? 0.5 : (bird.vy < 0 ? Math.sin(t * 40) : 0.2);
    ctx.save();
    ctx.translate(BIRD_X, bird.y);
    ctx.rotate(bird.rot);

    ctx.fillStyle = "#FFD23F";
    ctx.strokeStyle = "#7A4B0B";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFF1B0";
    ctx.beginPath();
    ctx.ellipse(2, 5, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(8, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(10, -4, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F4511E";
    ctx.beginPath();
    ctx.moveTo(12, 1);
    ctx.lineTo(23, 4);
    ctx.lineTo(12, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFB703";
    ctx.beginPath();
    ctx.ellipse(-6, 2 + wing * 4, 8, 4 + Math.abs(wing) * 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function outlinedText(str, x, y, font, fill) {
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#2F2F2F";
    ctx.strokeText(str, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(str, x, y);
    ctx.textAlign = "left";
  }

  function drawOverlay() {
    if (state === "ready") {
      outlinedText("Flappy Bird", W / 2, 150, "44px " + FONT, "#FFD23F");
      outlinedText("Нажми, чтобы взлететь", W / 2, 330, "20px " + TEXT, "#FFFFFF");
    } else if (state === "paused") {
      outlinedText("Пауза", W / 2, 260, "44px " + FONT, "#FFFFFF");
    } else if (state === "over") {
      outlinedText("Игра окончена", W / 2, 150, "40px " + FONT, "#F4511E");
      ctx.fillStyle = "#DED895";
      ctx.fillRect(60, 190, 240, 130);
      ctx.strokeStyle = "#7A4B0B";
      ctx.lineWidth = 4;
      ctx.strokeRect(60, 190, 240, 130);
      ctx.textAlign = "center";
      ctx.fillStyle = "#7A4B0B";
      ctx.font = "bold 18px " + TEXT;
      ctx.fillText("Очки: " + score, W / 2, 232);
      ctx.fillText("Рекорд: " + best, W / 2, 268);
      ctx.fillStyle = overT > 0.5 ? "#2F7D12" : "#9C8F4A";
      ctx.font = "bold 15px " + TEXT;
      ctx.fillText("Нажми, чтобы сыграть ещё раз", W / 2, 302);
      ctx.textAlign = "left";
    }
  }

  function render() {
    drawSky();
    pipes.forEach(drawPipe);
    drawGround();
    drawBird();
    if (state !== "ready") outlinedText(String(score), W / 2, 70, "52px " + FONT, "#FFFFFF");
    drawOverlay();
  }

  // ---------- управление ----------
  document.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      if (!e.repeat) flap();
    } else if (e.code === "KeyP" || e.code === "Escape") {
      togglePause();
    }
  });
  canvas.addEventListener("pointerdown", e => { e.preventDefault(); flap(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") state = "paused";
  });

  // ---------- старт ----------
  best = loadBest();
  t = 0;
  groundOff = 0;
  clouds = [];
  for (let i = 0; i < 4; i++) clouds.push({ x: rnd(0, W), y: rnd(40, 260), k: rnd(0.7, 1.2), s: rnd(8, 20) });
  resetGame();
  state = "ready";

  let last = 0;
  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (!isFinite(dt) || dt < 0) dt = 0;
    if (dt > 0.05) dt = 0.05;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
