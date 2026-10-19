/*
 * key-bits.js — Bloque 4. Qué bits de la clave maestra usa cada ronda.
 * La planificación de claves de IDEA solo SELECCIONA bits (no los mezcla).
 * Esa propiedad es la que aprovechan los ataques de encuentro a medio camino
 * y los de bicliques: adivinar una parte de la clave fija rondas enteras.
 */
(function () {
  'use strict';
  const W = window.Widgets;

  /** Posiciones (0 = bit más significativo de la clave) que forman la subclave i (base 0). */
  function bitsOfSubkey(i) {
    const g = Math.floor(i / 8), w = i % 8;
    const out = [];
    for (let j = 0; j < 16; j++) out.push((16 * w + j + 25 * g) % 128);
    return out;
  }
  W.bitsOfSubkey = bitsOfSubkey;

  W.KeyBitUsage = function (container) {
    let sel = [0];
    const el = W.html(`<div class="w kbu">
      <div class="kbu-rounds">${Array.from({ length: 9 }, (_, i) => `<button class="rail-btn" data-r="${i}">${i < 8 ? 'R' + (i + 1) : '½'}</button>`).join('')}
        <button class="chip" data-a="first">Rondas 1–2</button><button class="chip" data-a="last">Ronda 8 + ½</button></div>
      <div class="kbu-main"><div class="kbu-grid"></div><div class="kbu-info"></div></div>
    </div>`);
    container.appendChild(el);
    function render() {
      const used = new Set();
      sel.forEach((r) => { const n = r < 8 ? 6 : 4; for (let k = 0; k < n; k++) bitsOfSubkey(6 * r + k).forEach((b) => used.add(b)); });
      el.querySelectorAll('.rail-btn').forEach((b) => b.classList.toggle('active', sel.includes(+b.dataset.r)));
      el.querySelector('.kbu-grid').innerHTML = Array.from({ length: 128 }, (_, i) => `<span class="kbu-b ${used.has(i) ? 'on' : ''}" title="bit ${i}"></span>`).join('');
      const names = sel.slice().sort((a, b) => a - b).map((r) => (r < 8 ? 'R' + (r + 1) : '½')).join(', ');
      el.querySelector('.kbu-info').innerHTML = `<div class="big-number">${used.size}<small>/ 128</small></div>
        <p>bits de la clave fijan todas las subclaves de <b>${names}</b>.</p>
        <p class="small muted">Quien adivine esos ${used.size} bits puede calcular esa parte del cifrado sin conocer los otros ${128 - used.size}.</p>`;
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.r != null) {
        const r = +b.dataset.r;
        sel = sel.includes(r) ? sel.filter((x) => x !== r) : [...sel, r];
        if (!sel.length) sel = [r];
      }
      if (b.dataset.a === 'first') sel = [0, 1];
      if (b.dataset.a === 'last') sel = [7, 8];
      render();
    });
    render();
    return {};
  };
})();
