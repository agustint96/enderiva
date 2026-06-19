// ========================
// WHITEBOARD
// ========================
// Solo disponible en desktop (768px+). En mobile no se monta nada.

const _isMobile = !window.matchMedia("(min-width: 768px)").matches;

let wbActive = false;
let _setWbActive = null;
let _loaded = false; // indica que la imagen guardada ya se cargó

export function toggleWhiteboard() {
  if (_isMobile || !_setWbActive) return;
  _setWbActive(!wbActive);
}

if (_isMobile) {
  // Salida temprana en móviles
} else {
  // ========================
  // WHITEBOARD (solo desktop)
  // ========================
  const WB_LINE_WIDTH = 2.5;
  const WB_STORAGE_KEY = "naim_whiteboard_v1";

  let wbColor = "#111111";

  // --- Canvas de fondo ---
  const wbCanvas = document.createElement("canvas");
  wbCanvas.id = "wb-canvas";
  wbCanvas.style.cssText = `
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
  touch-action: none;
  cursor: default;
`;
  document.body.style.position = "relative";
  document.body.insertBefore(wbCanvas, document.body.firstChild);
  const wbCtx = wbCanvas.getContext("2d");

  // --- Toolbar ---
  const wbToolbar = document.createElement("div");
  wbToolbar.id = "wb-toolbar";
  wbToolbar.style.cssText = `
  position: fixed;
  bottom: 1.4rem;
  left: 1rem;
  z-index: 9998;
  display: flex;
  align-items: center;
  gap: 6px;
`;
  document.body.appendChild(wbToolbar);

  const wbBtn = document.createElement("button");
  wbBtn.id = "wb-btn";
  wbBtn.title = "Pizarra (W)";
  wbBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
  wbBtn.style.cssText = `
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #bbb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  padding: 0;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
  -webkit-tap-highlight-color: transparent;
`;
  wbToolbar.appendChild(wbBtn);

  const wbClearBtn = document.createElement("button");
  wbClearBtn.id = "wb-clear-btn";
  wbClearBtn.title = "Borrar pizarra (E)";
  wbClearBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
  wbClearBtn.style.cssText = `
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #bbb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  padding: 0;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s, opacity 0.2s;
  opacity: 0;
  pointer-events: none;
  -webkit-tap-highlight-color: transparent;
`;
  wbToolbar.appendChild(wbClearBtn);

  // --- Selector de colores ---
  const wbColorPicker = document.createElement("div");
  wbColorPicker.id = "wb-color-picker";
  wbColorPicker.style.cssText = `
  display: flex;
  align-items: center;
  gap: 7px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
`;
  wbToolbar.appendChild(wbColorPicker);

  const PRIMARY_COLORS = [
    { color: "#111111", label: "Negro" },
    { color: "#e53935", label: "Rojo" },
    { color: "#1565c0", label: "Azul" },
    { color: "#f9a825", label: "Amarillo" },
  ];

  let activeColorDot = null;

  function setWbColor(color, dot) {
    wbColor = color;
    if (activeColorDot) {
      activeColorDot.style.boxShadow = "none";
      activeColorDot.style.transform = "scale(1)";
    }
    activeColorDot = dot;
    if (dot) {
      dot.style.boxShadow = `0 0 0 2px white, 0 0 0 3.5px ${color}`;
      dot.style.transform = "scale(1.18)";
    }
  }

  PRIMARY_COLORS.forEach(({ color, label }) => {
    const dot = document.createElement("button");
    dot.title = label;
    dot.style.cssText = `
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${color};
    border: none;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: transform 0.15s, box-shadow 0.15s;
    -webkit-tap-highlight-color: transparent;
  `;
    dot.addEventListener("click", () => setWbColor(color, dot));
    wbColorPicker.appendChild(dot);
    if (color === "#111111") {
      setTimeout(() => setWbColor(color, dot), 0);
    }
  });

  const wbColorWheel = document.createElement("button");
  wbColorWheel.title = "Más colores";
  wbColorWheel.style.cssText = `
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  background: conic-gradient(red, yellow, lime, cyan, blue, magenta, red);
  transition: transform 0.15s, box-shadow 0.15s;
  -webkit-tap-highlight-color: transparent;
  position: relative;
`;
  const wbColorInput = document.createElement("input");
  wbColorInput.type = "color";
  wbColorInput.value = "#111111";
  wbColorInput.style.cssText = `
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
`;
  wbColorWheel.appendChild(wbColorInput);
  wbColorWheel.addEventListener("click", () => wbColorInput.click());
  wbColorInput.addEventListener("input", () => {
    setWbColor(wbColorInput.value, null);
    if (activeColorDot) {
      activeColorDot.style.boxShadow = "none";
      activeColorDot.style.transform = "scale(1)";
      activeColorDot = null;
    }
    wbColorWheel.style.boxShadow = `0 0 0 2px white, 0 0 0 3.5px ${wbColorInput.value}`;
  });
  wbColorPicker.appendChild(wbColorWheel);

  // --- Estado ---
  let wbDrawing = false;
  let wbPoints = [];
  const wbMobileQuery = window.matchMedia("(max-width: 767px)");

  // --- Persistencia ---
  function saveWhiteboard() {
    if (!_loaded) return; // no guardar si aún no se cargó la imagen previa
    try {
      const dataUrl = wbCanvas.toDataURL("image/png");
      localStorage.setItem(WB_STORAGE_KEY, dataUrl);
    } catch (e) {
      console.warn("No se pudo guardar la pizarra:", e);
    }
  }

  function loadWhiteboard() {
    return new Promise((resolve) => {
      try {
        const data = localStorage.getItem(WB_STORAGE_KEY);
        if (!data) {
          _loaded = true;
          resolve();
          return;
        }
        const img = new Image();
        img.onload = () => {
          wbCtx.drawImage(img, 0, 0);
          _loaded = true;
          resolve();
        };
        img.onerror = () => {
          _loaded = true;
          resolve();
        };
        img.src = data;
      } catch (e) {
        _loaded = true;
        resolve();
      }
    });
  }

  // --- Canvas ---
  function getDocSize() {
    return {
      w: window.innerWidth,
      h: Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        window.innerHeight,
      ),
    };
  }

  function resizeWbCanvas() {
    // Si no se ha cargado la imagen guardada, solo redimensionamos sin tocar el contenido guardado
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = wbCanvas.width;
    tempCanvas.height = wbCanvas.height;
    tempCanvas.getContext("2d").drawImage(wbCanvas, 0, 0);

    const { w, h } = getDocSize();
    wbCanvas.width = w;
    wbCanvas.height = h;
    wbCtx.drawImage(tempCanvas, 0, 0);

    // No guardamos aquí; el guardado ocurre en las acciones del usuario.
  }

  function clearWhiteboard() {
    wbCtx.clearRect(0, 0, wbCanvas.width, wbCanvas.height);
    saveWhiteboard();
  }

  function updateWbLayer() {
    wbCanvas.style.zIndex = wbActive && wbMobileQuery.matches ? "9997" : "0";
  }

  function setWbActive(active) {
    wbActive = active;
    if (active) {
      wbCanvas.style.pointerEvents = "all";
      wbCanvas.classList.add("wb-active");
      updateWbLayer();
      wbCanvas.style.cursor = "crosshair";
      wbBtn.style.color = "#111";
      wbBtn.style.background = "rgba(0,0,0,0.07)";
      wbClearBtn.style.opacity = "1";
      wbClearBtn.style.pointerEvents = "all";
      wbColorPicker.style.opacity = "1";
      wbColorPicker.style.pointerEvents = "all";
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
    } else {
      wbCanvas.style.pointerEvents = "none";
      wbCanvas.classList.remove("wb-active");
      updateWbLayer();
      wbCanvas.style.cursor = "default";
      wbBtn.style.color = "#bbb";
      wbBtn.style.background = "transparent";
      wbClearBtn.style.opacity = "0";
      wbClearBtn.style.pointerEvents = "none";
      wbColorPicker.style.opacity = "0";
      wbColorPicker.style.pointerEvents = "none";
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      wbDrawing = false;
      saveWhiteboard();
    }
  }
  _setWbActive = setWbActive;

  // --- Dibujo ---
  function getPos(e) {
    if (e.touches) {
      const t = e.touches[0];
      return { x: t.clientX + window.scrollX, y: t.clientY + window.scrollY };
    }
    return { x: e.clientX + window.scrollX, y: e.clientY + window.scrollY };
  }

  function applyStrokeStyle() {
    wbCtx.strokeStyle = wbColor;
    wbCtx.fillStyle = wbColor;
    wbCtx.lineWidth = WB_LINE_WIDTH;
    wbCtx.lineCap = "round";
    wbCtx.lineJoin = "round";
  }

  function startDraw(e) {
    if (!wbActive || !_loaded) return;
    e.preventDefault();
    wbDrawing = true;
    const { x, y } = getPos(e);
    wbPoints = [{ x, y }];
    wbCtx.beginPath();
    wbCtx.arc(x, y, WB_LINE_WIDTH / 2, 0, Math.PI * 2);
    wbCtx.fillStyle = wbColor;
    wbCtx.fill();
  }

  function draw(e) {
    if (!wbActive || !wbDrawing || !_loaded) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    wbPoints.push({ x, y });
    const len = wbPoints.length;
    if (len < 3) return;
    const p0 = wbPoints[len - 3];
    const p1 = wbPoints[len - 2];
    const p2 = wbPoints[len - 1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    applyStrokeStyle();
    wbCtx.beginPath();
    wbCtx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
    wbCtx.quadraticCurveTo(p1.x, p1.y, midX, midY);
    wbCtx.stroke();
  }

  function stopDraw() {
    if (!wbDrawing) return;
    const len = wbPoints.length;
    if (len >= 2) {
      const last = wbPoints[len - 1];
      const prev = wbPoints[len - 2];
      applyStrokeStyle();
      wbCtx.beginPath();
      wbCtx.moveTo((prev.x + last.x) / 2, (prev.y + last.y) / 2);
      wbCtx.lineTo(last.x, last.y);
      wbCtx.stroke();
    }
    wbDrawing = false;
    wbPoints = [];
    saveWhiteboard();
  }

  // --- Eventos ---
  wbCanvas.addEventListener("mousedown", startDraw);
  wbCanvas.addEventListener("mousemove", draw);
  wbCanvas.addEventListener("mouseup", stopDraw);
  wbCanvas.addEventListener("mouseleave", stopDraw);

  wbCanvas.addEventListener("touchstart", startDraw, { passive: false });
  wbCanvas.addEventListener("touchmove", draw, { passive: false });
  wbCanvas.addEventListener("touchend", stopDraw);
  wbCanvas.addEventListener("touchcancel", stopDraw);

  wbBtn.addEventListener("click", toggleWhiteboard);
  wbClearBtn.addEventListener("click", clearWhiteboard);

  wbBtn.addEventListener("mouseenter", () => {
    if (!wbActive) wbBtn.style.color = "#555";
  });
  wbBtn.addEventListener("mouseleave", () => {
    if (!wbActive) wbBtn.style.color = "#bbb";
  });
  wbClearBtn.addEventListener("mouseenter", () => {
    wbClearBtn.style.color = "#e53935";
  });
  wbClearBtn.addEventListener("mouseleave", () => {
    wbClearBtn.style.color = "#bbb";
  });

  // --- Teclas ---
  document.addEventListener("keydown", (e) => {
    const tag = document.activeElement?.tagName;
    const isEditable = document.activeElement?.isContentEditable;
    if (tag === "INPUT" || tag === "TEXTAREA" || isEditable) return;
    if (e.key === "w" || e.key === "W") {
      e.preventDefault();
      toggleWhiteboard();
    }
    if ((e.key === "e" || e.key === "E") && wbActive) {
      e.preventDefault();
      clearWhiteboard();
    }
  });

  // --- Guardar al cerrar la pestaña ---
  window.addEventListener("beforeunload", () => {
    if (wbActive) saveWhiteboard();
  });

  // --- Resize ---
  window.addEventListener("resize", () => {
    resizeWbCanvas();
    updateWbLayer();
  });

  // --- Inicialización ---
  async function initWbCanvas() {
    const { w, h } = getDocSize();
    wbCanvas.width = w;
    wbCanvas.height = h;
    await loadWhiteboard(); // espera a que se cargue la imagen
    // Ahora _loaded es true; cualquier resize posterior no sobrescribirá el almacenamiento.
  }

  if (document.readyState === "complete") {
    initWbCanvas();
  } else {
    window.addEventListener("load", initWbCanvas);
  }

  // Observer para expandir el canvas si el documento crece
  const _wbResizeObserver = new ResizeObserver(() => {
    const { w, h } = getDocSize();
    if (w > wbCanvas.width || h > wbCanvas.height) {
      resizeWbCanvas();
    }
  });
  _wbResizeObserver.observe(document.body);
} // end desktop-only
