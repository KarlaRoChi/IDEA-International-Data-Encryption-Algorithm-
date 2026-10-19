/*
 * common.js — Utilidades compartidas por los componentes interactivos.
 */
(function () {
  'use strict';
  const W = (window.Widgets = window.Widgets || {});

  /** Crea un elemento a partir de HTML. */
  W.html = (s) => {
    const t = document.createElement('template');
    t.innerHTML = s.trim();
    return t.content.firstElementChild;
  };

  /** Metadatos visuales de cada operación (colores consistentes en todo el sitio). */
  W.OPS = {
    xor: { sym: '⊕', name: 'XOR', cls: 'op-xor', color: 'var(--xor)', group: '(ℤ₂)¹⁶' },
    add: { sym: '⊞', name: 'suma mód 2¹⁶', cls: 'op-add', color: 'var(--add)', group: 'ℤ₂₁₆' },
    mul: { sym: '⊙', name: 'mult. mód 2¹⁶+1', cls: 'op-mul', color: 'var(--mul)', group: 'ℤ*₆₅₅₃₇' },
  };

  W.hex = (w) => window.IDEA.hex16(w);

  /** Fila de 16 bits como celdas; opcionalmente clicables. */
  W.bitsHtml = (w, opts = {}) => {
    const b = window.IDEA.bin16(w);
    let out = '';
    for (let i = 0; i < 16; i++) {
      const cls = ['bit', b[i] === '1' ? 'one' : 'zero'];
      if (opts.diff && opts.diff[i]) cls.push('diff');
      if (i % 4 === 0 && i) cls.push('nib');
      out += `<span class="${cls.join(' ')}" data-i="${i}">${b[i]}</span>`;
    }
    return `<span class="bits ${opts.cls || ''}">${out}</span>`;
  };

  /** Generador pseudoaleatorio con semilla (demostraciones reproducibles). */
  W.rng = (seed = 0x1D3A) => {
    let s = seed >>> 0;
    return () => {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s & 0xffff;
    };
  };

  /** Aleatoriedad real del navegador para el botón "aleatorio". */
  W.randomHex = (nWords) => {
    const a = new Uint16Array(nWords);
    crypto.getRandomValues(a);
    return Array.from(a, (x) => window.IDEA.hex16(x)).join(' ');
  };

  /** Agrupa un hex en palabras de 4 dígitos separadas por espacio. */
  W.prettyHex = (s) => window.IDEA.cleanHex(s).replace(/(.{4})(?=.)/g, '$1 ');

  /** Renderiza fórmulas KaTeX dentro de un nodo recién creado. */
  W.math = (el) => { if (window.DECK_renderMath) window.DECK_renderMath(el); };
})();
