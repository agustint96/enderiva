// ========================
// WHITEBOARD COLABORATIVA EN TIEMPO REAL
// ========================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://iypxmjxmhlkhkiwadann.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5cHhtanhtaGxraGtpd2FkYW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMjk4NTcsImV4cCI6MjA5NjcwNTg1N30.nEahrHZdBETYGRFNtkAKHT8Tig_0crHa5PA9gQ0PVXE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const _isMobile = !window.matchMedia("(min-width: 768px)").matches;

let wbActive = false;
let _setWbActive = null;
let _loaded = false;
let _isReplaying = false;

// ========================
// WHITEBOARD (solo desktop)
// ========================
if (!_isMobile) {
  const WB_LINE_WIDTH = 2.5;
  const WB_STORAGE_KEY = "naim_whiteboard_v1";
  // Densidad de píxeles real de la pantalla. Sin esto, el canvas se dibuja
  // a resolución "CSS" y el navegador lo estira para llenar los píxeles
  // físicos -> trazos borrosos en pantallas de alta densidad (Retina, etc).
  const DPR = Math.max(window.devicePixelRatio || 1, 1);

  let wbColor = "#111111";
  let currentTrace = [];

  // --- Canvas ---
  const wbCanvas = document.createElement("canvas");
  wbCanvas.id = "wb-canvas";
  // El tamaño y posición del canvas lo maneja styles.css (inset:0; width/height:100%)
  // No se sobreescribe con style inline para evitar conflictos con dvh/dvw.
  document.body.appendChild(wbCanvas);
  const wbCtx = wbCanvas.getContext("2d", { willReadFrequently: true });

  // --- Respaldo blanco para el giro de la hoja ---
  // Cuando #page gira y queda casi de canto (~90°), el navegador la
  // dibuja tan angosta por la perspectiva que el antialiasing la deja
  // semitransparente, y se ve la pizarra (o lo que sea) a través del
  // texto. Este panel opaco se muestra solo durante esa fracción del
  // giro, justo detrás de #page y delante del canvas, para tapar ese
  // efecto "fantasma". No puede ir dentro de #page-perspective: tiene
  // que quedar fijo al viewport real, igual que el canvas.
  const pageBacker = document.createElement("div");
  pageBacker.id = "page-backer";
  pageBacker.style.cssText = `
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 1 !important;
    background: #fff !important;
    pointer-events: none !important;
    display: none !important;
  `;
  document.body.appendChild(pageBacker);

  let _backerTimers = [];
  function clearBackerTimers() {
    _backerTimers.forEach(clearTimeout);
    _backerTimers = [];
  }
  function showBacker() {
    pageBacker.style.display = "block";
  }
  function hideBacker() {
    pageBacker.style.display = "none";
  }

  // --- Toolbar ---
  const wbToolbar = document.createElement("div");
  wbToolbar.id = "wb-toolbar";
  wbToolbar.style.cssText = `
    position: fixed !important;
    bottom: 1.4rem !important;
    left: calc(1rem + 32px + 8px) !important;
    z-index: 9999 !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    background: transparent !important;
  `;
  document.body.appendChild(wbToolbar);

  const wbBtn = document.createElement("button");
  wbBtn.id = "wb-btn";
  wbBtn.title = "Pizarra (W)";
  wbBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
  wbBtn.style.cssText = `
    width: 32px !important;
    height: 32px !important;
    border: none !important;
    background: transparent !important;
    color: #bbb !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 6px !important;
    padding: 0 !important;
    flex-shrink: 0 !important;
    transition: color 0.15s, background 0.15s !important;
    -webkit-tap-highlight-color: transparent !important;
  `;
  wbToolbar.appendChild(wbBtn);

  const wbFlipBtn = document.createElement("button");
  wbFlipBtn.id = "wb-flip-btn";
  wbFlipBtn.title = "Pizarra completa (dorso de la hoja)";
  wbFlipBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="13" rx="1"/><line x1="7" y1="8" x2="14" y2="8"/><line x1="7" y1="12" x2="11" y2="12"/><line x1="3" y1="20" x2="21" y2="20"/></svg>`;
  wbFlipBtn.style.cssText = `
    width: 32px !important;
    height: 32px !important;
    border: none !important;
    background: transparent !important;
    color: #bbb !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 6px !important;
    padding: 0 !important;
    flex-shrink: 0 !important;
    transition: color 0.15s, background 0.15s !important;
    -webkit-tap-highlight-color: transparent !important;
  `;
  wbToolbar.appendChild(wbFlipBtn);

  const wbClearBtn = document.createElement("button");
  wbClearBtn.id = "wb-clear-btn";
  wbClearBtn.title = "Borrar pizarra (E)";
  wbClearBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
  wbClearBtn.style.cssText = `
    width: 32px !important;
    height: 32px !important;
    border: none !important;
    background: transparent !important;
    color: #bbb !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 6px !important;
    padding: 0 !important;
    flex-shrink: 0 !important;
    transition: color 0.15s, background 0.15s, opacity 0.2s !important;
    opacity: 0 !important;
    pointer-events: none !important;
    -webkit-tap-highlight-color: transparent !important;
  `;
  wbToolbar.appendChild(wbClearBtn);

  const wbColorPicker = document.createElement("div");
  wbColorPicker.id = "wb-color-picker";
  wbColorPicker.style.cssText = `
    display: flex !important;
    align-items: center !important;
    gap: 7px !important;
    opacity: 0 !important;
    pointer-events: none !important;
    transition: opacity 0.2s !important;
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
      width: 20px !important;
      height: 20px !important;
      border-radius: 50% !important;
      border: none !important;
      cursor: pointer !important;
      padding: 0 !important;
      flex-shrink: 0 !important;
      background: ${color} !important;
      transition: transform 0.15s, box-shadow 0.15s !important;
      -webkit-tap-highlight-color: transparent !important;
    `;
    dot.addEventListener("click", () => setWbColor(color, dot));
    wbColorPicker.appendChild(dot);
    if (color === "#111111") {
      setTimeout(() => setWbColor(color, dot), 0);
    }
  });

  const wbColorWheel = document.createElement("button");
  wbColorWheel.id = "wb-color-wheel";
  wbColorWheel.title = "Más colores";
  wbColorWheel.style.cssText = `
    width: 20px !important;
    height: 20px !important;
    border-radius: 50% !important;
    border: none !important;
    cursor: pointer !important;
    padding: 0 !important;
    flex-shrink: 0 !important;
    background: conic-gradient(red, yellow, lime, cyan, blue, magenta, red) !important;
    transition: transform 0.15s, box-shadow 0.15s !important;
    -webkit-tap-highlight-color: transparent !important;
    position: relative !important;
  `;
  const wbColorInput = document.createElement("input");
  wbColorInput.id = "wb-color-input";
  wbColorInput.type = "color";
  wbColorInput.value = "#111111";
  wbColorInput.style.cssText = `
    position: absolute !important;
    width: 0 !important;
    height: 0 !important;
    opacity: 0 !important;
    pointer-events: none !important;
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

  // ========================
  // FUNCIONES DEL CANVAS
  // ========================

  function getDocSize() {
    // clientWidth/Height coincide con el tamaño CSS real del canvas (inset:0; width/height:100%)
    // evitando discrepancias con window.innerWidth cuando hay barras del navegador o zoom.
    return {
      w: wbCanvas.clientWidth || document.documentElement.clientWidth,
      h: wbCanvas.clientHeight || document.documentElement.clientHeight,
    };
  }

  function resizeWbCanvas() {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = wbCanvas.width;
    tempCanvas.height = wbCanvas.height;
    tempCanvas.getContext("2d").drawImage(wbCanvas, 0, 0);
    const prevW = wbCanvas.width / DPR;
    const prevH = wbCanvas.height / DPR;

    const { w, h } = getDocSize();
    wbCanvas.width = w * DPR;
    wbCanvas.height = h * DPR;
    // Cambiar width/height reinicia el contexto: hay que volver a escalarlo.
    wbCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // Dibujamos el contenido anterior usando dimensiones CSS (lógicas),
    // ya que el contexto ahora traduce esas unidades a píxeles físicos.
    wbCtx.drawImage(tempCanvas, 0, 0, prevW, prevH);
  }

  // ========================
  // SINCRONIZACIÓN CON SUPABASE
  // ========================

  async function saveTraceToSupabase(tracePoints, color, width) {
    if (_isReplaying) return;
    if (!tracePoints || tracePoints.length < 2) return;

    try {
      const response = await fetch(
        SUPABASE_URL + "/rest/v1/whiteboard_traces",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: "Bearer " + SUPABASE_KEY,
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            trace_data: tracePoints,
            color: color,
            width: width,
          }),
        },
      );

      if (!response.ok) {
        console.error("Error guardando trazo:", await response.text());
      }
    } catch (e) {
      console.warn("Error guardando trazo en Supabase:", e);
    }
  }

  async function saveCanvasState() {
    try {
      const dataUrl = wbCanvas.toDataURL("image/png");

      const response = await fetch(
        SUPABASE_URL + "/rest/v1/whiteboard_state?on_conflict=id",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: "Bearer " + SUPABASE_KEY,
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify({
            id: 1,
            image_data: dataUrl,
            updated_at: new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) {
        console.error(
          "Error guardando estado del canvas:",
          await response.text(),
        );
      }
    } catch (e) {
      console.warn("Error guardando estado del canvas:", e);
    }
  }

  async function loadCanvasState() {
    try {
      console.log("📥 Cargando estado del canvas...");

      const response = await fetch(
        SUPABASE_URL + "/rest/v1/whiteboard_state?select=image_data&id=eq.1",
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: "Bearer " + SUPABASE_KEY,
          },
        },
      );

      if (!response.ok) {
        console.error("Error cargando estado:", await response.text());
        return;
      }

      const rows = await response.json();
      if (rows && rows.length > 0 && rows[0].image_data) {
        const { w, h } = getDocSize();
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            // w/h son unidades CSS: el contexto ya está escalado por DPR.
            wbCtx.drawImage(img, 0, 0, w, h);
            console.log("✅ Estado del canvas cargado");
            resolve();
          };
          img.onerror = () => {
            console.warn("⚠️ Error cargando imagen del estado");
            resolve();
          };
          img.src = rows[0].image_data;
        });
      }
    } catch (e) {
      console.warn("Error cargando estado del canvas:", e);
    }
  }

  // ========================
  // DIBUJO DE TRAZOS (CORREGIDO)
  // ========================

  function drawTraceOnCanvas(points, color, width) {
    if (!points || points.length < 2) {
      console.warn("⚠️ Trazo inválido (menos de 2 puntos):", points);
      return;
    }

    // Verificar que los puntos tienen las propiedades correctas
    if (typeof points[0]?.x !== "number" || typeof points[0]?.y !== "number") {
      console.warn("⚠️ Puntos en formato incorrecto:", points[0]);
      if (Array.isArray(points[0])) {
        points = points.map((p) => ({ x: p[0], y: p[1] }));
      } else {
        return;
      }
    }

    if (!wbCtx) {
      console.warn("⚠️ Contexto del canvas no disponible");
      return;
    }

    try {
      const canvasWidth = wbCanvas.width / DPR;
      const canvasHeight = wbCanvas.height / DPR;

      // Verificar si los puntos están dentro del canvas
      let needsNormalization = false;
      for (const p of points) {
        if (p.x > canvasWidth || p.y > canvasHeight) {
          needsNormalization = true;
          break;
        }
      }

      let drawPoints = points;

      // Si los puntos están fuera del canvas, intentar normalizarlos
      if (needsNormalization) {
        console.log("📐 Normalizando coordenadas...");

        let minX = Infinity,
          maxX = -Infinity;
        let minY = Infinity,
          maxY = -Infinity;

        for (const p of points) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }

        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;

        const margin = 0.1;
        const scaleX = (canvasWidth * (1 - margin * 2)) / rangeX;
        const scaleY = (canvasHeight * (1 - margin * 2)) / rangeY;
        const scale = Math.min(scaleX, scaleY, 1);

        drawPoints = points.map((p) => ({
          x: (p.x - minX) * scale + canvasWidth * margin,
          y: (p.y - minY) * scale + canvasHeight * margin,
        }));

        console.log("✅ Coordenadas normalizadas");
      }

      wbCtx.strokeStyle = color || "#111111";
      wbCtx.fillStyle = color || "#111111";
      wbCtx.lineWidth = width || WB_LINE_WIDTH;
      wbCtx.lineCap = "round";
      wbCtx.lineJoin = "round";

      wbCtx.beginPath();
      wbCtx.moveTo(drawPoints[0].x, drawPoints[0].y);

      for (let i = 1; i < drawPoints.length; i++) {
        wbCtx.lineTo(drawPoints[i].x, drawPoints[i].y);
      }

      wbCtx.stroke();

      console.log("✅ Trazo dibujado correctamente");
    } catch (e) {
      console.error("❌ Error dibujando trazo:", e);
    }
  }

  // ========================
  // REPRODUCIR TRAZOS HISTÓRICOS
  // ========================

  async function replayAllTraces() {
    try {
      _isReplaying = true;
      console.log("🔄 Reproduciendo trazos históricos...");

      const response = await fetch(
        SUPABASE_URL + "/rest/v1/whiteboard_traces?order=id.asc",
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: "Bearer " + SUPABASE_KEY,
          },
        },
      );

      if (!response.ok) {
        console.error("Error cargando trazos:", await response.text());
        _isReplaying = false;
        return;
      }

      const traces = await response.json();
      console.log(`📊 ${traces.length} trazos encontrados`);

      if (traces.length === 0) {
        console.log("ℹ️ No hay trazos para reproducir");
        _isReplaying = false;
        return;
      }

      for (let i = 0; i < traces.length; i++) {
        const trace = traces[i];
        console.log(`🖊️ Dibujando trazo ${i + 1}/${traces.length}`);
        drawTraceOnCanvas(trace.trace_data, trace.color, trace.width);
      }

      console.log("✅ Trazos reproducidos correctamente");
      _isReplaying = false;
      saveWhiteboardLocal();

      // Verificar que se dibujó algo
      const imageData = wbCtx.getImageData(
        0,
        0,
        wbCanvas.width,
        wbCanvas.height,
      );
      let hasPixel = false;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] !== 0) {
          hasPixel = true;
          break;
        }
      }
      console.log("📊 ¿Hay píxeles después de reproducir?", hasPixel);
    } catch (e) {
      console.warn("Error reproduciendo trazos:", e);
      _isReplaying = false;
    }
  }

  // ========================
  // ESCUCHAR NUEVOS TRAZOS
  // ========================

  function listenForTraces() {
    console.log("📡 Escuchando nuevos trazos...");

    supabase
      .channel("whiteboard-traces")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "whiteboard_traces" },
        (payload) => {
          const trace = payload.new;
          console.log("🆕 Nuevo trazo recibido");
          drawTraceOnCanvas(trace.trace_data, trace.color, trace.width);
          saveWhiteboardLocal();
        },
      )
      .subscribe();
  }

  // ========================
  // GUARDAR EN LOCALSTORAGE
  // ========================

  function saveWhiteboardLocal() {
    if (!_loaded) return;
    try {
      const dataUrl = wbCanvas.toDataURL("image/png");
      localStorage.setItem(WB_STORAGE_KEY, dataUrl);
    } catch (e) {
      console.warn("No se pudo guardar la pizarra localmente:", e);
    }
  }

  // ========================
  // DIBUJO EN VIVO
  // ========================

  function getPos(e) {
    const rect = wbCanvas.getBoundingClientRect();
    if (e.touches) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  let wbDrawing = false;
  let wbPoints = [];

  function startDraw(e) {
    if (!wbActive || !_loaded || _isReplaying) return;
    e.preventDefault();
    wbDrawing = true;
    const { x, y } = getPos(e);
    wbPoints = [{ x, y }];
    currentTrace = [{ x, y }];
  }

  function draw(e) {
    if (!wbActive || !wbDrawing || !_loaded || _isReplaying) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    wbPoints.push({ x, y });
    currentTrace.push({ x, y });

    const len = wbPoints.length;
    if (len < 3) return;
    const p0 = wbPoints[len - 3];
    const p1 = wbPoints[len - 2];
    const p2 = wbPoints[len - 1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    wbCtx.strokeStyle = wbColor;
    wbCtx.lineWidth = WB_LINE_WIDTH;
    wbCtx.lineCap = "round";
    wbCtx.lineJoin = "round";
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
      wbCtx.strokeStyle = wbColor;
      wbCtx.lineWidth = WB_LINE_WIDTH;
      wbCtx.lineCap = "round";
      wbCtx.lineJoin = "round";
      wbCtx.beginPath();
      wbCtx.moveTo((prev.x + last.x) / 2, (prev.y + last.y) / 2);
      wbCtx.lineTo(last.x, last.y);
      wbCtx.stroke();

      if (currentTrace.length >= 2) {
        saveTraceToSupabase(currentTrace, wbColor, WB_LINE_WIDTH);
      }
    }

    wbDrawing = false;
    wbPoints = [];
    currentTrace = [];
    saveWhiteboardLocal();
  }

  // ========================
  // LIMPIAR WHITEBOARD
  // ========================

  async function clearWhiteboard() {
    if (!wbActive) return;

    wbCtx.save();
    wbCtx.setTransform(1, 0, 0, 1, 0, 0);
    wbCtx.clearRect(0, 0, wbCanvas.width, wbCanvas.height);
    wbCtx.restore();
    localStorage.removeItem(WB_STORAGE_KEY);

    try {
      await fetch(SUPABASE_URL + "/rest/v1/whiteboard_traces?id=gte.0", {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
        },
      });

      await saveCanvasState();
      console.log("🗑️ Whiteboard limpiada");
    } catch (e) {
      console.warn("Error limpiando whiteboard en Supabase:", e);
    }
  }

  // ========================
  // ACTIVAR/DESACTIVAR
  // ========================

  function setWbActive(active) {
    wbActive = active;
    const pageEl = document.getElementById("page");
    if (active) {
      wbCanvas.style.pointerEvents = "all";
      wbCanvas.classList.add("wb-active");
      wbCanvas.style.cursor = "crosshair";
      wbBtn.style.color = "#111";
      wbBtn.style.background = "rgba(0,0,0,0.07)";
      wbClearBtn.style.opacity = "1";
      wbClearBtn.style.pointerEvents = "all";
      wbColorPicker.style.opacity = "1";
      wbColorPicker.style.pointerEvents = "all";
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
      // #page ahora se dibuja por encima del canvas (para que el texto
      // quede siempre visible sobre los trazos). Sin esto, #page
      // interceptaría los clics y no se podría dibujar.
      if (pageEl) pageEl.style.pointerEvents = "none";
    } else {
      wbCanvas.style.pointerEvents = "none";
      wbCanvas.classList.remove("wb-active");
      wbCanvas.style.cursor = "default";
      wbBtn.style.color = "#bbb";
      wbBtn.style.background = "transparent";
      wbClearBtn.style.opacity = "0";
      wbClearBtn.style.pointerEvents = "none";
      wbColorPicker.style.opacity = "0";
      wbColorPicker.style.pointerEvents = "none";
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      if (pageEl) pageEl.style.pointerEvents = "";
      wbDrawing = false;
      saveWhiteboardLocal();
    }
  }
  _setWbActive = setWbActive;

  // ========================
  // DORSO: PIZARRA DE PARED A PARED
  // ========================

  let pageFlipped = false;
  let _wasActiveBeforeFlip = false;

  function setPageFlipped(flip) {
    if (flip === pageFlipped) return;
    pageFlipped = flip;
    const pageEl = document.getElementById("page");
    const perspectiveEl = document.getElementById("page-perspective");

    // #page puede ser mucho más alta que la pantalla (crece con cada
    // mensaje escrito). Si el giro pivotea sobre el centro de TODA la
    // hoja, el punto de fuga queda lejos de donde el usuario está
    // mirando y el texto se ve inclinado. Por eso centramos el eje de
    // giro y la perspectiva en el centro del viewport actual, tomando
    // como referencia el scroll en el momento de tocar el botón.
    const viewCenter = window.scrollY + window.innerHeight / 2;
    if (pageEl) pageEl.style.transformOrigin = `center ${viewCenter}px`;
    if (perspectiveEl)
      perspectiveEl.style.perspectiveOrigin = `center ${viewCenter}px`;

    // La hoja pasa "de canto" (90°) más o menos a la mitad de la
    // transición de 0.7s, ya que la curva cubic-bezier usada es
    // simétrica. Mostramos el respaldo solo mientras #page está cerca
    // de esa zona, en el lado en que sigue siendo visible (foreshortened).
    const HALF_MS = 350;
    clearBackerTimers();
    if (flip) {
      // 0° → 180°: la hoja es visible y se va angostando entre 0° y 90°.
      showBacker();
      _backerTimers.push(setTimeout(hideBacker, HALF_MS));
    } else {
      // 180° → 0°: la hoja sigue oculta hasta los 90° y recién ahí
      // empieza a angostarse de nuevo hasta hacerse visible en 0°.
      hideBacker();
      _backerTimers.push(setTimeout(showBacker, HALF_MS));
      _backerTimers.push(setTimeout(hideBacker, HALF_MS + 350));
    }

    if (flip) {
      // Si ya estaba dibujando en los márgenes, lo recordamos para
      // dejarlo en el mismo estado al volver a la hoja.
      _wasActiveBeforeFlip = wbActive;
      if (!wbActive) setWbActive(true);
      document
        .getElementById("page-perspective")
        ?.classList.add("page-flip-active");
      if (pageEl) pageEl.classList.add("page-flipped");
      wbFlipBtn.style.color = "#111";
      wbFlipBtn.style.background = "rgba(0,0,0,0.07)";
      wbFlipBtn.title = "Volver a la hoja";
    } else {
      document
        .getElementById("page-perspective")
        ?.classList.remove("page-flip-active");
      if (pageEl) pageEl.classList.remove("page-flipped");
      wbFlipBtn.style.color = "#bbb";
      wbFlipBtn.style.background = "transparent";
      wbFlipBtn.title = "Pizarra completa (dorso de la hoja)";
      if (!_wasActiveBeforeFlip) setWbActive(false);
    }
  }

  // ========================
  // EVENTOS
  // ========================

  wbCanvas.addEventListener("mousedown", startDraw);
  wbCanvas.addEventListener("mousemove", draw);
  wbCanvas.addEventListener("mouseup", stopDraw);
  wbCanvas.addEventListener("mouseleave", stopDraw);

  wbCanvas.addEventListener("touchstart", startDraw, { passive: false });
  wbCanvas.addEventListener("touchmove", draw, { passive: false });
  wbCanvas.addEventListener("touchend", stopDraw);
  wbCanvas.addEventListener("touchcancel", stopDraw);

  wbBtn.addEventListener("click", () => {
    if (_setWbActive) _setWbActive(!wbActive);
  });

  wbFlipBtn.addEventListener("click", () => {
    setPageFlipped(!pageFlipped);
  });

  wbClearBtn.addEventListener("click", clearWhiteboard);

  wbBtn.addEventListener("mouseenter", () => {
    if (!wbActive) wbBtn.style.color = "#555";
  });
  wbBtn.addEventListener("mouseleave", () => {
    if (!wbActive) wbBtn.style.color = "#bbb";
  });
  wbFlipBtn.addEventListener("mouseenter", () => {
    if (!pageFlipped) wbFlipBtn.style.color = "#555";
  });
  wbFlipBtn.addEventListener("mouseleave", () => {
    if (!pageFlipped) wbFlipBtn.style.color = "#bbb";
  });
  wbClearBtn.addEventListener("mouseenter", () => {
    wbClearBtn.style.color = "#e53935";
  });
  wbClearBtn.addEventListener("mouseleave", () => {
    wbClearBtn.style.color = "#bbb";
  });

  // ========================
  // TECLAS
  // ========================

  document.addEventListener("keydown", (e) => {
    const tag = document.activeElement?.tagName;
    const isEditable = document.activeElement?.isContentEditable;
    if (tag === "INPUT" || tag === "TEXTAREA" || isEditable) return;
    if (e.key === "w" || e.key === "W") {
      e.preventDefault();
      if (_setWbActive) _setWbActive(!wbActive);
    }
    if ((e.key === "e" || e.key === "E") && wbActive) {
      e.preventDefault();
      clearWhiteboard();
    }
  });

  // ========================
  // RESIZE
  // ========================

  window.addEventListener("resize", () => {
    resizeWbCanvas();
  });

  // ========================
  // INICIALIZACIÓN
  // ========================

  let initPromise = null;

  async function initWbCanvas() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        console.log("🖌️ Inicializando whiteboard...");

        const { w, h } = getDocSize();
        wbCanvas.width = w * DPR;
        wbCanvas.height = h * DPR;
        wbCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

        // Primero intentar cargar desde localStorage (más rápido)
        try {
          const localData = localStorage.getItem(WB_STORAGE_KEY);
          if (localData) {
            const img = new Image();
            img.onload = () => {
              // w/h son unidades CSS: el contexto ya está escalado por DPR.
              wbCtx.drawImage(img, 0, 0, w, h);
              console.log("✅ Cargado desde localStorage");
            };
            img.src = localData;
          }
        } catch (e) {}

        // Luego cargar desde Supabase
        await loadCanvasState();
        await replayAllTraces();
        listenForTraces();

        console.log("✅ Whiteboard inicializada correctamente");
        _loaded = true;
      } catch (e) {
        console.error("❌ Error inicializando whiteboard:", e);
        _loaded = true;
      }
    })();

    return initPromise;
  }

  // Esperar a que el DOM esté listo
  if (document.readyState === "complete") {
    initWbCanvas();
  } else {
    window.addEventListener("load", () => {
      setTimeout(initWbCanvas, 100);
    });
  }

  const _wbResizeObserver = new ResizeObserver(() => {
    const { w, h } = getDocSize();
    if (w > wbCanvas.width / DPR || h > wbCanvas.height / DPR) {
      resizeWbCanvas();
    }
  });
  _wbResizeObserver.observe(document.body);

  window.addEventListener("beforeunload", () => {
    if (wbActive) saveWhiteboardLocal();
  });
}

// ========================
// EXPORT
// ========================

export function toggleWhiteboard() {
  if (_isMobile || !_setWbActive) return;
  _setWbActive(!wbActive);
}

export function getWhiteboardThumbnail(maxWidth = 900) {
  const canvas = document.getElementById("wb-canvas");
  if (!canvas) return null;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  let hasPixel = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) {
      hasPixel = true;
      break;
    }
  }
  if (!hasPixel) return null;

  const scale = Math.min(1, maxWidth / w);
  const thumbW = Math.round(w * scale);
  const thumbH = Math.round(h * scale);
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = thumbW;
  tempCanvas.height = thumbH;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(canvas, 0, 0, thumbW, thumbH);

  return tempCanvas.toDataURL("image/png");
}

export function clearWhiteboard() {
  // Función para limpiar desde app.js si es necesario
  const canvas = document.getElementById("wb-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}
