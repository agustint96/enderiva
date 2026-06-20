// ========================
// TEXT TOOLBAR
// ========================

import { editor } from "./dom.js";

const txtBtn = document.createElement("button");
txtBtn.id = "txt-btn";
txtBtn.title = "Formato de texto";
txtBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="4 7 4 4 20 4 20 7"/>
  <line x1="9" y1="20" x2="15" y2="20"/>
  <line x1="12" y1="4" x2="12" y2="20"/>
</svg>`;
document.body.appendChild(txtBtn);

const txtPopover = document.createElement("div");
txtPopover.id = "txt-popover";
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

let savedRange = null;

FORMAT_OPTIONS.forEach(({ label, style, title, abre, cierra }) => {
  const btn = document.createElement("button");
  btn.title = title;
  btn.innerHTML = `<span style="${style}">${label}</span>`;

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

function aplicarFormato(abre, cierra) {
  editor.focus();

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

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

document.addEventListener("mousedown", (e) => {
  if (txtBtn._justPressed) return;
  if (popoverOpen && !txtPopover.contains(e.target) && e.target !== txtBtn) {
    cerrarPopover();
  }
});

txtBtn.addEventListener("mouseenter", () => {
  if (!popoverOpen) txtBtn.style.color = "#555";
});
txtBtn.addEventListener("mouseleave", () => {
  if (!popoverOpen) txtBtn.style.color = "#bbb";
});
