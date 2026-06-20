// ========================
// CANVAS BUTTON
// ========================
// Sistema de imágenes random del botón circular y su dibujo en canvas.

import { btnCanvas } from "./dom.js";

export const ctx = btnCanvas.getContext("2d");

const CANVAS_IMAGES = [
  "img/008000.PNG",
  "img/Qualquer_Coisa.jpg",
  "img/YMOCOVER.jpeg",
  "img/allplastic.PNG",
  "img/baldio.png",
  "img/bart.PNG",
  "img/bart2.PNG",
  "img/boca.jpg",
  "img/cafe.jpg",
  "img/capusotto.PNG",
  "img/chispas.png",
  "img/chispi.PNG",
  "img/chocolino.png",
  "img/compu.jpg",
  "img/cosa.PNG",
  "img/delavega.png",
  "img/dragon.PNG",
  "img/duendes.jpg",
  "img/enano.PNG",
  "img/enano2.PNG",
  "img/existenz.jpg",
  "img/felipe.jpg",
  "img/flor.jpg",
  "img/flores.jpg",
  "img/gato.PNG",
  "img/gatoabeja.JPG",
  "img/gatoblanco.png",
  "img/gatopc.jpg",
  "img/girasol.png",
  "img/godzilla.jpg",
  "img/guaso.jpg",
  "img/icon.jpg",
  "img/jirafa.png",
  "img/kufi.png",
  "img/leon.PNG",
  "img/maiz.png",
  "img/minion.JPG",
  "img/okapi.jpg",
  "img/osito.png",
  "img/pantera.jpg",
  "img/pikacho.png",
  "img/rinoceronte.PNG",
  "img/santaolalla.png",
  "img/sapos.png",
  "img/sms_of_death.jpg",
  "img/vaca.PNG",
  "img/ventana.png",
  "img/vibra.JPG",
  "img/wachin.jpg",
  "img/zorritos.jpg",
  "img/francellayfatiga.png",
  "img/bob.gif",
];

const CANVAS_IMAGE_KEY = "naim_canvas_image_index";
let currentCanvasImageIndex = -1;
let canvasImagesLoaded = {};
let _gifAnimId = null;

// Contenedor oculto para GIFs
const _gifHolder = document.createElement("div");
_gifHolder.style.cssText =
  "position:fixed;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;";
document.body.appendChild(_gifHolder);

function isGif(src) {
  return src.toLowerCase().endsWith(".gif");
}

function stopGifLoop() {
  if (_gifAnimId !== null) {
    cancelAnimationFrame(_gifAnimId);
    _gifAnimId = null;
  }
  _gifHolder.innerHTML = "";
}

function startGifLoop(src) {
  stopGifLoop();

  const liveImg = document.createElement("img");
  liveImg.src = src;
  liveImg.style.cssText = `width:${btnCanvas.width}px;height:${btnCanvas.height}px;`;
  _gifHolder.appendChild(liveImg);

  const w = btnCanvas.width;
  const h = btnCanvas.height;

  function frame() {
    if (liveImg.complete && liveImg.naturalWidth > 0) {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(liveImg, 0, 0, w, h);
    }
    _gifAnimId = requestAnimationFrame(frame);
  }

  _gifAnimId = requestAnimationFrame(frame);
}

function loadCanvasImage(src) {
  if (canvasImagesLoaded[src]) return Promise.resolve(canvasImagesLoaded[src]);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      canvasImagesLoaded[src] = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCanvasImage(img, src) {
  const w = btnCanvas.width;
  const h = btnCanvas.height;

  stopGifLoop();

  if (!img) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#888";
    ctx.font = `bold ${Math.round(w * 0.38)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↓", w / 2, h / 2);
    return;
  }

  if (isGif(src)) {
    startGifLoop(src);
  } else {
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
  }
}

function pickRandomImageIndex(exclude) {
  if (CANVAS_IMAGES.length === 1) return 0;
  let idx;
  do {
    idx = Math.floor(Math.random() * CANVAS_IMAGES.length);
  } while (idx === exclude);
  return idx;
}

export async function setCanvasImage(forceNew) {
  // Cancelar animaciones previas
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

  stopGifLoop();

  let savedIdx = parseInt(localStorage.getItem(CANVAS_IMAGE_KEY) ?? "-1", 10);

  if (savedIdx === -1 || savedIdx >= CANVAS_IMAGES.length || forceNew) {
    if (savedIdx === -1) {
      currentCanvasImageIndex = Math.floor(
        Math.random() * CANVAS_IMAGES.length,
      );
    } else {
      currentCanvasImageIndex = pickRandomImageIndex(
        forceNew ? currentCanvasImageIndex : savedIdx,
      );
    }
  } else {
    currentCanvasImageIndex = savedIdx;
  }

  localStorage.setItem(CANVAS_IMAGE_KEY, String(currentCanvasImageIndex));

  const src = CANVAS_IMAGES[currentCanvasImageIndex];
  const img = await loadCanvasImage(src);
  drawCanvasImage(img, src);
}

export async function loadInitialCanvasImage() {
  const savedIdx = parseInt(localStorage.getItem(CANVAS_IMAGE_KEY) ?? "-1", 10);

  let idx;
  if (savedIdx === -1 || savedIdx >= CANVAS_IMAGES.length) {
    idx = Math.floor(Math.random() * CANVAS_IMAGES.length);
  } else {
    idx = savedIdx;
  }

  currentCanvasImageIndex = idx;
  localStorage.setItem(CANVAS_IMAGE_KEY, String(idx));

  const src = CANVAS_IMAGES[idx];
  const img = await loadCanvasImage(src);
  drawCanvasImage(img, src);
}
