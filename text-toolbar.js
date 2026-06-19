// ========================
// TEXT TOOLBAR
// ========================
// Botón A sobre el lápiz → popover con B / I / U
// Inserta marcadores de texto en el #editor

import { editor } from "./dom.js";

// --- Contenedor vertical (A arriba, lápiz abajo ya está en whiteboard) ---
// Lo anclamos a la misma columna izquierda que el wb-toolbar
const txtBtn = document.createElement("button");
txtBtn.id = "txt-btn";
txtBtn.title = "Formato de texto";
txtBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="4 7 4 4 20 4 20 7"/>
  <line x1="9" y1="20" x2="15" y2="20"/>
  <line x1="12" y1="4" x2="12" y2="20"/>
</svg>`;
txtBtn.style.cssText = `
  position: fixed;
  bottom: calc(1.4rem + 32px + 8px);
  left: 1rem;
  z-index: 9998;
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
  transition: color 0.15s, background 0.15s;
  -webkit-tap-highlight-color: transparent;
`;
document.body.appendChild(txtBtn);

// --- Popover ---
const txtPopover = document.createElement("div");
txtPopover.id = "txt-popover";
txtPopover.style.cssText = `
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 0.5px solid rgba(0,0,0,0.12);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.13);
  display: flex;
  flex-direction: row;
  gap: 2px;
  padding: 5px;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-6px);
  transition: opacity 0.15s, transform 0.15s;
`;
document.body.appendChild(txtPopover);

const FORMAT_OPTIONS = [
  {
    label: "B",
    style: "font-weight:700;font-size:15px;",
    title: "Negrita (Ctrl+B)",
    abre: "**",
    cierra: "**",
  },
  {
    label: "I",
    style: "font-style:italic;font-size:15px;",
    title: "Cursiva (Ctrl+I)",
    abre: "*",
    cierra: "*",
  },
  {
    label: "U",
    style: "text-decoration:underline;font-size:15px;",
    title: "Subrayado (Ctrl+U)",
    abre: "__",
    cierra: "__",
  },
];

// Guardamos la selección antes de que el click al botón la pierda
let savedRange = null;

FORMAT_OPTIONS.forEach(({ label, style, title, abre, cierra }) => {
  const btn = document.createElement("button");
  btn.title = title;
  btn.innerHTML = `<span style="${style}">${label}</span>`;
  btn.style.cssText = `
    width: 34px;
    height: 32px;
    border: none;
    background: transparent;
    color: #222;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    padding: 0;
    transition: background 0.12s;
    -webkit-tap-highlight-color: transparent;
  `;
  btn.addEventListener("mouseenter", () => {
    btn.style.background = "rgba(0,0,0,0.06)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "transparent";
  });

  btn.addEventListener("mousedown", (e) => {
    e.preventDefault();
  });
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    aplicarFormato(abre, cierra);
    cerrarPopover();
  });
  btn.addEventListener("touchend", (e) => {
    e.preventDefault();
    aplicarFormato(abre, cierra);
    cerrarPopover();
  });

  txtPopover.appendChild(btn);
});

// --- Lógica de formato ---
function aplicarFormato(abre, cierra) {
  editor.focus();

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  // Intentar restaurar la selección guardada si el editor la perdió
  let range;
  if (savedRange && editor.contains(savedRange.commonAncestorContainer)) {
    sel.removeAllRanges();
    sel.addRange(savedRange);
    range = savedRange;
  } else {
    range = sel.getRangeAt(0);
  }

  const textoSeleccionado = range.toString();
  if (textoSeleccionado) {
    range.deleteContents();
    const nodo = document.createTextNode(abre + textoSeleccionado + cierra);
    range.insertNode(nodo);
    range.setStartAfter(nodo);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    const marcas = document.createTextNode(abre + cierra);
    range.insertNode(marcas);
    const newRange = document.createRange();
    newRange.setStart(marcas, abre.length);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  savedRange = null;
}

// --- Popover open/close ---
let popoverOpen = false;

function posicionarPopover() {
  const btnRect = txtBtn.getBoundingClientRect();
  const gap = 8;
  const popoverWidth = txtPopover.offsetWidth;
  const popoverHeight = txtPopover.offsetHeight;
  const top = Math.max(
    gap,
    Math.min(
      window.innerHeight - popoverHeight - gap,
      btnRect.top + btnRect.height / 2 - popoverHeight / 2,
    ),
  );

  if (window.matchMedia("(max-width: 767px)").matches) {
    txtPopover.style.left = `${Math.max(gap, btnRect.left - popoverWidth - gap)}px`;
  } else {
    txtPopover.style.left = `${btnRect.right + gap}px`;
  }

  txtPopover.style.top = `${top}px`;
}

function abrirPopover() {
  popoverOpen = true;
  txtBtn.style.color = "#111";
  txtBtn.style.background = "rgba(0,0,0,0.07)";
  txtPopover.style.opacity = "1";
  txtPopover.style.pointerEvents = "all";
  txtPopover.style.transform = "translateX(0)";
  requestAnimationFrame(posicionarPopover);
}

function cerrarPopover() {
  popoverOpen = false;
  txtBtn.style.color = "#bbb";
  txtBtn.style.background = "transparent";
  txtPopover.style.opacity = "0";
  txtPopover.style.pointerEvents = "none";
  txtPopover.style.transform = "translateX(-6px)";
}

// Guardar selección en cualquier mousedown global, antes de que el foco se mueva
document.addEventListener("mousedown", (e) => {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedRange = range.cloneRange();
    }
  }
});

txtBtn.addEventListener("mousedown", (e) => {
  e.preventDefault();
  // Marcamos que este mousedown fue sobre el botón para que el listener
  // "click afuera" no lo intercepte en el mismo ciclo de eventos
  txtBtn._justPressed = true;
  setTimeout(() => {
    txtBtn._justPressed = false;
  }, 0);
  popoverOpen ? cerrarPopover() : abrirPopover();
});
txtBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  popoverOpen ? cerrarPopover() : abrirPopover();
});

// Cerrar al hacer click afuera
document.addEventListener("mousedown", (e) => {
  if (txtBtn._justPressed) return;
  if (popoverOpen && !txtPopover.contains(e.target) && e.target !== txtBtn) {
    cerrarPopover();
  }
});

// Hover
txtBtn.addEventListener("mouseenter", () => {
  if (!popoverOpen) txtBtn.style.color = "#555";
});
txtBtn.addEventListener("mouseleave", () => {
  if (!popoverOpen) txtBtn.style.color = "#bbb";
});
