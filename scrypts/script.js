const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const bgImage = new Image();
bgImage.src = "roulet/plugins/bg.jpg";
const spinBtn = document.getElementById("spinBtn");
const namesInput = document.getElementById("names");
const resultDiv = document.getElementById("result");

const spinSound = document.getElementById("spinSound");

let rotation = 0;
let velocity = 0;
let spinning = false;
let animationFrame;

const colors = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f1c40f",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#fd79a8",
];

function getNames() {
  return namesInput.value
    .split("\n")
    .map((n) => n.trim())
    .filter((n) => n);
}

function drawWheel() {
  const names = getNames();

  ctx.clearRect(0, 0, 500, 500);

  /* ========================= */
  /* ФОНОВОЕ ИЗОБРАЖЕНИЕ */
  /* ========================= */

  ctx.save();

  ctx.beginPath();
  ctx.arc(250, 250, 250, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(bgImage, 0, 0, 500, 500);

  ctx.restore();

  /* ========================= */
  /* ЕСЛИ НЕТ ИМЁН */
  /* ========================= */

  if (names.length === 0) {
    return;
  }

  const arc = (Math.PI * 2) / names.length;

  names.forEach((name, index) => {
    const angle = index * arc + rotation;

    ctx.beginPath();

    ctx.moveTo(250, 250);

    ctx.arc(250, 250, 250, angle, angle + arc);

    /* ========================= */
    /* ПРОЗРАЧНЫЕ СЕКТОРА */
    /* ========================= */

    ctx.fillStyle = colors[index % colors.length] + "66";

    ctx.fill();

    ctx.save();

    ctx.translate(250, 250);

    ctx.rotate(angle + arc / 2);

    ctx.fillStyle = "white";

    ctx.font = "20px Arial";

    ctx.textAlign = "right";

    ctx.fillText(name, 220, 10);

    ctx.restore();
  });
}
drawWheel();

namesInput.addEventListener("input", drawWheel);
function getWinner() {
  const names = getNames();

  if (names.length === 0) return;

  const arc = (Math.PI * 2) / names.length;

  /* ========================= */
  /* СМЕЩЕНИЕ ДЛЯ СТРЕЛКИ СВЕРХУ */
  /* ========================= */

  const pointerAngle = Math.PI / 2;

  const normalized =
    (Math.PI * 2 - ((rotation + pointerAngle) % (Math.PI * 2))) % (Math.PI * 2);

  const index = Math.floor(normalized / arc) % names.length;
  console.log(names[index]);

  resultDiv.textContent = "Выпало: " + names[index];
}

function fadeOutAudio(audio) {
  const fadeInterval = setInterval(() => {
    if (audio.volume > 0.05) {
      audio.volume -= 0.05;
    } else {
      audio.pause();
      audio.volume = 1;
      clearInterval(fadeInterval);
    }
  }, 100);
}

function spinPhysics() {
  if (Math.abs(velocity) < 0.002) {
    spinning = false;

    getWinner();

    setTimeout(() => {
      fadeOutAudio(spinSound);
    }, 5000);

    return;
  }

  rotation += velocity;

  velocity *= 0.985;

  drawWheel();

  animationFrame = requestAnimationFrame(spinPhysics);
}

spinBtn.addEventListener("click", () => {
  if (spinning) return;

  spinning = true;

  spinSound.currentTime = 0;
  spinSound.play();

  velocity = Math.random() * 0.35 + 0.25;

  cancelAnimationFrame(animationFrame);

  spinPhysics();
});

/* ========================= */
/* УПРАВЛЕНИЕ МЫШКОЙ */
/* ========================= */

let isDragging = false;
let lastAngle = 0;
let lastMoveTime = 0;

function getMouseAngle(e) {
  const rect = canvas.getBoundingClientRect();

  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;

  return Math.atan2(y, x);
}

canvas.addEventListener("mousedown", (e) => {
  isDragging = true;

  lastAngle = getMouseAngle(e);

  velocity = 0;

  cancelAnimationFrame(animationFrame);
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const currentAngle = getMouseAngle(e);

  const delta = currentAngle - lastAngle;

  rotation += delta;

  drawWheel();

  const now = Date.now();

  velocity = delta / ((now - lastMoveTime + 1) / 16);

  lastMoveTime = now;

  lastAngle = currentAngle;
});

window.addEventListener("mouseup", () => {
  if (!isDragging) return;

  isDragging = false;

  spinning = true;

  spinSound.currentTime = 0;
  spinSound.play();

  spinPhysics();
});

/* ========================= */
/* ТАЧ ДЛЯ ТЕЛЕФОНА */
/* ========================= */

canvas.addEventListener("touchstart", (e) => {
  isDragging = true;

  const touch = e.touches[0];

  lastAngle = getMouseAngle(touch);

  velocity = 0;

  cancelAnimationFrame(animationFrame);
});

window.addEventListener("touchmove", (e) => {
  if (!isDragging) return;

  const touch = e.touches[0];

  const currentAngle = getMouseAngle(touch);

  const delta = currentAngle - lastAngle;

  rotation += delta;

  drawWheel();

  velocity = delta * 1.5;

  lastAngle = currentAngle;
});

window.addEventListener("touchend", () => {
  if (!isDragging) return;

  isDragging = false;

  spinning = true;

  spinSound.currentTime = 0;
  spinSound.play();

  spinPhysics();
});
