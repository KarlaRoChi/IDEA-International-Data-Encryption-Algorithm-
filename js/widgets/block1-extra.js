/*
 * block1-extra.js — Bloque 1. Línea de tiempo histórica y "laboratorio de
 * leyes" que muestra por qué las tres operaciones de IDEA no se combinan bien
 * algebraicamente (no hay distributividad ni asociatividad entre ellas).
 */
(function () {
  'use strict';
  const W = window.Widgets;

  /* -------------------- Línea de tiempo -------------------- */
  const EVENTS = [
    { year: '1977', title: 'DES, estándar federal', text: 'El NBS publica DES (FIPS 46): bloque de 64 bits y clave efectiva de <b>56 bits</b>, pensado para hardware.', ref: 'fips46' },
    { year: '1990', title: 'Criptoanálisis diferencial', text: 'Biham y Shamir presentan el criptoanálisis diferencial en CRYPTO ’90. Cambia la forma de evaluar los cifradores por bloques.', ref: 'biham-shamir-1991' },
    { year: '1990', title: 'PES en EUROCRYPT ’90', text: 'Xuejia Lai y James L. Massey, del <b>ETH Zúrich</b>, proponen PES: mezclar operaciones de <b>grupos algebraicos distintos</b>.', ref: 'lai-massey-1990' },
    { year: '1991', title: 'IPES: PES reforzado', text: 'Lai, Massey y Murphy relacionan los cifradores de Markov con el ataque diferencial y presentan una versión mejorada, IPES.', ref: 'lai-massey-murphy-1991' },
    { year: '1992', title: 'Nace el nombre IDEA', text: 'La tesis doctoral de Lai en el ETH (dirigida por Massey) describe el cifrador como IDEA e incluye su vector de prueba.', ref: 'lai-1992' },
    { year: '1992', title: 'PGP 2.0', text: 'Phil Zimmermann sustituye BassOmatic, el cifrador de PGP 1.0, por IDEA. Así IDEA llega a usarse en todo el mundo.', ref: 'garfinkel-1994' },
  ];

  W.Timeline = function (container) {
    const el = W.html(`<div class="w timeline">
      <div class="tl-track">${EVENTS.map((e, i) => `<button class="tl-ev" data-i="${i}"><span class="tl-year">${e.year}</span><span class="tl-dot"></span><span class="tl-title">${e.title}</span></button>`).join('')}</div>
      <div class="tl-detail card"></div>
    </div>`);
    container.appendChild(el);
    let cur = 0;
    function show(i) {
      cur = Math.max(0, Math.min(EVENTS.length - 1, i));
      el.querySelectorAll('.tl-ev').forEach((b, k) => { b.classList.toggle('active', k === cur); b.classList.toggle('past', k < cur); });
      const e = EVENTS[cur];
      const r = window.REFS.byId[e.ref];
      el.querySelector('.tl-detail').innerHTML = `<div class="tl-d-year">${e.year}</div><div><h3>${e.title}</h3><p>${e.text}</p><p class="xsmall muted">Fuente: [${r.n}] ${r.short}</p></div>`;
    }
    el.addEventListener('click', (ev) => { const b = ev.target.closest('.tl-ev'); if (b) show(+b.dataset.i); });
    show(0);
    return { next: () => show(cur + 1), prev: () => show(cur - 1) };
  };

  /* -------------------- Laboratorio de leyes -------------------- */
  W.LawsLab = function (container) {
    const I = window.IDEA;
    const LAWS = [
      { id: 'dist', tex: 'a \\odot (b \\boxplus c) \\overset{?}{=} (a \\odot b) \\boxplus (a \\odot c)', name: 'Distributividad de ⊙ sobre ⊞',
        l: (a, b, c) => I.mul(a, I.add(b, c)), r: (a, b, c) => I.add(I.mul(a, b), I.mul(a, c)) },
      { id: 'dist2', tex: 'a \\boxplus (b \\oplus c) \\overset{?}{=} (a \\boxplus b) \\oplus (a \\boxplus c)', name: 'Distributividad de ⊞ sobre ⊕',
        l: (a, b, c) => I.add(a, I.xor(b, c)), r: (a, b, c) => I.xor(I.add(a, b), I.add(a, c)) },
      { id: 'assoc', tex: 'a \\oplus (b \\boxplus c) \\overset{?}{=} (a \\oplus b) \\boxplus c', name: 'Asociatividad mixta ⊕ / ⊞',
        l: (a, b, c) => I.xor(a, I.add(b, c)), r: (a, b, c) => I.add(I.xor(a, b), c) },
    ];
    const el = W.html(`<div class="w laws">
      <div class="laws-head">
        <div class="mono triple"></div>
        <button class="btn" data-a="new">Nueva terna</button>
        <button class="btn primary" data-a="run">Probar 100 000 ternas</button>
      </div>
      <div class="laws-list">${LAWS.map((L) => `<div class="law" data-id="${L.id}">
          <div class="law-tex">\\(${L.tex}\\)</div>
          <div class="law-ex mono"></div>
          <div class="law-stat"><div class="bar"><span></span></div><b class="pct">—</b></div>
        </div>`).join('')}</div>
    </div>`);
    container.appendChild(el);
    W.math(el);
    const rnd = W.rng(0xBEEF);
    let t = [0x1234, 0x0F0F, 0xA5A5];

    function example() {
      const [a, b, c] = t;
      el.querySelector('.triple').innerHTML = `a = ${W.hex(a)} · b = ${W.hex(b)} · c = ${W.hex(c)}`;
      LAWS.forEach((L) => {
        const l = L.l(a, b, c), r = L.r(a, b, c);
        const ok = l === r;
        el.querySelector(`.law[data-id="${L.id}"] .law-ex`).innerHTML =
          `${W.hex(l)} ${ok ? '=' : '≠'} ${W.hex(r)} <span class="${ok ? 'ok-text' : 'bad-text'}">${ok ? '✓ coincide' : '✗ no coincide'}</span>`;
      });
    }
    function run() {
      const N = 100000;
      LAWS.forEach((L) => {
        let hits = 0;
        for (let i = 0; i < N; i++) { const a = rnd(), b = rnd(), c = rnd(); if (L.l(a, b, c) === L.r(a, b, c)) hits++; }
        const p = (100 * hits) / N;
        const row = el.querySelector(`.law[data-id="${L.id}"]`);
        row.querySelector('.bar span').style.width = `${Math.max(p, 0.6)}%`;
        row.querySelector('.pct').textContent = `${p.toFixed(p < 1 ? 3 : 1)} % se cumple`;
      });
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.a === 'new') { t = [rnd(), rnd(), rnd()]; example(); }
      if (b.dataset.a === 'run') run();
    });
    example();
    return { next: () => { t = [rnd(), rnd(), rnd()]; example(); } };
  };
})();
