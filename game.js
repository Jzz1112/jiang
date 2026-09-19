/* ============================================================
 * VALORANT SNAKE · 无畏契约风格贪吃蛇
 * 纯 JavaScript + Canvas 实现，无任何依赖
 * 配色：#0F1923 暗夜蓝 / #FF4655 战术红 / #ECE8E1 象牙白
 * ============================================================ */

(function () {
  "use strict";

  // ---------- 常量 ----------
  var COLS = 20;               // 网格列数
  var ROWS = 20;               // 网格行数
  var CELL = 20;               // 单元格像素
  var BASE_INTERVAL = 150;     // 初始移动间隔（毫秒）
  var MIN_INTERVAL = 60;       // 最快速度
  var SPEED_STEP = 6;          // 每吃一个技能球加快的毫秒数
  var SCORE_PER_FOOD = 10;     // 每个技能球击杀数

  // 主题色
  var C = {
    bg: "#101823",
    gridLine: "rgba(236,232,225,0.04)",
    red: "#ff4655",
    redDark: "#bd3940",
    white: "#ece8e1",
    cyan: "#37c8f0",
    bodyA: "#ff4655",   // 蛇身（战术红）
    bodyB: "#d8404d",   // 蛇身交替色
    head: "#ece8e1"     // 蛇头（象牙白，像发光的特工）
  };

  // ---------- DOM ----------
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("score");
  var highScoreEl = document.getElementById("highScore");
  var speedEl = document.getElementById("speed");
  var overlay = document.getElementById("overlay");
  var overlayTag = document.getElementById("overlayTag");
  var overlayTitle = document.getElementById("overlayTitle");
  var overlayText = document.getElementById("overlayText");
  var overlayBtn = document.getElementById("overlayBtn");

  // ---------- 游戏状态 ----------
  var STATE_READY = "ready";
  var STATE_PLAYING = "playing";
  var STATE_PAUSED = "paused";
  var STATE_OVER = "over";

  var state = STATE_READY;
  var snake = [];              // [{x, y}, ...] 头在 index 0
  var dir = { x: 1, y: 0 };    // 当前方向
  var nextDir = { x: 1, y: 0 };// 缓存下一次的方向（防止一帧内反向）
  var food = { x: 5, y: 5 };
  var score = 0;
  var interval = BASE_INTERVAL;
  var timer = null;
  var animTimer = null;        // 待机/动画帧
  var pulse = 0;               // 技能球脉动相位

  var highScore = 0;
  try {
    highScore = parseInt(localStorage.getItem("valorantSnakeHighScore") || "0", 10) || 0;
  } catch (e) { /* localStorage 不可用时忽略 */ }
  highScoreEl.textContent = highScore;

  // ---------- 简易音效（WebAudio，无需音频文件） ----------
  var audioCtx = null;
  function beep(freq, dur, type) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) { /* 音频不可用时静默 */ }
  }

  // ---------- 工具函数 ----------
  function randomFood() {
    var pos;
    do {
      pos = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS)
      };
    } while (snake.some(function (s) { return s.x === pos.x && s.y === pos.y; }));
    return pos;
  }

  function speedLevel() {
    return Math.floor((BASE_INTERVAL - interval) / 30) + 1;
  }

  function updateHud() {
    scoreEl.textContent = score;
    speedEl.textContent = speedLevel();
    highScoreEl.textContent = highScore;
  }

  // ---------- 游戏流程 ----------
  function reset() {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    interval = BASE_INTERVAL;
    food = randomFood();
    updateHud();
  }

  function start() {
    reset();
    state = STATE_PLAYING;
    overlay.classList.add("hidden");
    clearInterval(timer);
    stopAnim();
    timer = setInterval(tick, interval);
  }

  function pause() {
    if (state !== STATE_PLAYING) return;
    state = STATE_PAUSED;
    clearInterval(timer);
    stopAnim();
    showOverlay("// TACTICAL PAUSE", "战术暂停", false,
      "当前击杀：" + score, "继续作战");
  }

  function resume() {
    if (state !== STATE_PAUSED) return;
    state = STATE_PLAYING;
    overlay.classList.add("hidden");
    timer = setInterval(tick, interval);
  }

  function gameOver() {
    state = STATE_OVER;
    clearInterval(timer);

    if (score > highScore) {
      highScore = score;
      try { localStorage.setItem("valorantSnakeHighScore", String(highScore)); } catch (e) {}
    }
    updateHud();

    var isRecord = score >= highScore && score > 0;
    beep(160, 0.35, "sawtooth");
    showOverlay("// ELIMINATED", "任务失败", true,
      "本局击杀：" + score + (isRecord ? "　★ 新纪录" : "　最佳：" + highScore),
      "重新部署");
  }

  function showOverlay(tag, title, danger, text, btn) {
    overlayTag.textContent = tag;
    overlayTitle.textContent = title;
    overlayTitle.classList.toggle("danger", !!danger);
    overlayText.innerHTML = text;
    overlayBtn.querySelector("span").textContent = btn;
    overlay.classList.remove("hidden");
  }

  // ---------- 核心逻辑：每帧 ----------
  function tick() {
    dir = nextDir;

    var head = {
      x: snake[0].x + dir.x,
      y: snake[0].y + dir.y
    };

    // 撞墙检测
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      gameOver();
      return;
    }

    // 撞自己检测（尾巴这一格即将让出，可以进入）
    var willEat = head.x === food.x && head.y === food.y;
    var body = willEat ? snake : snake.slice(0, -1);
    if (body.some(function (s) { return s.x === head.x && s.y === head.y; })) {
      gameOver();
      return;
    }

    snake.unshift(head);

    if (willEat) {
      score += SCORE_PER_FOOD;
      beep(880, 0.08);
      if (interval > MIN_INTERVAL) {
        interval -= SPEED_STEP;
        clearInterval(timer);
        timer = setInterval(tick, interval); // 提速
      }
      food = randomFood();
      updateHud();
    } else {
      snake.pop();
    }

    draw();
  }

  // ---------- 绘制 ----------
  function draw() {
    // 背景
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 战术网格
    ctx.strokeStyle = C.gridLine;
    ctx.lineWidth = 1;
    for (var i = 1; i < COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, canvas.height);
      ctx.stroke();
    }
    for (var j = 1; j < ROWS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * CELL);
      ctx.lineTo(canvas.width, j * CELL);
      ctx.stroke();
    }

    // 技能球（红色尖刺 spike，带脉动光圈）
    var fx = food.x * CELL + CELL / 2;
    var fy = food.y * CELL + CELL / 2;
    var r = CELL / 2 - 3;

    // 光圈
    ctx.strokeStyle = "rgba(255, 70, 85, " + (0.25 + 0.2 * Math.sin(pulse)) + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fx, fy, r + 4 + Math.sin(pulse) * 1.5, 0, Math.PI * 2);
    ctx.stroke();

    // 尖刺菱形
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(Math.PI / 4 + pulse * 0.3);
    ctx.fillStyle = C.red;
    ctx.fillRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
    ctx.fillStyle = C.white;
    ctx.fillRect(-r * 0.28, -r * 0.28, r * 0.56, r * 0.56); // 中心白芯
    ctx.restore();

    // 蛇身体（战术红，交替色形成节律感）
    for (var k = snake.length - 1; k >= 0; k--) {
      var seg = snake[k];
      var isHead = k === 0;
      ctx.fillStyle = isHead
        ? C.head
        : (k % 2 === 0 ? C.bodyA : C.bodyB);

      var pad = isHead ? 1 : 2;
      var size = CELL - pad * 2;
      angularRect(seg.x * CELL + pad, seg.y * CELL + pad, size, size, isHead ? 3 : 2, isHead);
      ctx.fill();
    }

    // 蛇头：红色战术目镜 + 移动方向指示
    var h = snake[0];
    var ex = h.x * CELL + CELL / 2;
    var ey = h.y * CELL + CELL / 2;
    var off = CELL / 5;

    // 头部红色描边（发光特工感）
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ex, ey, CELL / 2 - 3, 0, Math.PI * 2);
    ctx.stroke();

    // 目镜线条（随移动方向横置/竖置）
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (dir.x !== 0) {
      ctx.moveTo(ex - off * 1.4, ey - off * 0.5);
      ctx.lineTo(ex + off * 0.5, ey - off * 0.5);
      ctx.moveTo(ex - off * 1.4, ey + off * 0.5);
      ctx.lineTo(ex + off * 0.5, ey + off * 0.5);
    } else {
      ctx.moveTo(ex - off * 0.5, ey - off * 1.4);
      ctx.lineTo(ex - off * 0.5, ey + off * 0.5);
      ctx.moveTo(ex + off * 0.5, ey - off * 1.4);
      ctx.lineTo(ex + off * 0.5, ey + off * 0.5);
    }
    ctx.stroke();

    // 准星点（朝向前方）
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.arc(ex + dir.x * (CELL / 3), ey + dir.y * (CELL / 3), 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 斜切角矩形（无畏契约 UI 语言）
  function angularRect(x, y, w, h, cut, head) {
    ctx.beginPath();
    if (head) {
      // 头部：前侧切角
      ctx.moveTo(x + cut, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h - cut);
      ctx.lineTo(x + w - cut, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y + cut);
    } else {
      ctx.moveTo(x + cut, y);
      ctx.lineTo(x + w - cut, y);
      ctx.lineTo(x + w, y + cut);
      ctx.lineTo(x + w, y + h - cut);
      ctx.lineTo(x + w - cut, y + h);
      ctx.lineTo(x + cut, y + h);
      ctx.lineTo(x, y + h - cut);
      ctx.lineTo(x, y + cut);
    }
    ctx.closePath();
  }

  // 待机动画（标题界面时技能球持续脉动）
  function startAnim() {
    stopAnim();
    animTimer = setInterval(function () {
      pulse += 0.15;
      draw();
    }, 50);
  }

  function stopAnim() {
    if (animTimer) { clearInterval(animTimer); animTimer = null; }
  }

  // ---------- 输入：键盘 ----------
  var KEY_DIRS = {
    ArrowUp: { x: 0, y: -1 },  KeyW: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }, KeyS: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, KeyA: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }, KeyD: { x: 1, y: 0 }
  };

  document.addEventListener("keydown", function (e) {
    // 防止方向键/空格滚动页面
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].indexOf(e.code) !== -1) {
      e.preventDefault();
    }

    if (e.code === "Space") {
      if (state === STATE_PLAYING) pause();
      else if (state === STATE_PAUSED) resume();
      return;
    }

    if (e.code === "KeyR") {
      start();
      return;
    }

    var d = KEY_DIRS[e.code];
    if (!d || state !== STATE_PLAYING) return;

    // 不能 180 度掉头
    if (d.x === -dir.x && d.y === -dir.y) return;
    nextDir = d;
  });

  // ---------- 输入：移动端滑动 ----------
  var touchStart = null;

  canvas.addEventListener("touchstart", function (e) {
    var t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  canvas.addEventListener("touchend", function (e) {
    if (!touchStart || state !== STATE_PLAYING) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStart.x;
    var dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return; // 忽略轻点

    var d;
    if (Math.abs(dx) > Math.abs(dy)) {
      d = { x: dx > 0 ? 1 : -1, y: 0 };
    } else {
      d = { x: 0, y: dy > 0 ? 1 : -1 };
    }
    if (d.x === -dir.x && d.y === -dir.y) return;
    nextDir = d;
  }, { passive: true });

  // ---------- 按钮 ----------
  overlayBtn.addEventListener("click", function () {
    if (state === STATE_PAUSED) {
      resume();
    } else {
      start();
    }
  });

  // ---------- 初始化 ----------
  reset();
  draw();
  startAnim();
})();
