// ========================
// COMANDOS
// ========================
// Comandos especiales que se pueden escribir en el editor (ej: "/girar")
// y los hints (mensajes flotantes junto al botón).

import { committedEl, editor, btnCanvas } from "./dom.js";
import { ctx } from "./canvas-button.js";

export const COMANDOS = {
  "/creadores":
    "Creado por <a href='https://agustint96.github.io' target='_blank'>Agustín Tardella</a> y <a href='https://interjuegos.neocities.org/' target='_blank'>Naim Goldraij</a>",
  "/girar": null,
  "/brunomunari": null,
  "/pajarosvolando": null,
  "/penales": null,
  "/ojoporojo": null,
  "/tip": null,
};

// ========================
// /girar
// ========================

function girarTexto() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const cvs = document.createElement("canvas");
  cvs.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
  cvs.width = vw;
  cvs.height = vh;
  document.body.appendChild(cvs);
  const cx = cvs.getContext("2d");

  const words = [];

  function recolectar(nodo) {
    if (nodo.nodeType === Node.TEXT_NODE) {
      const texto = nodo.nodeValue;
      if (!texto || !texto.trim()) return;
      const regex = /\S+/g;
      let match;
      while ((match = regex.exec(texto)) !== null) {
        const range = document.createRange();
        range.setStart(nodo, match.index);
        range.setEnd(nodo, match.index + match[0].length);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0) {
          words.push({
            text: match[0],
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2 + window.scrollY,
            size: rect.height * 0.85,
            delay: Math.random() * 300,
          });
        }
      }
    } else if (
      nodo.nodeType === Node.ELEMENT_NODE &&
      nodo.nodeName !== "SCRIPT" &&
      nodo.nodeName !== "STYLE"
    ) {
      Array.from(nodo.childNodes).forEach(recolectar);
    }
  }

  recolectar(committedEl);
  recolectar(editor);

  if (!words.length) {
    cvs.remove();
    return;
  }

  committedEl.style.visibility = "hidden";
  editor.style.visibility = "hidden";

  const VUELTAS = 3;
  const DURACION = 2000;
  const startTs = performance.now();
  let animId;

  function loop(ts) {
    const elapsed = ts - startTs;
    const scrollY = window.scrollY;
    cx.clearRect(0, 0, vw, vh);

    let todas_listas = true;

    words.forEach((w) => {
      const t = Math.max(0, elapsed - w.delay);
      const progress = Math.min(t / DURACION, 1);
      if (progress < 1) todas_listas = false;

      const screenY = w.y - scrollY;
      if (screenY < -100 || screenY > vh + 100) return;

      const ease =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;

      const angle = ease * Math.PI * 2 * VUELTAS;

      cx.save();
      cx.translate(w.x, screenY);
      cx.rotate(angle);
      cx.font = `${w.size}px system-ui, sans-serif`;
      cx.fillStyle = "#000";
      cx.textAlign = "center";
      cx.textBaseline = "middle";
      cx.fillText(w.text, 0, 0);
      cx.restore();
    });

    if (!todas_listas || elapsed < DURACION + 300) {
      animId = requestAnimationFrame(loop);
    } else {
      committedEl.style.visibility = "";
      editor.style.visibility = "";
      cvs.remove();
    }
  }

  animId = requestAnimationFrame(loop);
}

// ========================
// /brunomunari
// ========================

function mostrarBrunoMunari() {
  const S = btnCanvas.width;
  const ctx2d = ctx;
  const sc = S / 500;

  if (btnCanvas._munariAnimId) {
    cancelAnimationFrame(btnCanvas._munariAnimId);
    btnCanvas._munariAnimId = null;
  }
  if (btnCanvas._munariCleanup) {
    btnCanvas._munariCleanup();
    btnCanvas._munariCleanup = null;
  }

  const isMobileDevice = "ontouchstart" in window || window.innerWidth < 768;
  let mouseRelY = S / 2;
  let mouseAbsX = window.innerWidth / 2;

  if (!isMobileDevice) {
    function onMouseMove(e) {
      const rect = btnCanvas.getBoundingClientRect();
      const relY = e.clientY - rect.top;
      mouseRelY = Math.max(0, Math.min(S, relY));
      mouseAbsX = e.clientX;
    }
    document.addEventListener("mousemove", onMouseMove);
    btnCanvas._munariCleanup = () =>
      document.removeEventListener("mousemove", onMouseMove);
  } else {
    let initialScrollY = window.scrollY;
    const maxScrollRange = 300;
    function updateFromScroll() {
      const delta = window.scrollY - initialScrollY;
      const clamped = Math.max(
        -maxScrollRange,
        Math.min(maxScrollRange, delta),
      );
      mouseRelY = ((clamped + maxScrollRange) / (2 * maxScrollRange)) * S;
      mouseAbsX = window.innerWidth / 2;
    }
    window.addEventListener("scroll", updateFromScroll);
    btnCanvas._munariCleanup = () =>
      window.removeEventListener("scroll", updateFromScroll);
  }

  function drawMunari() {
    ctx2d.clearRect(0, 0, S, S);
    ctx2d.fillStyle = "#dcdcdc";
    ctx2d.fillRect(0, 0, S, S);
    ctx2d.strokeStyle = "#000";
    ctx2d.lineWidth = 5 * sc;
    ctx2d.lineCap = "round";

    function line(x1, y1, x2, y2) {
      ctx2d.beginPath();
      ctx2d.moveTo(x1 * sc, y1 * sc);
      ctx2d.lineTo(x2 * sc, y2 * sc);
      ctx2d.stroke();
    }

    [50, 150, 250, 350, 450].forEach((x) => line(x, 50, x, 450));
    [50, 150, 250, 350, 450].forEach((y) => line(50, y, 450, y));
    line(50, 150, 150, 50);
    line(150, 50, 250, 150);
    line(250, 150, 350, 50);
    line(350, 50, 450, 150);
    line(150, 250, 250, 350);
    line(250, 350, 350, 250);
    line(150, 400, 350, 400);

    const t = mouseRelY / S;
    const clampedY = 70 + t * (250 - 70);

    const rect = btnCanvas.getBoundingClientRect();
    const panelCenterX = rect.left + rect.width / 2;
    const rawX = (mouseAbsX - panelCenterX) / (rect.width * 4);
    const clampedX = Math.max(-1, Math.min(1, rawX));
    const DEAD_ZONE = 0.15;

    function eyePos(colX) {
      if (clampedY < 150) return { x: colX * sc, y: clampedY * sc };
      if (Math.abs(clampedX) < DEAD_ZONE)
        return { x: colX * sc, y: clampedY * sc };
      const tX = Math.min(
        1,
        (Math.abs(clampedX) - DEAD_ZONE) / (1 - DEAD_ZONE),
      );
      const goingLeft = clampedX < 0;
      const xMin = colX === 150 ? 70 : 260;
      const xMax = colX === 150 ? 240 : 430;
      const ex = colX + tX * ((goingLeft ? xMin : xMax) - colX);
      return { x: ex * sc, y: 150 * sc };
    }

    const leftEye = eyePos(150);
    const rightEye = eyePos(350);

    ctx2d.fillStyle = "#000";
    ctx2d.beginPath();
    ctx2d.arc(leftEye.x, leftEye.y, 15 * sc, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.arc(rightEye.x, rightEye.y, 15 * sc, 0, Math.PI * 2);
    ctx2d.fill();

    btnCanvas._munariAnimId = requestAnimationFrame(drawMunari);
  }

  drawMunari();
}

// ========================
// /pajarosvolando
// ========================

function pajarosVolando() {
  const vSpans = [];

  function envolverVs(nodo) {
    if (nodo.nodeType === Node.TEXT_NODE) {
      const texto = nodo.nodeValue;
      if (!texto || !/[vV]/.test(texto)) return;
      const frag = document.createDocumentFragment();
      for (const char of texto) {
        if (char === "v" || char === "V") {
          const span = document.createElement("span");
          span.className = "pajaro-v";
          span.textContent = char;
          frag.appendChild(span);
          vSpans.push(span);
        } else {
          frag.appendChild(document.createTextNode(char));
        }
      }
      nodo.parentNode.replaceChild(frag, nodo);
    } else if (
      nodo.nodeType === Node.ELEMENT_NODE &&
      nodo.nodeName !== "SCRIPT" &&
      nodo.nodeName !== "STYLE"
    ) {
      Array.from(nodo.childNodes).forEach(envolverVs);
    }
  }

  envolverVs(committedEl);

  if (!vSpans.length) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  vSpans.forEach((span) => {
    span.style.visibility = "hidden";
  });

  const cvs = document.createElement("canvas");
  cvs.style.cssText =
    "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;";
  cvs.width = vw;
  cvs.height = vh;
  document.body.appendChild(cvs);
  const cx = cvs.getContext("2d");

  const DURATION = 20000;
  const startTs = performance.now();

  const birds = [];
  const launched = new Set();

  function getGatherPoint() {
    return {
      gx: vw * 0.62 + (Math.random() - 0.5) * vw * 0.12,
      gy: vh * 0.3 + (Math.random() - 0.5) * vh * 0.1,
    };
  }

  const BIRD_COLORS = [
    "#eeebeb",
    "#eeebeb",
    "#eeebeb",
    "#eeebeb",
    "#eeebeb",
    "#eeebeb",
    "#eeebeb",
    "#eeebeb",
    "#eeebeb",
    "#eeebeb",
  ];
  let birdColorIndex = 0;

  function makeBird(span, gx, gy, groupDelay) {
    const rect = span.getBoundingClientRect();
    const bgColor = BIRD_COLORS[birdColorIndex % BIRD_COLORS.length];
    birdColorIndex++;
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      vx: 0,
      vy: 0,
      gx: gx + (Math.random() - 0.5) * 60,
      gy: gy + (Math.random() - 0.5) * 30,
      flapOffset: Math.random() * Math.PI * 2,
      flapSpeed: 170 + Math.random() * 60,
      size: 11 + Math.random() * 5,
      t: 0,
      delay: groupDelay + Math.random() * 80,
      phase: "gather",
      bgColor,
    };
  }

  function launchGroup(spans) {
    const { gx, gy } = getGatherPoint();
    spans.forEach((span, i) => {
      launched.add(span);
      observer.unobserve(span);
      birds.push(makeBird(span, gx, gy, i * 30));
    });
  }

  let pendingGroup = [];
  let groupTimer = null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !launched.has(entry.target)) {
          pendingGroup.push(entry.target);
        }
      });
      if (pendingGroup.length > 0) {
        clearTimeout(groupTimer);
        groupTimer = setTimeout(() => {
          if (pendingGroup.length > 0) {
            launchGroup(pendingGroup);
            pendingGroup = [];
          }
        }, 80);
      }
    },
    { threshold: 0.1, rootMargin: "0px" },
  );

  vSpans.forEach((span) => observer.observe(span));

  function cleanup() {
    observer.disconnect();
    clearTimeout(groupTimer);
    cancelAnimationFrame(animId);
    cvs.remove();
    vSpans.forEach((span) => {
      span.style.visibility = "";
      const txt = document.createTextNode(span.textContent);
      if (span.parentNode) span.parentNode.replaceChild(txt, span);
    });
    committedEl.normalize();
  }

  let lastTs = null;
  let animId;

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(ts - lastTs, 50);
    lastTs = ts;
    const elapsed = ts - startTs;

    cx.clearRect(0, 0, cvs.width, cvs.height);

    birds.forEach((b) => {
      if (b.phase === "done") return;
      if (elapsed < b.delay) return;

      b.t += dt;

      if (b.phase === "gather") {
        const dx = b.gx - b.x;
        const dy = b.gy - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 6) {
          b.phase = "flock";
        } else {
          const accel = Math.min(1, b.t / 350);
          b.vx += (dx / dist) * 0.4 * accel;
          b.vy += (dy / dist) * 0.4 * accel;
          const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          const maxSpd = 3.8;
          if (spd > maxSpd) {
            b.vx = (b.vx / spd) * maxSpd;
            b.vy = (b.vy / spd) * maxSpd;
          }
          b.x += b.vx;
          b.y += b.vy;
        }
      } else if (b.phase === "flock") {
        const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.01;
        const targetVx = Math.cos(angle) * 4;
        const targetVy = Math.sin(angle) * 4;
        b.vx += (targetVx - b.vx) * 0.06;
        b.vy += (targetVy - b.vy) * 0.06;
        b.x += b.vx;
        b.y += b.vy;
        if (b.x > cvs.width + 60 || b.y < -60) b.phase = "done";
      }

      if (b.phase === "done") return;

      const flap = Math.sin(b.t / b.flapSpeed + b.flapOffset);
      const flapR = Math.sin(b.t / b.flapSpeed + b.flapOffset + 0.3);
      const ws = b.size;

      const angle = Math.atan2(b.vy, b.vx) || -Math.PI / 4;

      cx.save();
      cx.translate(b.x, b.y);
      cx.rotate(angle);

      const rw = ws * 1.6;
      const rh = ws * 0.9;
      cx.beginPath();
      cx.roundRect(-rw / 2, -rh / 2, rw, rh, 2);
      cx.fillStyle = b.bgColor;
      cx.fill();
      cx.strokeStyle = "rgba(0,0,0,0.18)";
      cx.lineWidth = 0.7;
      cx.stroke();

      cx.restore();

      cx.save();
      cx.strokeStyle = "rgb(20,18,12)";
      cx.lineWidth = 1.5;
      cx.lineCap = "round";
      cx.beginPath();
      cx.moveTo(b.x - ws * 0.5, b.y - ws * 0.38 * (0.5 + 0.5 * flap));
      cx.quadraticCurveTo(b.x - ws * 0.12, b.y - 1, b.x, b.y);
      cx.quadraticCurveTo(
        b.x + ws * 0.12,
        b.y - 1,
        b.x + ws * 0.5,
        b.y - ws * 0.38 * (0.5 + 0.5 * flapR),
      );
      cx.stroke();
      cx.restore();
    });

    if (elapsed >= DURATION) {
      cleanup();
      return;
    }

    animId = requestAnimationFrame(loop);
  }

  animId = requestAnimationFrame(loop);
}

// ========================
// /penales
// ========================

function superPenales86() {
  if (btnCanvas._munariAnimId) {
    cancelAnimationFrame(btnCanvas._munariAnimId);
    btnCanvas._munariAnimId = null;
  }
  if (btnCanvas._munariCleanup) {
    btnCanvas._munariCleanup();
    btnCanvas._munariCleanup = null;
  }
  if (btnCanvas._penalesAnimId) {
    cancelAnimationFrame(btnCanvas._penalesAnimId);
    btnCanvas._penalesAnimId = null;
  }

  const cx = ctx;
  const S = btnCanvas.width;

  const SKY = "#1a1a3e";
  const GRASS = "#2d8a3e";
  const GRASS_DARK = "#256e32";
  const GOAL_WHITE = "#ffffff";
  const GOAL_SHADOW = "#cfcfcf";
  const NET = "rgba(255,255,255,0.35)";
  const BALL_WHITE = "#ffffff";
  const BALL_BLACK = "#222222";
  const KEEPER_SHIRT = "#ff2e63";
  const KEEPER_SKIN = "#f2c29a";
  const KEEPER_SHORTS = "#1a1330";
  const SCANLINE = "rgba(0,0,0,0.12)";

  const W = S,
    H = S;
  let score = 0;
  let shotNum = 1;
  const MAX_SHOTS = 5;
  let canShoot = true;
  let results = [];
  let gameOver = false;

  const goal = { x: W * 0.09, y: H * 0.18, w: W * 0.82, h: H * 0.3 };
  const ballStart = { x: W / 2, y: H * 0.87 };
  let ball = { x: ballStart.x, y: ballStart.y, r: W * 0.04 };

  const KEEPER_HOME_X = W / 2;
  const KEEPER_HOME_Y = goal.y + goal.h - H * 0.06;
  const KW = W * 0.14,
    KH = H * 0.18;
  let keeper = {
    x: KEEPER_HOME_X,
    y: KEEPER_HOME_Y,
    w: KW,
    h: KH,
    diving: false,
    diveProgress: 0,
    startX: KEEPER_HOME_X,
    startY: KEEPER_HOME_Y,
    endX: KEEPER_HOME_X,
    endY: KEEPER_HOME_Y,
    diveDir: 0,
    reaching: false,
  };

  function getZones() {
    const cols = 3,
      rows = 2;
    const zw = goal.w / cols,
      zh = goal.h / rows;
    return Array.from({ length: rows * cols }, (_, i) => {
      const r = Math.floor(i / cols),
        c = i % cols;
      return {
        x: goal.x + c * zw,
        y: goal.y + r * zh,
        w: zw,
        h: zh,
        col: c,
        row: r,
      };
    });
  }
  const ZONES = getZones();

  function zoneAt(px, py) {
    return (
      ZONES.find(
        (z) => px >= z.x && px < z.x + z.w && py >= z.y && py < z.y + z.h,
      ) || null
    );
  }

  function rect(x, y, w, h, color) {
    cx.fillStyle = color;
    cx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawField() {
    rect(0, 0, W, goal.y + goal.h + H * 0.07, SKY);
    cx.fillStyle = "#ffe93b";
    for (let i = 0; i < 10; i++) {
      const sx = (i * 47) % W,
        sy = (i * 23) % (goal.y - 2);
      cx.fillRect(sx, sy, 1, 1);
    }
    rect(
      0,
      goal.y + goal.h + H * 0.07,
      W,
      H - (goal.y + goal.h + H * 0.07),
      GRASS,
    );
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0)
        rect(
          i * (W / 8),
          goal.y + goal.h + H * 0.07,
          W / 8,
          H - (goal.y + goal.h + H * 0.07),
          GRASS_DARK,
        );
    }
    rect(W / 2 - 1, ballStart.y + 3, 2, 2, "#ffffff");
  }

  function drawGoal() {
    const postW = Math.max(2, W * 0.02);
    cx.strokeStyle = NET;
    cx.lineWidth = 0.5;
    for (let i = -goal.h; i < goal.w; i += 6) {
      cx.beginPath();
      cx.moveTo(goal.x + i, goal.y);
      cx.lineTo(goal.x + i + goal.h, goal.y + goal.h);
      cx.stroke();
    }
    for (let i = 0; i < goal.w + goal.h; i += 6) {
      cx.beginPath();
      cx.moveTo(goal.x + i, goal.y);
      cx.lineTo(goal.x + i - goal.h, goal.y + goal.h);
      cx.stroke();
    }
    rect(goal.x - postW, goal.y - postW, postW, goal.h + postW, GOAL_SHADOW);
    rect(goal.x, goal.y - postW, goal.w, postW, GOAL_SHADOW);
    rect(goal.x + goal.w, goal.y - postW, postW, goal.h + postW, GOAL_SHADOW);
    rect(
      goal.x - postW,
      goal.y - postW * 1.5,
      postW + goal.w + postW,
      postW,
      GOAL_WHITE,
    );
    rect(
      goal.x - postW,
      goal.y - postW * 1.5,
      postW,
      goal.h + postW * 1.5,
      GOAL_WHITE,
    );
    rect(
      goal.x + goal.w,
      goal.y - postW * 1.5,
      postW,
      goal.h + postW * 1.5,
      GOAL_WHITE,
    );
  }

  function drawKeeper() {
    const w = keeper.w,
      h = keeper.h;
    let kx = keeper.startX,
      ky = keeper.startY,
      rotate = 0;
    if (keeper.diving) {
      const p = keeper.diveProgress;
      kx = keeper.startX + (keeper.endX - keeper.startX) * p;
      ky = keeper.startY + (keeper.endY - keeper.startY) * p;
      rotate = keeper.diveDir * p * 0.9;
    }
    cx.save();
    cx.translate(kx, ky);
    cx.rotate(rotate);
    rect(-w / 2, h * 0.18, w, h * 0.47, KEEPER_SHORTS);
    rect(-w / 2, -h / 2, w, h / 2 + h * 0.18, KEEPER_SHIRT);
    const p2 = keeper.diving ? keeper.diveProgress : 0;
    if (keeper.reaching) {
      const armH = h * 0.24 + p2 * h * 0.35;
      rect(
        -w / 2 - w * 0.08,
        -h / 2 - armH,
        w * 0.23,
        armH + h * 0.12,
        KEEPER_SHIRT,
      );
      rect(
        w / 2 - w * 0.15,
        -h / 2 - armH,
        w * 0.23,
        armH + h * 0.12,
        KEEPER_SHIRT,
      );
    } else if (keeper.diving) {
      rect(
        -w / 2 - w * 0.38,
        -h / 2 - h * 0.12,
        w * 0.38,
        h * 0.24,
        KEEPER_SHIRT,
      );
      rect(w / 2, -h / 2 - h * 0.12, w * 0.38, h * 0.24, KEEPER_SHIRT);
    } else {
      rect(
        -w / 2 - w * 0.23,
        -h / 2 + h * 0.06,
        w * 0.23,
        h * 0.41,
        KEEPER_SHIRT,
      );
      rect(w / 2, -h / 2 + h * 0.06, w * 0.23, h * 0.41, KEEPER_SHIRT);
    }
    rect(-w * 0.27, -h / 2 - h * 0.35, w * 0.54, h * 0.35, KEEPER_SKIN);
    rect(-w * 0.27, -h / 2 - h * 0.41, w * 0.54, h * 0.12, "#222222");
    rect(-w / 2 + w * 0.08, h / 2 - h * 0.24, w * 0.3, h * 0.35, KEEPER_SKIN);
    rect(w / 2 - w * 0.38, h / 2 - h * 0.24, w * 0.3, h * 0.35, KEEPER_SKIN);
    cx.restore();
  }

  function drawBall() {
    cx.save();
    cx.translate(ball.x, ball.y);
    cx.fillStyle = "rgba(0,0,0,0.25)";
    cx.beginPath();
    cx.ellipse(0, ball.r + 1, ball.r * 1.1, ball.r * 0.4, 0, 0, Math.PI * 2);
    cx.fill();
    cx.fillStyle = BALL_WHITE;
    cx.beginPath();
    cx.arc(0, 0, ball.r, 0, Math.PI * 2);
    cx.fill();
    cx.fillStyle = BALL_BLACK;
    cx.beginPath();
    cx.arc(-ball.r * 0.17, -ball.r * 0.17, ball.r * 0.27, 0, Math.PI * 2);
    cx.fill();
    cx.beginPath();
    cx.arc(ball.r * 0.33, ball.r * 0.33, ball.r * 0.2, 0, Math.PI * 2);
    cx.fill();
    cx.restore();
  }

  function drawScanlines() {
    cx.fillStyle = SCANLINE;
    for (let y = 0; y < H; y += 3) cx.fillRect(0, y, W, 1);
  }

  function drawScore() {
    const px = Math.round(W * 0.09);
    const gap = Math.round(W * 0.03);
    const totalW = MAX_SHOTS * px + (MAX_SHOTS - 1) * gap;
    const startX = Math.round((W - totalW) / 2);
    const startY = Math.round(H * 0.02);
    for (let i = 0; i < MAX_SHOTS; i++) {
      const x = startX + i * (px + gap);
      cx.fillStyle =
        i < results.length
          ? results[i] === "gol"
            ? "#39ff14"
            : "#ff2e63"
          : "#2a2040";
      cx.fillRect(x, startY, px, px);
      cx.fillStyle =
        i < results.length
          ? results[i] === "gol"
            ? "#1a7a00"
            : "#8a0020"
          : "#4ecdc4";
      cx.fillRect(x, startY, px, 1);
      cx.fillRect(x, startY, 1, px);
      cx.fillRect(x + px - 1, startY, 1, px);
      cx.fillRect(x, startY + px - 1, px, 1);
    }
  }

  function render() {
    drawField();
    drawGoal();
    drawKeeper();
    drawBall();
    drawScanlines();
    drawScore();
  }

  let currentTargetZone = null;
  function animateShot(targetZone) {
    currentTargetZone = targetZone;
    canShoot = false;
    const ballTarget = {
      x: targetZone.x + targetZone.w / 2,
      y: targetZone.y + targetZone.h / 2,
    };
    const startX = ball.x,
      startY = ball.y;
    const duration = 500;
    const startTime = performance.now();

    const diveCol = Math.floor(Math.random() * 3);
    const diveZone = ZONES.find(
      (z) =>
        z.col === diveCol &&
        (diveCol === 1 ? z.row === targetZone.row : z.row === 1),
    );
    keeper.startX = KEEPER_HOME_X;
    keeper.startY = KEEPER_HOME_Y;

    if (diveZone.col === 1) {
      keeper.endX = KEEPER_HOME_X;
      if (targetZone.row === 0) {
        keeper.endY = Math.max(goal.y + diveZone.h / 2, goal.y + H * 0.05);
        keeper.reaching = true;
      } else {
        keeper.endY = KEEPER_HOME_Y;
        keeper.reaching = false;
      }
    } else {
      keeper.endX = diveZone.x + diveZone.w / 2;
      keeper.endY = KEEPER_HOME_Y;
      keeper.reaching = false;
    }

    keeper.diving = true;
    keeper.diveDir = diveZone.col < 1 ? -1 : diveZone.col > 1 ? 1 : 0;
    keeper.diveProgress = 0;

    function step(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      ball.x = startX + (ballTarget.x - startX) * ease;
      ball.y = startY + (ballTarget.y - startY) * ease;
      keeper.diveProgress = Math.min(t * 1.25, 1);
      render();
      if (t < 1) {
        btnCanvas._penalesAnimId = requestAnimationFrame(step);
      } else {
        resolveShot(diveZone);
      }
    }
    btnCanvas._penalesAnimId = requestAnimationFrame(step);
  }

  function resolveShot(diveZone) {
    const tz = currentTargetZone;
    let saved;
    if (diveZone.col === 1) {
      saved = tz.col === 1 && diveZone.row === tz.row;
    } else {
      saved = diveZone.col === tz.col;
    }

    results.push(saved ? "atajada" : "gol");
    if (!saved) score++;
    render();
    setTimeout(nextShot, 1000);
  }

  function nextShot() {
    shotNum++;
    if (shotNum > MAX_SHOTS) {
      endGame();
      return;
    }
    resetBallAndKeeper();
  }

  function resetBallAndKeeper() {
    ball.x = ballStart.x;
    ball.y = ballStart.y;
    Object.assign(keeper, {
      startX: KEEPER_HOME_X,
      startY: KEEPER_HOME_Y,
      endX: KEEPER_HOME_X,
      endY: KEEPER_HOME_Y,
      diving: false,
      diveProgress: 0,
      diveDir: 0,
      reaching: false,
    });
    canShoot = true;
    render();
  }

  function endGame() {
    gameOver = true;
    const won = score >= 3;
    setTimeout(() => {
      render();
      cx.fillStyle = "rgba(15,10,30,0.72)";
      cx.fillRect(0, H * 0.3, W, H * 0.38);
      cx.fillStyle = won ? "#39ff14" : "#ff2e63";
      cx.font = `bold ${Math.round(W * 0.13)}px "Courier New", monospace`;
      cx.textAlign = "center";
      cx.textBaseline = "middle";
      cx.fillText(won ? "Ganaste!" : "Perdiste!", W / 2, H * 0.44);
      cx.fillStyle = "#ffe93b";
      cx.font = `${Math.round(W * 0.09)}px "Courier New", monospace`;
      cx.fillText(`${score}/${MAX_SHOTS}`, W / 2, H * 0.58);
    }, 100);

    setTimeout(() => {
      btnCanvas._penalesAnimId = null;
      gameOver = false;
      btnCanvas.removeEventListener("click", handleClick);
      btnCanvas.removeEventListener("touchend", handleTouch);
      import("./canvas-button.js").then(({ setCanvasImage }) => {
        setCanvasImage(false);
      });
    }, 2500);
  }

  function getCoordsFromEvent(e) {
    const r = btnCanvas.getBoundingClientRect();
    const scaleX = S / r.width,
      scaleY = S / r.height;
    if (e.touches || e.changedTouches) {
      const t = e.touches[0] || e.changedTouches[0];
      return {
        x: (t.clientX - r.left) * scaleX,
        y: (t.clientY - r.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - r.left) * scaleX,
      y: (e.clientY - r.top) * scaleY,
    };
  }

  function handleClick(e) {
    if (!canShoot || gameOver) return;
    e.stopPropagation();
    const { x, y } = getCoordsFromEvent(e);
    const zone = zoneAt(x, y);
    if (zone) animateShot(zone);
  }

  function handleTouch(e) {
    if (!canShoot || gameOver) return;
    e.preventDefault();
    e.stopPropagation();
    const { x, y } = getCoordsFromEvent(e);
    const zone = zoneAt(x, y);
    if (zone) animateShot(zone);
  }

  btnCanvas.addEventListener("click", handleClick);
  btnCanvas.addEventListener("touchend", handleTouch, { passive: false });

  render();
}

// ========================
// /ojoporojo
// ========================

function ojoPoroJo() {
  if (btnCanvas._munariAnimId) {
    cancelAnimationFrame(btnCanvas._munariAnimId);
    btnCanvas._munariAnimId = null;
  }
  if (btnCanvas._munariCleanup) {
    btnCanvas._munariCleanup();
    btnCanvas._munariCleanup = null;
  }
  if (btnCanvas._penalesAnimId) {
    cancelAnimationFrame(btnCanvas._penalesAnimId);
    btnCanvas._penalesAnimId = null;
  }

  const page = document.getElementById("page");
  const status = document.getElementById("status");
  const hint = document.getElementById("btn-hint");
  [page, status, hint].forEach((el) => {
    if (el) el.style.filter = "blur(6px)";
  });

  const img = new Image();
  img.onload = () => {
    const w = btnCanvas.width;
    const h = btnCanvas.height;
    const canvasCtx = btnCanvas.getContext("2d");
    canvasCtx.clearRect(0, 0, w, h);
    canvasCtx.drawImage(img, 0, 0, w, h);
  };
  img.src = "img/lenteporlente.png";

  function quitarBlur() {
    [page, status, hint].forEach((el) => {
      if (el) el.style.filter = "";
    });
    import("./canvas-button.js").then(({ setCanvasImage }) => {
      setCanvasImage(false);
    });
    btnCanvas.removeEventListener("click", quitarBlur);
    btnCanvas.removeEventListener("touchend", quitarBlur);
  }

  btnCanvas.addEventListener("click", quitarBlur);
  btnCanvas.addEventListener("touchend", quitarBlur, { passive: true });
}

// ========================
// HINTS
// ========================

export function mostrarHintPersonalizado(texto) {
  const hintEl = document.getElementById("btn-hint");
  const hintText = document.getElementById("btn-hint-text");

  hintEl.style.display = "";
  hintEl.style.pointerEvents = "auto";
  hintEl.classList.remove("hint-visible", "hint-hiding");

  setTimeout(() => {
    hintText.innerHTML = texto;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        hintEl.classList.add("hint-visible");
      });
    });

    setTimeout(() => {
      hintEl.classList.add("hint-hiding");
      hintEl.classList.remove("hint-visible");
      setTimeout(() => {
        hintEl.classList.remove("hint-hiding");
        hintEl.style.pointerEvents = "";
      }, 400);
    }, 4000);
  }, 50);
}

export function mostrarHint() {
  const hintEl = document.getElementById("btn-hint");
  const hintText = document.getElementById("btn-hint-text");
  const esMobile = "ontouchstart" in window || window.innerWidth < 768;

  const textoFinal = esMobile
    ? "Para escribir y guardar tu mensaje presioná la imagen&nbsp;→"
    : 'Para guardar tu mensaje presioná <span class="hint-keys"><kbd>Shift</kbd><span class="hint-plus">+</span><kbd>Enter</kbd></span> o la imagen&nbsp;→';

  const secuencia = [
    "En este sitio podés compartir lo que quieras.",
    "Solo se registran fecha y contenido del mensaje.",
    "Todos los mensajes quedan guardados y no se pueden borrar.",
    textoFinal,
  ];

  let paso = 0;

  function mostrarPaso() {
    if (paso > 0) {
      hintEl.classList.add("hint-hiding");
      hintEl.classList.remove("hint-visible");
    }

    const delay = paso === 0 ? 0 : 400;
    setTimeout(() => {
      hintText.innerHTML = secuencia[paso];
      hintEl.classList.remove("hint-hiding");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          hintEl.classList.add("hint-visible");
        });
      });

      paso++;

      if (paso < secuencia.length) {
        setTimeout(mostrarPaso, 4000);
      } else {
        setTimeout(() => {
          hintEl.classList.add("hint-hiding");
          hintEl.classList.remove("hint-visible");
          setTimeout(() => {
            hintEl.style.display = "none";
            window.dispatchEvent(new CustomEvent("btn-hint-finished"));
          }, 400);
        }, 10000);
      }
    }, delay);
  }

  mostrarPaso();
}

// ========================
// /tip
// ========================

const TIP_COMANDOS = [
  "/girar",
  "/brunomunari",
  "/pajarosvolando",
  "/penales",
  "/ojoporojo",
];
const TIP_KEY = "naim_tip_index";

function mostrarTip() {
  const idx =
    parseInt(localStorage.getItem(TIP_KEY) ?? "0", 10) % TIP_COMANDOS.length;
  const cmd = TIP_COMANDOS[idx];
  localStorage.setItem(TIP_KEY, String((idx + 1) % TIP_COMANDOS.length));
  mostrarHintPersonalizado(`Probá <span style="color:#7b1fa2">${cmd}</span>`);
}

// ========================
// DESPACHO DE COMANDOS
// ========================

export function ejecutarComando(mensajeLimpio) {
  if (!(mensajeLimpio in COMANDOS)) return false;

  if (mensajeLimpio === "/girar") {
    girarTexto();
  } else if (mensajeLimpio === "/brunomunari") {
    mostrarBrunoMunari();
  } else if (mensajeLimpio === "/pajarosvolando") {
    pajarosVolando();
  } else if (mensajeLimpio === "/penales") {
    superPenales86();
  } else if (mensajeLimpio === "/ojoporojo") {
    ojoPoroJo();
  } else if (mensajeLimpio === "/tip") {
    mostrarTip();
  } else if (COMANDOS[mensajeLimpio]) {
    mostrarHintPersonalizado(COMANDOS[mensajeLimpio]);
  }

  return true;
}
