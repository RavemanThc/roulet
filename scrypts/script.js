const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const spinBtn = document.getElementById("spinBtn");
const namesInput = document.getElementById("names");
const resultDiv = document.getElementById("result");

/* ====================================================== */
/*                       НАСТРОЙКИ                         */
/* ====================================================== */

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

/* ====================================================== */
/*                    LOCAL STORAGE                        */
/* ====================================================== */

const savedNames = localStorage.getItem("wheelNames");

if (savedNames !== null) {
  namesInput.value = savedNames;
}

namesInput.addEventListener("input", () => {
  localStorage.setItem("wheelNames", namesInput.value);

  drawWheel();
});

/* ====================================================== */
/*                   ПРЕДЗАГРУЗКА КАРТИНОК                 */
/* ====================================================== */

const backgroundImages = backgrounds.map((src) => {
  const image = new Image();

  image.src = src;

  image.addEventListener("load", () => {
    console.log("Картинка загружена:", src);

    drawWheel();
  });

  image.addEventListener("error", () => {
    console.error("Не удалось загрузить картинку:", src);
  });

  return image;
});

/* ====================================================== */
/*                    ПРЕДЗАГРУЗКА МУЗЫКИ                  */
/* ====================================================== */

const audioTracks = sounds.map((src) => {
  const audio = new Audio();

  audio.src = src;
  audio.preload = "auto";
  audio.loop = true;

  audio.addEventListener("canplaythrough", () => {
    console.log("Музыка готова:", src);
  });

  audio.addEventListener("error", () => {
    console.error("Не удалось загрузить музыку:", src);
  });

  audio.load();

  return audio;
});

/* ====================================================== */
/*                       СОСТОЯНИЕ                          */
/* ====================================================== */

let rotation = 0;

let spinning = false;

let animationFrame = null;

let mediaIndex = -1;

let currentBackground = backgroundImages[0];

let currentAudio = null;

let isDragging = false;

let lastAngle = 0;

/* ====================================================== */
/*                       ИМЕНА                              */
/* ====================================================== */

function getNames() {
  return namesInput.value
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean);
}

/* ====================================================== */
/*                  СЛЕДУЮЩАЯ КАРТИНКА                     */
/*                  И СЛЕДУЮЩАЯ МУЗЫКА                     */
/* ====================================================== */

function changeMedia() {
  /*
    Если картинок и песен одинаковое количество:

    0 -> bg1 + spin1
    1 -> bg2 + spin2
    2 -> bg3 + spin3
    0 -> bg1 + spin1
  */

  mediaIndex++;

  const maxMedia = Math.max(backgroundImages.length, audioTracks.length);

  mediaIndex %= maxMedia;

  const backgroundIndex = mediaIndex % backgroundImages.length;

  const audioIndex = mediaIndex % audioTracks.length;

  currentBackground = backgroundImages[backgroundIndex];

  /*
    На всякий случай останавливаем
    предыдущую музыку.
  */

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = audioTracks[audioIndex];

  currentAudio.currentTime = 0;
  currentAudio.volume = 1;
  currentAudio.loop = true;

  console.log(
    `Запуск ${mediaIndex + 1}:`,
    backgrounds[backgroundIndex],
    sounds[audioIndex],
  );

  drawWheel();
}

/* ====================================================== */
/*                     ОТРИСОВКА                           */
/* ====================================================== */

function drawWheel() {
  const names = getNames();

  const width = canvas.width;
  const height = canvas.height;

  const centerX = width / 2;
  const centerY = height / 2;

  const radius = Math.min(width, height) / 2;

  ctx.clearRect(0, 0, width, height);

  /* ==================================================== */
  /*                 ФОНОВАЯ КАРТИНКА                     */
  /* ==================================================== */

  ctx.save();

  ctx.beginPath();

  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

  ctx.closePath();

  ctx.clip();

  ctx.translate(centerX, centerY);

  /*
    РУЛЕТКА:

        ↻

    КАРТИНКА:

        ↺

    Поэтому здесь MINUS rotation.
  */

  ctx.rotate(-rotation);

  /*
    Делаем изображение квадратом чуть больше колеса.

    Если хочешь, чтобы фон вращался
    быстрее рулетки:

    ctx.rotate(-rotation * 2);

    Но тогда предыдущий ctx.rotate(-rotation)
    нужно заменить, а не добавлять второй.
  */

  const imageSize = radius * 2.85;

  if (
    currentBackground &&
    currentBackground.complete &&
    currentBackground.naturalWidth > 0
  ) {
    ctx.drawImage(
      currentBackground,
      -imageSize / 2,
      -imageSize / 2,
      imageSize,
      imageSize,
    );
  }

  ctx.restore();

  /* ==================================================== */
  /*                    НЕТ ИМЁН                           */
  /* ==================================================== */

  if (names.length === 0) {
    return;
  }

  /* ==================================================== */
  /*                       СЕКТОРА                         */
  /* ==================================================== */

  const arc = (Math.PI * 2) / names.length;

  names.forEach((name, index) => {
    const angle = index * arc + rotation;

    ctx.beginPath();

    ctx.moveTo(centerX, centerY);

    ctx.arc(centerX, centerY, radius, angle, angle + arc);

    ctx.closePath();

    /* прозрачный цвет */

    ctx.fillStyle = colors[index % colors.length] + "66";

    ctx.fill();

    /* границы */

    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";

    ctx.lineWidth = 2;

    ctx.stroke();

    /* текст */

    ctx.save();

    ctx.translate(centerX, centerY);

    ctx.rotate(angle + arc / 2);

    ctx.fillStyle = "#ffffff";

    ctx.font = "20px Arial";

    ctx.textAlign = "right";

    ctx.textBaseline = "middle";

    ctx.fillText(name, radius - 30, 0);

    ctx.restore();
  });

  /* ==================================================== */
  /*                    ЦЕНТР КОЛЕСА                       */
  /* ==================================================== */

  ctx.beginPath();

  ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);

  ctx.fillStyle = "#ffffff";

  ctx.fill();
}

/* ====================================================== */
/*                    ПОБЕДИТЕЛЬ                           */
/* ====================================================== */

function getWinner() {
  const names = getNames();

  if (names.length === 0) {
    return;
  }

  const arc = (Math.PI * 2) / names.length;

  /*
    Стрелка сверху.

    Если у тебя стрелка физически
    находится в другом месте,
    тогда меняется pointerAngle.
  */

  const pointerAngle = Math.PI / 2;

  const fullCircle = Math.PI * 2;

  const normalized =
    (fullCircle - ((rotation + pointerAngle) % fullCircle)) % fullCircle;

  const index = Math.floor(normalized / arc) % names.length;

  const winner = names[index];

  console.log("Выпало:", winner);

  resultDiv.textContent = "Выпало: " + winner;
}

/* ====================================================== */
/*                        EASING                            */
/* ====================================================== */

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/* ====================================================== */
/*                     ОСТАНОВКА AUDIO                      */
/* ====================================================== */

function stopCurrentAudio() {
  if (!currentAudio) {
    return;
  }

  currentAudio.pause();

  currentAudio.currentTime = 0;
}

/* ====================================================== */
/*                      START SPIN                          */
/* ====================================================== */

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

  /* ==================================================== */
  /*            СЛЕДУЮЩАЯ КАРТИНКА + ПЕСНЯ                */
  /* ==================================================== */

  changeMedia();

  /* ==================================================== */
  /*                  МУЗЫКА СТАРТУЕТ                      */
  /* ==================================================== */

  /*
    Это вызывается непосредственно
    после click / mouseup / touchend.

    Поэтому браузер считает это
    пользовательским действием и
    разрешает воспроизведение.
  */

  if (currentAudio) {
    currentAudio.currentTime = 0;

    currentAudio
      .play()
      .then(() => {
        console.log("Музыка запущена:", currentAudio.src);
      })
      .catch((error) => {
        console.error("Браузер не запустил музыку:", error);
      });
  }

  /* ==================================================== */
  /*                ВРЕМЯ 10 - 15 СЕКУНД                  */
  /* ==================================================== */

  const duration = 10000 + Math.random() * 5000;

  console.log("Продолжительность:", (duration / 1000).toFixed(2), "секунд");

  /* ==================================================== */
  /*                 КОЛИЧЕСТВО ОБОРОТОВ                  */
  /* ==================================================== */

  /*
    18 - 26 оборотов.

    Начинает быстро и постепенно
    замедляется.
  */

  const turns = 18 + Math.random() * 8;

  const startRotation = rotation;

  const targetRotation = startRotation + Math.PI * 2 * turns;

  /* ==================================================== */
  /*                 СЧЁТЧИК ВРЕМЕНИ                      */
  /* ==================================================== */

  let elapsed = 0;

  let previousTime = null;

  /* ==================================================== */
  /*                    ANIMATION                          */
  /* ==================================================== */

  function animate(currentTime) {
    /*
      Первый requestAnimationFrame.
    */

    if (previousTime === null) {
      previousTime = currentTime;
    }

    let delta = currentTime - previousTime;

    previousTime = currentTime;

    /*
      ЭТО ВАЖНО ДЛЯ GITHUB PAGES / МОБИЛЬНЫХ / ЛАГОВ.

      Если браузер завис на 2 секунды,
      мы НЕ добавляем сразу эти 2 секунды
      к анимации.

      Один кадр максимум считается
      как 50 ms.
    */

    delta = Math.min(delta, 50);

    elapsed += delta;

    const progress = Math.min(elapsed / duration, 1);

    const easedProgress = easeOutCubic(progress);

    rotation = startRotation + (targetRotation - startRotation) * easedProgress;

    drawWheel();

    /* ================================================== */
    /*                   ПРОДОЛЖАЕМ                        */
    /* ================================================== */

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);

      return;
    }

    /* ================================================== */
    /*                   ФИНИШ                             */
    /* ================================================== */

    rotation = targetRotation;

    spinning = false;

    animationFrame = null;

    drawWheel();

    /*
      Музыка заканчивается
      В ТОТ ЖЕ МОМЕНТ,
      когда остановилась рулетка.
    */

    stopCurrentAudio();

    getWinner();
  }

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  animationFrame = requestAnimationFrame(animate);
}

/* ====================================================== */
/*                       КНОПКА                            */
/* ====================================================== */

spinBtn.addEventListener("click", startSpin);

/* ====================================================== */
/*                 УГОЛ МЫШКИ / ПАЛЬЦА                    */
/* ====================================================== */

function getPointerAngle(event) {
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;

  const scaleY = canvas.height / rect.height;

  const x = (event.clientX - rect.left) * scaleX - canvas.width / 2;

  const y = (event.clientY - rect.top) * scaleY - canvas.height / 2;

  return Math.atan2(y, x);
}

/* ====================================================== */
/*                       MOUSE                             */
/* ====================================================== */

canvas.addEventListener("mousedown", (event) => {
  if (spinning) {
    return;
  }

  isDragging = true;

  lastAngle = getPointerAngle(event);
});

window.addEventListener("mousemove", (event) => {
  if (!isDragging || spinning) {
    return;
  }

  const currentAngle = getPointerAngle(event);

  let delta = currentAngle - lastAngle;

  /*
      Исправляем переход:

      PI -> -PI

      чтобы колесо не совершало
      огромный скачок.
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

window.addEventListener("mouseup", () => {
  if (!isDragging) {
    return;
  }

  isDragging = false;

  startSpin();
});

/* ====================================================== */
/*                       TOUCH                             */
/* ====================================================== */

canvas.addEventListener(
  "touchstart",
  (event) => {
    if (spinning) {
      return;
    }

    event.preventDefault();

    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    isDragging = true;

    lastAngle = getPointerAngle(touch);
  },
  {
    passive: false,
  },
);

canvas.addEventListener(
  "touchmove",
  (event) => {
    if (!isDragging || spinning) {
      return;
    }

    event.preventDefault();

    const touch = event.touches[0];

    if (!touch) {
      return;
    }

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

canvas.addEventListener(
  "touchend",
  (event) => {
    if (!isDragging) {
      return;
    }

    event.preventDefault();

    isDragging = false;

    startSpin();
  },
  {
    passive: false,
  },
);

/* ====================================================== */
/*               ПОВЕДЕНИЕ ПРИ СКРЫТИИ ВКЛАДКИ            */
/* ====================================================== */

/*
  requestAnimationFrame может тормозиться,
  когда вкладка скрыта.

  Поэтому если человек свернул браузер,
  музыку тоже ставим на паузу.

  После возвращения продолжаем.
*/

document.addEventListener("visibilitychange", () => {
  if (!spinning || !currentAudio) {
    return;
  }

  if (document.hidden) {
    currentAudio.pause();

    return;
  }

  currentAudio.play().catch(() => {});
});

/* ====================================================== */
/*                   ПЕРВАЯ ОТРИСОВКА                      */
/* ====================================================== */

drawWheel();
