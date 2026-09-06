const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const spinBtn = document.getElementById("spinBtn");
const namesInput = document.getElementById("names");
const resultDiv = document.getElementById("result");
const spinSound = document.getElementById("spinSound");

/* ========================= */
/* КАРТИНКИ И МУЗЫКА */
/* ========================= */

const backgrounds = [
  "./plugins/bg1.jpg",
  "./plugins/bg2.webp",
  "./plugins/bg3.jpg",
];

const sounds = [
  "./sounds/spin1.mp3",
  "./sounds/spin2.mp3",
  "./sounds/spin3.mp3",
];

const bgImage = new Image();

/* ========================= */
/* LOCAL STORAGE */
/* ========================= */

const savedNames = localStorage.getItem("wheelNames");

if (savedNames) {
  namesInput.value = savedNames;
}

let mediaIndex = Number(localStorage.getItem("mediaIndex"));

if (Number.isNaN(mediaIndex)) {
  mediaIndex = -1;
}

/* ========================= */
/* СТАРТОВАЯ КАРТИНКА */
/* ========================= */

const initialBackgroundIndex =
  mediaIndex >= 0 ? mediaIndex % backgrounds.length : 0;

bgImage.src = backgrounds[initialBackgroundIndex];

/* ========================= */
/* СОСТОЯНИЕ */
/* ========================= */

let rotation = 0;
let spinning = false;
let animationFrame = null;

let isDragging = false;
let lastAngle = 0;

/* ========================= */
/* ЦВЕТА СЕКТОРОВ */
/* ========================= */

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

/* ========================= */
/* ПОЛУЧАЕМ ИМЕНА */
/* ========================= */

function getNames() {
  return namesInput.value
    .split("\n")
    .map((name) => name.trim())
    .filter((name) => name);
}

/* ========================= */
/* РИСУЕМ РУЛЕТКУ */
/* ========================= */

function drawWheel() {
  const names = getNames();

  const width = canvas.width;
  const height = canvas.height;

  const centerX = width / 2;
  const centerY = height / 2;

  const radius = Math.min(width, height) / 2;

  ctx.clearRect(0, 0, width, height);

  /* ========================= */
  /* ФОНОВАЯ КАРТИНКА */
  /* ========================= */

  ctx.save();

  ctx.beginPath();

  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

  ctx.closePath();

  ctx.clip();

  ctx.translate(centerX, centerY);

  /*
    ФОН КРУТИТСЯ В ОБРАТНУЮ
    СТОРОНУ ОТ РУЛЕТКИ
  */

  ctx.rotate(-rotation);

  /*
    Делаем изображение больше,
    чтобы при вращении
    не было пустых углов.
  */

  const imageSize = radius * 2.85;

  ctx.drawImage(bgImage, -imageSize / 2, -imageSize / 2, imageSize, imageSize);

  ctx.restore();

  /* ========================= */
  /* ЕСЛИ ИМЁН НЕТ */
  /* ========================= */

  if (names.length === 0) {
    return;
  }

  const arc = (Math.PI * 2) / names.length;

  /* ========================= */
  /* СЕКТОРА */
  /* ========================= */

  names.forEach((name, index) => {
    const angle = index * arc + rotation;

    ctx.beginPath();

    ctx.moveTo(centerX, centerY);

    ctx.arc(centerX, centerY, radius, angle, angle + arc);

    ctx.closePath();

    /* ========================= */
    /* ЦВЕТ СЕКТОРА */
    /* ========================= */

    ctx.fillStyle = colors[index % colors.length] + "66";

    ctx.fill();

    /* ========================= */
    /* РАЗДЕЛИТЕЛИ */
    /* ========================= */

    ctx.strokeStyle = "rgba(255,255,255,0.4)";

    ctx.lineWidth = 2;

    ctx.stroke();

    /* ========================= */
    /* ТЕКСТ */
    /* ========================= */

    ctx.save();

    ctx.translate(centerX, centerY);

    ctx.rotate(angle + arc / 2);

    ctx.fillStyle = "white";

    ctx.font = "20px Arial";

    ctx.textAlign = "right";

    ctx.textBaseline = "middle";

    ctx.fillText(name, radius - 30, 0);

    ctx.restore();
  });

  /* ========================= */
  /* ЦЕНТРАЛЬНЫЙ КРУГ */
  /* ========================= */

  ctx.beginPath();

  ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);

  ctx.fillStyle = "#ffffff";

  ctx.fill();
}

/* ========================= */
/* ПОСЛЕ ЗАГРУЗКИ КАРТИНКИ */
/* ========================= */

bgImage.addEventListener("load", () => {
  drawWheel();
});

/* ========================= */
/* ПЕРВАЯ ОТРИСОВКА */
/* ========================= */

drawWheel();

/* ========================= */
/* СОХРАНЕНИЕ ИМЁН */
/* ========================= */

namesInput.addEventListener("input", () => {
  localStorage.setItem("wheelNames", namesInput.value);

  drawWheel();
});

/* ========================= */
/* СМЕНА КАРТИНКИ И МУЗЫКИ */
/* ========================= */

function changeMedia() {
  const maxLength = Math.max(backgrounds.length, sounds.length);

  mediaIndex = (mediaIndex + 1) % maxLength;

  localStorage.setItem("mediaIndex", mediaIndex);

  /* Картинка */

  const backgroundIndex = mediaIndex % backgrounds.length;

  bgImage.src = backgrounds[backgroundIndex];

  /* Музыка */

  const soundIndex = mediaIndex % sounds.length;

  spinSound.src = sounds[soundIndex];

  spinSound.load();
}

/* ========================= */
/* ОПРЕДЕЛЕНИЕ ПОБЕДИТЕЛЯ */
/* ========================= */

function getWinner() {
  const names = getNames();

  if (names.length === 0) {
    return;
  }

  const arc = (Math.PI * 2) / names.length;

  /*
    Если стрелка сверху.
  */

  const pointerAngle = Math.PI / 2;

  const normalized =
    (Math.PI * 2 - ((rotation + pointerAngle) % (Math.PI * 2))) % (Math.PI * 2);

  const index = Math.floor(normalized / arc) % names.length;

  const winner = names[index];

  console.log("Выпало:", winner);

  resultDiv.textContent = "Выпало: " + winner;
}

/* ========================= */
/* EASING */
/* ========================= */

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/* ========================= */
/* ЗАПУСК РУЛЕТКИ */
/* ========================= */

function startSpin() {
  if (spinning) {
    return;
  }

  const names = getNames();

  if (names.length === 0) {
    resultDiv.textContent = "Добавьте участников";

    return;
  }

  spinning = true;

  isDragging = false;

  resultDiv.textContent = "";

  /* ========================= */
  /* НОВАЯ КАРТИНКА + МУЗЫКА */
  /* ========================= */

  changeMedia();

  /* ========================= */
  /* 10–15 СЕКУНД */
  /* ========================= */

  const duration = Math.random() * 5000 + 10000;

  console.log("Время вращения:", (duration / 1000).toFixed(2), "сек");

  /* ========================= */
  /* КОЛИЧЕСТВО ОБОРОТОВ */
  /* ========================= */

  const turns = Math.random() * 8 + 15;

  const startRotation = rotation;

  const targetRotation = startRotation + Math.PI * 2 * turns;

  const startTime = performance.now();

  /* ========================= */
  /* ЗАПУСК МУЗЫКИ */
  /* ========================= */

  spinSound.pause();

  spinSound.currentTime = 0;

  /*
    Музыка повторяется,
    если закончилась раньше рулетки.
  */

  spinSound.loop = true;

  spinSound.volume = 1;

  spinSound.play().catch((error) => {
    console.log("Ошибка воспроизведения:", error);
  });

  /* ========================= */
  /* АНИМАЦИЯ */
  /* ========================= */

  function animate(currentTime) {
    const elapsed = currentTime - startTime;

    const progress = Math.min(elapsed / duration, 1);

    const eased = easeOutCubic(progress);

    rotation = startRotation + (targetRotation - startRotation) * eased;

    drawWheel();

    /* ========================= */
    /* ПРОДОЛЖАЕМ */
    /* ========================= */

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);

      return;
    }

    /* ========================= */
    /* ОСТАНОВКА */
    /* ========================= */

    rotation = targetRotation;

    spinning = false;

    drawWheel();

    /* ========================= */
    /* ОСТАНОВКА МУЗЫКИ */
    /* ========================= */

    spinSound.pause();

    spinSound.currentTime = 0;

    spinSound.loop = false;

    /* ========================= */
    /* ПОБЕДИТЕЛЬ */
    /* ========================= */

    getWinner();
  }

  cancelAnimationFrame(animationFrame);

  animationFrame = requestAnimationFrame(animate);
}

/* ========================= */
/* КНОПКА */
/* ========================= */

spinBtn.addEventListener("click", startSpin);

/* ========================= */
/* УГОЛ МЫШКИ */
/* ========================= */

function getPointerAngle(event) {
  const rect = canvas.getBoundingClientRect();

  const x = event.clientX - rect.left - rect.width / 2;

  const y = event.clientY - rect.top - rect.height / 2;

  return Math.atan2(y, x);
}

/* ========================= */
/* MOUSE DOWN */
/* ========================= */

canvas.addEventListener("mousedown", (event) => {
  if (spinning) {
    return;
  }

  isDragging = true;

  lastAngle = getPointerAngle(event);
});

/* ========================= */
/* MOUSE MOVE */
/* ========================= */

window.addEventListener("mousemove", (event) => {
  if (!isDragging || spinning) {
    return;
  }

  const currentAngle = getPointerAngle(event);

  let delta = currentAngle - lastAngle;

  /*
      Убираем скачок
      при переходе через
      -PI / +PI
    */

  if (delta > Math.PI) {
    delta -= Math.PI * 2;
  }

  if (delta < -Math.PI) {
    delta += Math.PI * 2;
  }

  rotation += delta;

  lastAngle = currentAngle;

  drawWheel();
});

/* ========================= */
/* MOUSE UP */
/* ========================= */

window.addEventListener("mouseup", () => {
  if (!isDragging) {
    return;
  }

  isDragging = false;

  /*
      После того как пользователь
      бросил колесо мышкой,
      запускаем полноценный spin
      на 10–15 секунд.
    */

  startSpin();
});

/* ========================= */
/* TOUCH START */
/* ========================= */

canvas.addEventListener(
  "touchstart",
  (event) => {
    if (spinning) {
      return;
    }

    event.preventDefault();

    isDragging = true;

    const touch = event.touches[0];

    lastAngle = getPointerAngle(touch);
  },
  {
    passive: false,
  },
);

/* ========================= */
/* TOUCH MOVE */
/* ========================= */

window.addEventListener(
  "touchmove",
  (event) => {
    if (!isDragging || spinning) {
      return;
    }

    event.preventDefault();

    const touch = event.touches[0];

    const currentAngle = getPointerAngle(touch);

    let delta = currentAngle - lastAngle;

    if (delta > Math.PI) {
      delta -= Math.PI * 2;
    }

    if (delta < -Math.PI) {
      delta += Math.PI * 2;
    }

    rotation += delta;

    lastAngle = currentAngle;

    drawWheel();
  },
  {
    passive: false,
  },
);

/* ========================= */
/* TOUCH END */
/* ========================= */

window.addEventListener("touchend", () => {
  if (!isDragging) {
    return;
  }

  isDragging = false;

  startSpin();
});
