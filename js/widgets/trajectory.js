/*
 * trajectory.js — Bloque 2. Cómo se transforma el bloque ronda a ronda y
 * cuántos bits cambian si se invierte un único bit del texto en claro.
 */
(function () {
  'use strict';
  const W = window.Widgets;
  const pop = (x) => { let c = 0; while (x) { c += x & 1; x >>>= 1; } return c; };

  W.Trajectory = function (container, opts = {}) {
    const I = window.IDEA;
    const ptHex = opts.plaintext || '4944 4541 3139 3931';
    const keyHex = opts.key || '5875 656A 6961 4C61 6926 4D61 7373 6579';
    // Secuencia determinista de bits a invertir (para repetir la demo)
    const FLIPS = [63, 0, 31, 40, 17];
    let fi = -1;
    const el = W.html(`<div class="w traj">
      <div class="traj-controls">
        <button class="btn primary" data-a="flip">Invertir 1 bit del texto en claro</button>
        <button class="btn" data-a="clear">Quitar el cambio</button>
        <span class="traj-msg muted"></span>
      </div>
      <div class="traj-table"></div>
    </div>`);
    container.appendChild(el);
    const states = (t) => [t.input, ...t.rounds.map((r) => r.output), t.output];

    function render() {
      const A = I.trace(ptHex, keyHex);
      const sa = states(A);
      let sb = null;
      const flip = fi >= 0 ? FLIPS[fi] : -1;
      if (flip >= 0) {
        const w = I.hexToWords(ptHex, 4);
        w[flip >> 4] ^= 1 << (15 - (flip & 15));
        sb = states(I.trace(I.wordsToHex(w, ''), keyHex));
      }
      const labels = ['P', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'C'];
      el.querySelector('.traj-table').innerHTML = sa.map((ws, i) => {
        let diff = 0;
        const cells = ws.map((w, k) => {
          const d = sb ? w ^ sb[i][k] : 0;
          diff += pop(d);
          return `<b class="mono ${d ? 'chg' : ''}">${W.hex(sb ? sb[i][k] : w)}</b>`;
        }).join('');
        return `<div class="tr-row ${i === 9 ? 'fin' : ''}"><span class="tr-l">${labels[i]}</span>${cells}
          <span class="tr-bar"><span style="width:${(100 * diff) / 64}%"></span></span><span class="tr-n mono">${sb ? diff + ' / 64 bits' : ''}</span></div>`;
      }).join('');
      el.querySelector('.traj-msg').textContent = flip >= 0
        ? `Bit ${flip} del texto en claro invertido. En color, las palabras que cambian.`
        : 'Estado del bloque tras cada ronda (valores reales del ejemplo del visualizador).';
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.a === 'flip') fi = (fi + 1) % FLIPS.length;
      if (b.dataset.a === 'clear') fi = -1;
      render();
    });
    render();
    return { next: () => { fi = (fi + 1) % FLIPS.length; render(); }, prev: () => { fi = -1; render(); } };
  };
})();
