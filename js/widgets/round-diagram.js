/*
 * round-diagram.js — Diagrama vectorial (SVG) de una ronda de IDEA.
 *
 * Reproduce la estructura de Lai y Massey: capa de subclaves (pasos 1–4),
 * entradas de la caja MA (5–6), caja MA (7–10), mezcla de salida (11–14)
 * y cruce de los bloques centrales. Puede mostrar valores reales de una traza
 * y resaltar un paso concreto.
 *
 *   const d = Widgets.RoundDiagram(container, { values: true });
 *   d.setRound(roundTrace);   // valores de idea.trace(...).rounds[i]
 *   d.highlight(7);           // resalta el paso 7 (null = ninguno)
 *   d.focus('ma');            // atenúa todo excepto la caja MA
 */
(function () {
  'use strict';
  const W = window.Widgets;

  // Geometría (coordenadas del viewBox)
  const L = [80, 230, 530, 680];            // carriles X1..X4
  const MA = { a: 330, b: 430 };            // columnas de la caja MA
  const Y = { in: 34, key: 110, x5: 196, x6: 236, m1: 300, m2: 380, o1: 462, o2: 522, cross0: 566, cross1: 626, out: 668 };

  // Definición de los 14 nodos: [paso, op, x, y, zona, etiqueta de subclave, lado de la subclave]
  const NODES = [
    [1, 'mul', L[0], Y.key, 'key', 'Z1', 'l'],
    [2, 'add', L[1], Y.key, 'key', 'Z2', 'l'],
    [3, 'add', L[2], Y.key, 'key', 'Z3', 'r'],
    [4, 'mul', L[3], Y.key, 'key', 'Z4', 'r'],
    [5, 'xor', MA.a, Y.x5, 'ma-in'],
    [6, 'xor', MA.b, Y.x6, 'ma-in'],
    [7, 'mul', MA.a, Y.m1, 'ma', 'Z5', 'l'],
    [8, 'add', MA.b, Y.m1, 'ma'],
    [9, 'mul', MA.b, Y.m2, 'ma', 'Z6', 'r'],
    [10, 'add', MA.a, Y.m2, 'ma'],
    [11, 'xor', L[0], Y.o1, 'out'],
    [12, 'xor', L[2], Y.o1, 'out'],
    [13, 'xor', L[1], Y.o2, 'out'],
    [14, 'xor', L[3], Y.o2, 'out'],
  ];

  // Conexiones: [d (path), zona, paso del que procede el valor]
  const WIRES = [
    // carriles hasta la capa de subclaves
    [`M${L[0]} ${Y.in + 14}V${Y.key - 17}`, 'key', 0], [`M${L[1]} ${Y.in + 14}V${Y.key - 17}`, 'key', 0],
    [`M${L[2]} ${Y.in + 14}V${Y.key - 17}`, 'key', 0], [`M${L[3]} ${Y.in + 14}V${Y.key - 17}`, 'key', 0],
    // carriles hasta la mezcla de salida
    [`M${L[0]} ${Y.key + 17}V${Y.o1 - 17}`, 'key', 1], [`M${L[2]} ${Y.key + 17}V${Y.o1 - 17}`, 'key', 3],
    [`M${L[1]} ${Y.key + 17}V${Y.o2 - 17}`, 'key', 2], [`M${L[3]} ${Y.key + 17}V${Y.o2 - 17}`, 'key', 4],
    // entradas a la caja MA
    [`M${L[0]} ${Y.x5}H${MA.a - 17}`, 'ma-in', 1], [`M${L[2]} ${Y.x5}H${MA.a + 17}`, 'ma-in', 3],
    [`M${L[1]} ${Y.x6}H${MA.b - 17}`, 'ma-in', 2], [`M${L[3]} ${Y.x6}H${MA.b + 17}`, 'ma-in', 4],
    // caja MA
    [`M${MA.a} ${Y.x5 + 17}V${Y.m1 - 17}`, 'ma', 5], [`M${MA.b} ${Y.x6 + 17}V${Y.m1 - 17}`, 'ma', 6],
    [`M${MA.a + 17} ${Y.m1}H${MA.b - 17}`, 'ma', 7], [`M${MA.b} ${Y.m1 + 17}V${Y.m2 - 17}`, 'ma', 8],
    [`M${MA.b - 17} ${Y.m2}H${MA.a + 17}`, 'ma', 9], [`M${MA.a} ${Y.m1 + 17}V${Y.m2 - 17}`, 'ma', 7],
    // salidas de la caja MA hacia la mezcla
    [`M${MA.b} ${Y.m2 + 17}V${Y.o1}H${L[0] + 17}`, 'out', 9], [`M${MA.b} ${Y.o1}H${L[2] - 17}`, 'out', 9],
    [`M${MA.a} ${Y.m2 + 17}V${Y.o2}H${L[1] + 17}`, 'out', 10], [`M${L[1] + 17} ${Y.o2}`, 'out', 10],
    [`M${MA.a} ${Y.o2}H${L[3] - 17}`, 'out', 10],
    // salidas
    [`M${L[0]} ${Y.o1 + 17}V${Y.out - 16}`, 'out', 11], [`M${L[3]} ${Y.o2 + 17}V${Y.out - 16}`, 'out', 14],
  ];

  function glyph(op, x, y) {
    const r = 17;
    if (op === 'add') {
      return `<rect class="node-shape" x="${x - r + 1}" y="${y - r + 1}" width="${2 * r - 2}" height="${2 * r - 2}" rx="4"/>
              <path class="node-mark" d="M${x - 9} ${y}H${x + 9}M${x} ${y - 9}V${y + 9}"/>`;
    }
    if (op === 'xor') {
      return `<circle class="node-shape" cx="${x}" cy="${y}" r="${r}"/>
              <path class="node-mark" d="M${x - r} ${y}H${x + r}M${x} ${y - r}V${y + r}"/>`;
    }
    return `<circle class="node-shape" cx="${x}" cy="${y}" r="${r}"/>
            <circle class="node-dot" cx="${x}" cy="${y}" r="5.5"/>`;
  }

  function svg(opts) {
    const nodes = NODES.map(([n, op, x, y, zone, key, side]) => {
      let keyEl = '';
      if (key) {
        const kx = side === 'l' ? x - 62 : x + 62;
        const ax = side === 'l' ? x - 38 : x + 38;
        const ex = side === 'l' ? x - 19 : x + 19;
        keyEl = `<g class="key" data-key="${n}">
          <path class="wire key-wire" d="M${ax} ${y}H${ex}" marker-end="url(#arr)"/>
          <text class="key-label" x="${kx}" y="${y + 6}" text-anchor="middle">${key}</text>
          <text class="key-val" x="${kx}" y="${y + 28}" text-anchor="middle"></text>
        </g>`;
      }
      // Posición de la etiqueta de valor de salida del nodo
      let vx = x + 24, vy = y - 22, anchor = 'start';
      if (n === 5 || n === 7 || n === 10) { vx = x - 24; anchor = 'end'; }
      if (n === 10) vy = y + 32;
      if (n === 9) vy = y + 32;
      if (n === 12 || n === 13) { vx = x + 24; vy = y + 34; }
      if (n === 11) { vx = x + 24; vy = y + 34; }
      if (n === 14) { vx = x - 24; vy = y + 34; anchor = 'end'; }
      return `<g class="node op-${op}" data-step="${n}" data-zone="${zone}">
        ${glyph(op, x, y)}
        <text class="step-num" x="${x}" y="${y + (n <= 4 ? -24 : 4)}" text-anchor="middle" ${n <= 4 ? '' : 'dy="-26"'}>${n}</text>
        <text class="val" x="${vx}" y="${vy}" text-anchor="${anchor}"></text>
        ${keyEl}
      </g>`;
    }).join('');

    const wires = WIRES.map(([d, zone, from]) => `<path class="wire" data-zone="${zone}" data-from="${from}" d="${d}"/>`).join('');

    // Cruce de los bloques centrales (desde los nodos 12 y 13)
    const cross = `<g class="cross" data-zone="out">
      <path class="wire" data-from="13" d="M${L[1]} ${Y.o2 + 17}V${Y.cross0}L${L[2]} ${Y.cross1}V${Y.out - 16}"/>
      <path class="wire" data-from="12" d="M${L[2]} ${Y.o1 + 17}V${Y.cross0}L${L[1]} ${Y.cross1}V${Y.out - 16}"/>
      <path class="wire nocross" data-from="13" d="M${L[1]} ${Y.o2 + 17}V${Y.out - 16}"/>
      <path class="wire nocross" data-from="12" d="M${L[2]} ${Y.o1 + 17}V${Y.out - 16}"/>
    </g>
    <g class="final-only">${[[L[0], Y.o1], [L[1], Y.o2], [L[2], Y.o1], [L[3], Y.o2]].map(([x, y]) => `<path class="wire" d="M${x} ${y - 18}V${Y.out - 16}"/>`).join('')}</g>`;

    const io = (y, cls, pre) => L.map((x, i) => `<g class="io ${cls}">
        <text class="io-label" x="${x}" y="${y}" text-anchor="middle">${pre}${i + 1}</text>
        <text class="io-val" x="${x}" y="${y + (cls === 'in' ? -2 : 24)}" text-anchor="middle" dx="${cls === 'in' ? 0 : 0}"></text>
      </g>`).join('');

    return `<svg class="round-svg ${opts.compact ? 'compact' : ''}" viewBox="-20 -26 800 726" role="img" aria-label="Diagrama de una ronda de IDEA">
      <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--key)"/></marker></defs>
      <rect class="ma-box" x="${MA.a - 52}" y="${Y.m1 - 40}" width="${MA.b - MA.a + 104}" height="${Y.m2 - Y.m1 + 80}" rx="14"/>
      <text class="ma-label" x="${MA.b + 66}" y="${Y.m1 + 2}" text-anchor="middle" transform="rotate(90 ${MA.b + 66} ${Y.m1 + 2})">caja MA</text>
      ${wires}${cross}${nodes}
      <g class="io-in">${io(Y.in, 'in', 'X')}</g>
      <g class="io-out">${io(Y.out + 4, 'out', 'Y')}</g>
    </svg>`;
  }

  W.RoundDiagram = function (container, opts = {}) {
    const wrap = W.html(`<div class="round-diagram"></div>`);
    wrap.innerHTML = svg(opts);
    container.appendChild(wrap);
    const root = wrap.querySelector('svg');
    const q = (s) => root.querySelectorAll(s);

    const api = {
      el: wrap,
      /** Muestra valores de una ronda (o los borra con null). upTo limita los pasos visibles. */
      setRound(r, upTo = 14) {
        q('.val').forEach((t) => (t.textContent = ''));
        q('.key-val').forEach((t) => (t.textContent = ''));
        q('.io-val').forEach((t) => (t.textContent = ''));
        root.classList.toggle('last-round', !!(r && !r.swap));
        root.classList.toggle('final-mode', !!(r && r.round === 9));
        if (!r) return;
        q('.io.in .io-val').forEach((t, i) => (t.textContent = W.hex(r.input[i])));
        const keyN = { 1: 0, 2: 1, 3: 2, 4: 3, 7: 4, 9: 5 };
        r.steps.forEach((st) => {
          const g = root.querySelector(`.node[data-step="${st.n}"]`);
          if (!g) return;
          if (st.n <= upTo) g.querySelector('.val').textContent = W.hex(st.out);
          if (keyN[st.n] != null) {
            const kv = g.querySelector('.key-val');
            if (kv) kv.textContent = W.hex(r.subkeys[keyN[st.n]]);
            const kl = g.querySelector('.key-label');
            if (kl) kl.textContent = `${r.keyName || 'Z'}${r.subkeyIndex + keyN[st.n] + 1}`;
          }
        });
        if (upTo >= 15) q('.io.out .io-val').forEach((t, i) => (t.textContent = W.hex(r.output[i])));
        q('.node').forEach((g) => g.classList.toggle('done', +g.dataset.step <= upTo));
      },
      /** Resalta un paso y los pasos que le dan sus operandos. */
      highlight(n) {
        root.classList.toggle('has-focus', n != null);
        const deps = n != null ? DEPS[n] || [] : [];
        q('.node').forEach((g) => {
          const k = +g.dataset.step;
          g.classList.toggle('hl', k === n);
          g.classList.toggle('src', deps.includes(k));
        });
        q('.io.in').forEach((g) => g.classList.toggle('src', deps.includes(0)));
      },
      /** Atenúa todo lo que no pertenezca a la zona indicada (o null). */
      focus(zone) {
        root.dataset.focus = zone || '';
      },
      /** Muestra/oculta el cruce (rondas 1–7 lo tienen; la 8 no). */
      setSwap(on) { root.classList.toggle('last-round', !on); },
    };
    return api;
  };

  // Pasos de los que depende cada paso (para resaltar cables)
  const DEPS = { 1: [0], 2: [0], 3: [0], 4: [0], 5: [1, 3], 6: [2, 4], 7: [5], 8: [6, 7], 9: [8], 10: [7, 9], 11: [1, 9], 12: [3, 9], 13: [2, 10], 14: [4, 10], 15: [11, 12, 13, 14] };
})();
