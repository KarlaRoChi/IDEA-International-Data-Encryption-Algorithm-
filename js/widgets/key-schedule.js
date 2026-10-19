/*
 * key-schedule.js — Bloque 2.
 *  - BlockSplit: un bloque de 64 bits se divide en X1..X4 de 16 bits.
 *  - KeySchedule: 128 bits -> 52 subclaves mediante rotaciones de 25 bits.
 * Cada bit de la clave original conserva su color, así se ve la rotación.
 */
(function () {
  'use strict';
  const W = window.Widgets;
  const I = () => window.IDEA;

  /* -------------------- División del bloque -------------------- */
  W.BlockSplit = function (container, opts = {}) {
    let hex = opts.block || '4944 4541 3139 3931';
    let split = false;
    const el = W.html(`<div class="w block-split">
      <div class="bs-controls">
        <label class="field"><span>Bloque de 64 bits (hex)</span><input class="hex-in wide" spellcheck="false" maxlength="24"></label>
        <button class="btn primary" data-a="split">Dividir en 4 palabras</button>
        <button class="btn" data-a="ascii">Texto «IDEA1991»</button>
        <span class="err"></span>
      </div>
      <div class="bs-strip"></div>
      <div class="bs-words"></div>
    </div>`);
    container.appendChild(el);
    const inp = el.querySelector('input');
    inp.value = hex;

    function render() {
      let ws;
      try { ws = I().hexToWords(hex, 4); el.querySelector('.err').textContent = ''; inp.classList.remove('invalid'); }
      catch (e) { el.querySelector('.err').textContent = e.message; inp.classList.add('invalid'); return; }
      const bits = ws.map((w) => I().bin16(w)).join('');
      el.querySelector('.bs-strip').innerHTML = Array.from(bits, (b, i) =>
        `<span class="sbit w${Math.floor(i / 16) + 1} ${b === '1' ? 'one' : ''}" style="--d:${i * 6}ms"></span>`).join('');
      el.querySelector('.bs-strip').classList.toggle('split', split);
      el.querySelector('.bs-words').innerHTML = ws.map((w, i) =>
        `<div class="bs-word w${i + 1} ${split ? 'show' : ''}" style="--d:${120 + i * 90}ms"><b>X<sub>${i + 1}</sub></b><span class="mono">${W.hex(w)}</span><small>bits ${16 * i}–${16 * i + 15}</small></div>`).join('');
    }
    inp.addEventListener('input', () => { hex = inp.value; render(); });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.a === 'split') { split = !split; b.textContent = split ? 'Unir de nuevo' : 'Dividir en 4 palabras'; }
      if (b.dataset.a === 'ascii') {
        hex = Array.from('IDEA1991', (c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('').toUpperCase();
        inp.value = W.prettyHex(hex);
      }
      render();
    });
    render();
    const toggle = () => el.querySelector('[data-a="split"]').click();
    return { next: () => { if (!split) toggle(); }, prev: () => { if (split) toggle(); } };
  };

  /* -------------------- Generación de subclaves -------------------- */
  W.KeySchedule = function (container, opts = {}) {
    let keyHex = opts.key || '5875 656A 6961 4C61 6926 4D61 7373 6579';
    let g = 0; // grupo visible 0..6 (rotaciones acumuladas = 25·g)
    const el = W.html(`<div class="w key-schedule">
      <div class="ks-controls">
        <label class="field"><span>Clave de 128 bits (hex)</span><input class="hex-in xwide" spellcheck="false" maxlength="48"></label>
        <span class="err"></span>
      </div>
      <div class="ks-main">
        <div class="ks-left">
          <div class="ks-state"><span class="ks-rot"></span><span class="ks-range"></span></div>
          <div class="ks-bits"></div>
          <div class="ks-extract"></div>
          <div class="ks-buttons">
            <button class="btn" data-a="reset" title="Volver a la clave original">⟲ Reiniciar</button>
            <button class="btn" data-a="prev">◀ Anterior</button>
            <button class="btn primary" data-a="next">Rotar 25 bits ▶</button>
          </div>
        </div>
        <div class="ks-table" aria-label="Tabla de las 52 subclaves"></div>
      </div>
    </div>`);
    container.appendChild(el);
    const inp = el.querySelector('input');
    inp.value = keyHex;

    function render() {
      let key;
      try { key = I().hexToWords(keyHex, 8); el.querySelector('.err').textContent = ''; inp.classList.remove('invalid'); }
      catch (e) { el.querySelector('.err').textContent = e.message; inp.classList.add('invalid'); return; }
      const { Z, groups } = I().expandKey(key);
      const grp = groups[g];
      el.querySelector('.ks-rot').innerHTML = g === 0 ? 'Clave original' : `Clave rotada <b>${25 * g}</b> bits a la izquierda (${g} × 25)`;
      const first = 8 * g + 1, last = Math.min(8 * g + 8, 52);
      el.querySelector('.ks-range').innerHTML = `→ subclaves <b>Z${first}…Z${last}</b>`;
      // 128 celdas; el color indica la posición ORIGINAL del bit en la clave
      const bits = grp.words.map((w) => I().bin16(w)).join('');
      const rot = 25 * g;
      el.querySelector('.ks-bits').innerHTML = Array.from({ length: 8 }, (_, wi) => {
        const used = 8 * g + wi < 52;
        let cells = '';
        for (let j = 0; j < 16; j++) {
          const pos = 16 * wi + j;
          const orig = (pos + rot) % 128;
          cells += `<span class="kb ${bits[pos] === '1' ? 'one' : ''}" style="--h:${Math.round((orig / 128) * 300)}" title="bit original ${orig}"></span>`;
        }
        return `<div class="kw ${used ? '' : 'unused'}"><div class="kw-cells">${cells}</div><div class="kw-lbl">${used ? `Z<sub>${8 * g + wi + 1}</sub>` : 'no se usa'}</div></div>`;
      }).join('');
      el.querySelector('.ks-extract').innerHTML = grp.words.map((w, wi) => {
        const n = 8 * g + wi;
        if (n >= 52) return '';
        const r = Math.floor(n / 6) + 1;
        return `<span class="kx">Z<sub>${n + 1}</sub> = <b class="mono">${W.hex(w)}</b> <small>${r <= 8 ? 'ronda ' + r : 'salida'}</small></span>`;
      }).join('');
      // Tabla: 9 filas (8 rondas + transformación de salida), 6 columnas
      let rows = '';
      for (let r = 0; r < 9; r++) {
        const n = r < 8 ? 6 : 4;
        let cells = '';
        for (let k = 0; k < 6; k++) {
          const idx = 6 * r + k;
          if (k >= n) { cells += '<td class="empty"></td>'; continue; }
          const known = idx < 8 * (g + 1);
          const fresh = idx >= 8 * g && idx < 8 * (g + 1);
          const op = r < 8 ? ['mul', 'add', 'add', 'mul', 'mul', 'mul'][k] : ['mul', 'add', 'add', 'mul'][k];
          cells += `<td class="${known ? 'known' : ''} ${fresh ? 'fresh' : ''} t-${op}"><small>Z${idx + 1}</small><span class="mono">${known ? W.hex(Z[idx]) : '····'}</span></td>`;
        }
        rows += `<tr class="${r === 8 ? 'final' : ''}"><th>${r < 8 ? 'R' + (r + 1) : 'Salida'}</th>${cells}</tr>`;
      }
      el.querySelector('.ks-table').innerHTML = `<table><thead><tr><th></th><th>⊙</th><th>⊞</th><th>⊞</th><th>⊙</th><th>⊙ MA</th><th>⊙ MA</th></tr></thead><tbody>${rows}</tbody></table>`;
      el.querySelector('[data-a="next"]').disabled = g === 6;
      el.querySelector('[data-a="prev"]').disabled = g === 0;
    }
    inp.addEventListener('input', () => { keyHex = inp.value; render(); });
    const step = (d) => { g = Math.max(0, Math.min(6, g + d)); render(); };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.a === 'next') step(1);
      if (b.dataset.a === 'prev') step(-1);
      if (b.dataset.a === 'reset') { g = 0; render(); }
    });
    render();
    return { next: () => step(1), prev: () => step(-1) };
  };
})();
