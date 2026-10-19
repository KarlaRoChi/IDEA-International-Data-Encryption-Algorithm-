/*
 * walkthrough.js — Bloque 3.
 *  - RoundWalkthrough: las 14 operaciones de la ronda 1 del ejemplo, una a una,
 *    con la aritmética explicada (incluido el tratamiento del 0 en ⊙).
 *  - RoundsSummary: estado tras cada ronda y transformación de salida.
 * Todo se calcula con IDEA.trace() sobre el vector de prueba de Lai.
 */
(function () {
  'use strict';
  const W = window.Widgets;

  function explain(st) {
    const h = W.hex;
    if (st.op === 'xor') return `${h(st.a)} ⊕ ${h(st.b)} = ${h(st.out)}  (bit a bit, sin acarreos)`;
    if (st.op === 'add') {
      const s = st.a + st.b;
      return `${st.a} + ${st.b} = ${s}${s >= 65536 ? ` − 65536 = ${s - 65536}` : ''}  →  ${h(st.out)}`;
    }
    const a = st.a || 65536, b = st.b || 65536;
    const r = (a * b) % 65537;
    const zero = st.a === 0 || st.b === 0 ? '<br><span class="warn-text">0000 representa 2¹⁶ = 65536</span>' : '';
    return `${a} · ${b} = ${a * b} ≡ ${r} (mód 65537)${r === 65536 ? '  →  0000' : `  →  ${h(st.out)}`}${zero}`;
  }

  W.RoundWalkthrough = function (container, opts = {}) {
    const I = window.IDEA;
    const v = I.REFERENCE_VECTOR;
    const T = I.trace(opts.plaintext || v.plaintext, opts.key || v.key);
    const R = T.rounds[0];
    let s = 0; // 0 = entrada; 1..14 = pasos; 15 = salida de la ronda
    const el = W.html(`<div class="w walk">
      <div class="walk-left">
        <div class="walk-cur"></div>
        <ol class="walk-list">${R.steps.map((st) => `<li data-n="${st.n}" style="--oc:${W.OPS[st.op].color}"><span class="n">${st.n}</span><span class="lbl">${st.label}</span><b class="mono"></b></li>`).join('')}</ol>
        <div class="demo-controls">
          <button class="btn" data-a="reset" title="Reiniciar">⟲</button>
          <button class="btn" data-a="prev">◀ Paso</button>
          <button class="btn primary" data-a="next">Paso ▶</button>
          <button class="btn" data-a="all">Toda la ronda ⏩</button>
        </div>
      </div>
      <div class="walk-diagram"></div>
    </div>`);
    container.appendChild(el);
    const d = W.RoundDiagram(el.querySelector('.walk-diagram'), {});

    function render() {
      d.setRound(R, s);
      d.highlight(s >= 1 && s <= 14 ? s : null);
      el.querySelectorAll('.walk-list li').forEach((li) => {
        const n = +li.dataset.n;
        li.classList.toggle('shown', n <= s);
        li.classList.toggle('cur', n === s);
        li.querySelector('b').textContent = n <= s ? W.hex(R.steps[n - 1].out) : '';
      });
      const cur = el.querySelector('.walk-cur');
      if (s === 0) {
        cur.innerHTML = `<div class="walk-op">Entrada de la ronda 1</div>
          <div class="mono walk-ex">X1…X4 = <b>${I.wordsToHex(R.input)}</b><br>Z1…Z6 = <b class="k">${I.wordsToHex(R.subkeys)}</b></div>`;
      } else if (s <= 14) {
        const st = R.steps[s - 1];
        cur.innerHTML = `<div class="walk-op" style="--oc:${W.OPS[st.op].color}">Paso ${st.n} · ${st.label}</div><div class="mono walk-ex">${explain(st)}</div>`;
      } else {
        cur.innerHTML = `<div class="walk-op">Salida de la ronda 1, con el cruce: (11, 12, 13, 14)</div>
          <div class="mono walk-ex"><b>${I.wordsToHex(R.output)}</b></div>`;
      }
      el.querySelector('[data-a="prev"]').disabled = s === 0;
      el.querySelector('[data-a="next"]').disabled = s === 15;
    }
    const go = (n) => { s = Math.max(0, Math.min(15, n)); render(); };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      ({ next: () => go(s + 1), prev: () => go(s - 1), reset: () => go(0), all: () => go(15) })[b.dataset.a]();
    });
    render();
    return { next: () => go(s + 1), prev: () => go(s - 1) };
  };

  W.RoundsSummary = function (container, opts = {}) {
    const I = window.IDEA;
    const v = I.REFERENCE_VECTOR;
    const T = I.trace(opts.plaintext || v.plaintext, opts.key || v.key);
    let shown = 1; // rondas visibles 1..9 (9 = incluye la transformación de salida)
    const el = W.html(`<div class="w rsum">
      <table class="rsum-table"><thead><tr><th></th><th>Subclaves</th><th>X1</th><th>X2</th><th>X3</th><th>X4</th></tr></thead><tbody></tbody></table>
      <div class="rsum-side">
        <div class="final-ops"></div>
        <div class="rsum-verdict"></div>
        <div class="demo-controls"><button class="btn" data-a="prev">◀ Ronda</button><button class="btn primary" data-a="next">Ronda ▶</button><button class="btn" data-a="all">Hasta el final ⏩</button></div>
      </div>
    </div>`);
    container.appendChild(el);
    function render() {
      const fin = shown === 9;
      const rows = T.rounds.map((r, i) => `<tr class="${i < shown ? 'shown' : ''} ${i === shown - 1 && !fin ? 'cur' : ''}"><th>R${i + 1}</th><td class="mono k">Z${6 * i + 1}–Z${6 * i + 6}</td>${r.output.map((w) => `<td class="mono">${i < shown ? W.hex(w) : '····'}</td>`).join('')}</tr>`).join('');
      el.querySelector('tbody').innerHTML = `<tr class="shown"><th>P</th><td></td>${T.input.map((w) => `<td class="mono">${W.hex(w)}</td>`).join('')}</tr>` + rows +
        `<tr class="final ${fin ? 'shown cur' : ''}"><th>C</th><td class="mono k">Z49–Z52</td>${T.output.map((w) => `<td class="mono">${fin ? W.hex(w) : '····'}</td>`).join('')}</tr>`;
      el.querySelector('.final-ops').innerHTML = `<h4>Transformación de salida (sin caja MA)</h4>` + T.final.steps.map((st) =>
        `<div class="fop ${fin ? 'shown' : ''}" style="--oc:${W.OPS[st.op].color}"><span>${st.label}</span><span class="mono">${fin ? `${W.hex(st.a)} ${W.OPS[st.op].sym} ${W.hex(st.b)} = <b>${W.hex(st.out)}</b>` : '····'}</span></div>`).join('');
      const ok = I.wordsToHex(T.output, '') === v.ciphertext;
      el.querySelector('.rsum-verdict').innerHTML = fin
        ? `<div class="verdict ${ok ? 'ok' : 'bad'}"><div>Texto cifrado calculado</div><b class="mono">${I.wordsToHex(T.output)}</b><p>${ok ? '✓ Igual al publicado por Lai (1992): 11FB ED2B 0198 6DE5' : '✗ No coincide con el vector publicado'}</p></div>`
        : '';
      el.querySelector('[data-a="prev"]').disabled = shown === 1;
      el.querySelector('[data-a="next"]').disabled = fin;
    }
    const go = (n) => { shown = Math.max(1, Math.min(9, n)); render(); };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      ({ next: () => go(shown + 1), prev: () => go(shown - 1), all: () => go(9) })[b.dataset.a]();
    });
    render();
    return { next: () => go(shown + 1), prev: () => go(shown - 1) };
  };
})();
