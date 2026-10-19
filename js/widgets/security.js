/*
 * security.js — Bloque 4. Visualizaciones de criptoanálisis y seguridad.
 *  - KeyspaceViz:  magnitud del espacio de claves y tiempo de búsqueda.
 *  - LayersViz:    seguridad teórica vs práctica (capas).
 *  - WeakKeyCheck: subclaves multiplicativas triviales (0 o 1).
 *  - AttacksViz:   rondas reducidas vs IDEA completo; fuerza bruta vs ataques estructurales.
 *  - CompareViz:   comparación conceptual DES / IDEA / AES.
 * Las cifras de los ataques provienen de js/data/references.js (ver "note").
 */
(function () {
  'use strict';
  const W = window.Widgets;
  const LOG10_2 = Math.log10(2);
  const SEC_YEAR = 365.25 * 24 * 3600;
  const UNIVERSE_YEARS = 1.38e10;

  /** Formatea un número en notación científica legible: 3,4 × 10^38 */
  function sci(log10v, digits = 1) {
    const e = Math.floor(log10v);
    const m = Math.pow(10, log10v - e);
    if (e < 4 && e > -3) return Math.pow(10, log10v).toLocaleString('es', { maximumFractionDigits: e >= 1 ? 0 : 2 });
    return `${m.toFixed(digits).replace('.', ',')} × 10<sup>${e}</sup>`;
  }
  function humanTime(log10s) {
    const log10y = log10s - Math.log10(SEC_YEAR);
    if (log10s < 0) return `${sci(log10s + 3)} ms`;
    if (log10s < Math.log10(60)) return `${sci(log10s)} s`;
    if (log10s < Math.log10(3600)) return `${sci(log10s - Math.log10(60))} min`;
    if (log10s < Math.log10(86400)) return `${sci(log10s - Math.log10(3600))} h`;
    if (log10y < 0) return `${sci(log10s - Math.log10(86400))} días`;
    return `${sci(log10y)} años`;
  }

  /* ------------------------------------------------------------------ */
  W.KeyspaceViz = function (container) {
    const el = W.html(`<div class="w keyspace">
      <div class="ks-sliders">
        <label class="slider"><span>Claves probadas por segundo y equipo</span><input type="range" min="6" max="15" step="0.5" value="12" data-s="rate"><b class="mono"></b></label>
        <label class="slider"><span>Número de equipos en paralelo</span><input type="range" min="0" max="9" step="0.5" value="6" data-s="dev"><b class="mono"></b></label>
      </div>
      <div class="ks-bars"></div>
      <div class="ks-scale"></div>
      <p class="xsmall muted">Búsqueda exhaustiva completa: 2<sup>n</sup> pruebas (en promedio basta la mitad). Edad del universo ≈ 1,38 × 10<sup>10</sup> años. Modelo idealizado: ignora energía, memoria y costes de comunicación.</p>
    </div>`);
    container.appendChild(el);
    const ROWS = [
      { name: 'DES', bits: 56, cls: 'des', note: 'clave efectiva de 56 bits' },
      { name: 'IDEA', bits: 128, cls: 'idea', note: '2<sup>128</sup> ≈ 3,4 × 10<sup>38</sup> claves' },
      { name: 'IDEA · mejor ataque publicado', bits: 126.06, cls: 'attack', note: 'biclique estrecho (2012), 2<sup>126,06</sup> operaciones con 2<sup>52</sup> textos' },
    ];
    function render() {
      const rate = parseFloat(el.querySelector('[data-s="rate"]').value);
      const dev = parseFloat(el.querySelector('[data-s="dev"]').value);
      el.querySelector('[data-s="rate"]').nextElementSibling.innerHTML = `10<sup>${rate}</sup>`;
      el.querySelector('[data-s="dev"]').nextElementSibling.innerHTML = `10<sup>${dev}</sup>`;
      const lps = rate + dev; // log10 claves/s totales
      // Eje en log10(segundos): de 0 (1 s) a 40
      const AX0 = -3, AX1 = 40;
      const xp = (l) => `${(100 * (Math.max(AX0, Math.min(AX1, l)) - AX0)) / (AX1 - AX0)}%`;
      el.querySelector('.ks-bars').innerHTML = ROWS.map((r) => {
        const ls = r.bits * LOG10_2 - lps;
        const vsU = ls - Math.log10(SEC_YEAR) - Math.log10(UNIVERSE_YEARS);
        return `<div class="ksr ${r.cls}"><div class="ksr-name">${r.name}<small>${r.note}</small></div>
          <div class="ksr-track"><span class="ksr-bar" style="width:max(6px, ${xp(ls)})"></span><span class="ksr-uni" style="left:${xp(Math.log10(SEC_YEAR * UNIVERSE_YEARS))}"></span></div>
          <div class="ksr-val"><b>${humanTime(ls)}</b><small>${vsU > 0 ? `${sci(vsU)} × la edad del universo` : ''}</small></div></div>`;
      }).join('');
      const marks = [[-3, '1 ms'], [Math.log10(86400), '1 día'], [Math.log10(SEC_YEAR * 1000), '1000 años'], [Math.log10(SEC_YEAR * UNIVERSE_YEARS), 'edad del universo'], [40, '10⁴⁰ s']];
      el.querySelector('.ks-scale').innerHTML = marks.map(([l, t]) => `<span style="left:${xp(l)}">${t}</span>`).join('');
    }
    el.addEventListener('input', render);
    render();
    return {};
  };

  /* ------------------------------------------------------------------ */
  W.LayersViz = function (container) {
    const LAYERS = [
      { t: 'Diseño del algoritmo', s: 'teórica', d: 'Las 8,5 rondas completas no tienen ningún ataque práctico conocido. Los mejores ataques reducen el coste de 2<sup>128</sup> a unas 2<sup>126</sup> operaciones, igual de inalcanzable.' },
      { t: 'Ataques conocidos', s: 'teórica', d: 'Los ataques eficaces afectan a versiones de <b>rondas reducidas</b> o a <b>clases de claves débiles</b> muy raras. Sirven para medir el margen de seguridad.' },
      { t: 'Implementación', s: 'práctica', d: 'La multiplicación mód 2<sup>16</sup>+1 debe tratar el 0 de forma especial. Una implementación con ramas o tiempos variables puede filtrar información (canales laterales). Es un problema del código, no del algoritmo.' },
      { t: 'Modo de operación y bloque', s: 'práctica', d: 'Con bloques de 64 bits, tras unos 2<sup>32</sup> bloques (≈ 32 GiB) con la misma clave aparecen colisiones por la paradoja del cumpleaños (ataques tipo Sweet32, 2016). ECB revela patrones.' },
      { t: 'Claves y su gestión', s: 'práctica', d: 'Las claves deben generarse al azar, por ejemplo con un generador criptográfico, y renovarse. Una contraseña débil o una clave reutilizada anulan los 128 bits.' },
    ];
    const el = W.html(`<div class="w layers">
      <div class="layers-stack">${LAYERS.map((L, i) => `<button class="layer ${L.s === 'teórica' ? 'th' : 'pr'}" data-i="${i}"><span>${L.t}</span><small>${L.s}</small></button>`).join('')}</div>
      <div class="layers-detail card"></div>
    </div>`);
    container.appendChild(el);
    let cur = 0;
    function show(i) {
      cur = Math.max(0, Math.min(LAYERS.length - 1, i));
      el.querySelectorAll('.layer').forEach((b, k) => b.classList.toggle('active', k === cur));
      const L = LAYERS[cur];
      el.querySelector('.layers-detail').innerHTML = `<div class="tag ${L.s === 'teórica' ? 'real' : 'didactic'}">Seguridad ${L.s}</div><h3>${L.t}</h3><p>${L.d}</p>`;
    }
    el.addEventListener('click', (e) => { const b = e.target.closest('.layer'); if (b) show(+b.dataset.i); });
    show(0);
    return { next: () => show(cur + 1), prev: () => show(cur - 1) };
  };

  /* ------------------------------------------------------------------ */
  W.WeakKeyCheck = function (container) {
    const I = window.IDEA;
    const PRE = [
      { l: 'Aleatoria', k: null },
      { l: 'Vector de Lai', k: '0001 0002 0003 0004 0005 0006 0007 0008' },
      { l: 'Casi toda a cero', k: '0000 0000 0000 0000 0000 0000 0000 0001' },
      { l: 'Toda a cero', k: '0000 0000 0000 0000 0000 0000 0000 0000' },
    ];
    // Posiciones (base 0) de las subclaves usadas en ⊙: Z1, Z4, Z5, Z6 de cada ronda y Z49, Z52
    const MULPOS = [];
    for (let r = 0; r < 8; r++) MULPOS.push(6 * r, 6 * r + 3, 6 * r + 4, 6 * r + 5);
    MULPOS.push(48, 51);
    const el = W.html(`<div class="w weak">
      <div class="weak-top">
        <label class="field"><span>Clave (hex)</span><input class="hex-in xwide" spellcheck="false"></label>
        <div class="weak-presets">${PRE.map((p, i) => `<button class="chip" data-i="${i}">${p.l}</button>`).join('')}</div>
      </div>
      <div class="weak-main">
        <div class="weak-grid"></div>
        <div class="weak-meter"></div>
      </div>
    </div>`);
    container.appendChild(el);
    const inp = el.querySelector('input');
    inp.value = W.randomHex(8);
    function render() {
      let key;
      try { key = I.hexToWords(inp.value, 8); inp.classList.remove('invalid'); } catch (e) { inp.classList.add('invalid'); return; }
      const { Z } = I.expandKey(key);
      let triv = 0;
      el.querySelector('.weak-grid').innerHTML = Z.map((z, i) => {
        const isMul = MULPOS.includes(i);
        const t = isMul && (z === 0 || z === 1);
        if (t) triv++;
        return `<span class="wz ${isMul ? 'mul' : 'add'} ${t ? 'triv' : ''}" title="Z${i + 1}${isMul ? ' (⊙)' : ' (⊞)'}">${W.hex(z)}</span>`;
      }).join('');
      const pct = (100 * triv) / MULPOS.length;
      el.querySelector('.weak-meter').innerHTML = `<div class="big-number">${triv}<small>/ ${MULPOS.length}</small></div>
        <p>subclaves multiplicativas iguales a <b class="mono">0000</b> o <b class="mono">0001</b></p>
        <div class="bar"><span style="width:${Math.max(pct, 1)}%"></span></div>
        <p class="small muted">${triv === 0 ? 'Ninguna multiplicación es trivial: comportamiento típico de una clave aleatoria.' : triv > 10 ? '⊙ actúa como x ↦ x o x ↦ −x en muchos puntos. Es la estructura casi lineal que aprovechan las clases de claves débiles.' : 'Algunas multiplicaciones son triviales.'}</p>`;
    }
    inp.addEventListener('input', render);
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      const p = PRE[+b.dataset.i];
      inp.value = p.k || W.randomHex(8);
      render();
    });
    render();
    return {};
  };

  /* ------------------------------------------------------------------ */
  const ATTACKS = [
    { rounds: 4.5, year: 1999, who: 'Biham, Biryukov, Shamir', type: 'Diferencial imposible', data: '—', time: null, ref: 'bbs-1999' },
    { rounds: 5, year: 2006, who: 'Biham, Dunkelman, Keller', type: 'Lineal + relación Biryukov–Demirci', data: '2¹⁹ conocidos', time: 103, ref: 'bdk-2006' },
    { rounds: 6, year: 2009, who: 'Sun, Lai', type: 'Dependiente de la clave', data: '2⁴⁹ elegidos', time: 112.1, ref: 'sun-lai-2009' },
    { rounds: 6, year: 2011, who: 'Biham, Dunkelman, Keller, Shamir', type: 'Encuentro a medio camino', data: '16 conocidos', time: 111.9, ref: 'bdks-2015' },
    { rounds: 7.5, year: 2011, who: 'Biham, Dunkelman, Keller, Shamir', type: 'Encuentro a medio camino', data: '2⁶³', time: 114, ref: 'bdks-2015' },
    { rounds: 7.5, year: 2012, who: 'Khovratovich, Leurent, Rechberger', type: 'Biclique estrecho', data: '2⁵²', time: 123.9, ref: 'klr-2012' },
    { rounds: 8.5, year: 2012, who: 'Khovratovich, Leurent, Rechberger', type: 'Biclique estrecho', data: '2⁵²', time: 126.06, ref: 'klr-2012', full: true },
    { rounds: 8.5, year: 2011, who: 'Biham, Dunkelman, Keller, Shamir', type: 'MITM optimizado («tipo fuerza bruta»)', data: '16 conocidos', time: 126.8, ref: 'bdks-2015', full: true },
    { rounds: 8.5, year: null, who: 'Referencia', type: 'Fuerza bruta (búsqueda exhaustiva)', data: '1–2 pares', time: 128, brute: true },
  ];

  W.AttacksViz = function (container) {
    let view = 'rounds';
    let sel = 6;
    const el = W.html(`<div class="w attacks">
      <div class="att-tabs" role="tablist">
        <button class="tab active" data-v="rounds">¿Cuántas rondas?</button>
        <button class="tab" data-v="cost">¿Cuánto cuesta? (log₂ del tiempo)</button>
      </div>
      <div class="att-chart"></div>
      <div class="att-detail"></div>
    </div>`);
    container.appendChild(el);
    function render() {
      el.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.v === view));
      const rows = ATTACKS.map((a, i) => {
        const r = window.REFS.byId[a.ref];
        let w, label;
        if (view === 'rounds') { w = (100 * a.rounds) / 8.5; label = `${String(a.rounds).replace('.', ',')} / 8,5`; }
        else {
          // eje de 96 a 128 bits para que se vean las diferencias
          w = a.time == null ? 0 : (100 * (a.time - 96)) / (128 - 96);
          label = a.time == null ? 's/d' : `2<sup>${String(a.time).replace('.', ',')}</sup>`;
        }
        return `<button class="att-row ${a.full ? 'full' : ''} ${a.brute ? 'brute' : ''} ${i === sel ? 'sel' : ''}" data-i="${i}">
          <span class="att-name">${a.who}${a.year ? ' · ' + a.year : ''}${r ? ` <small>[${r.n}]</small>` : ''}</span>
          <span class="att-track"><span class="att-bar" style="width:${Math.max(w, 0)}%"></span>${view === 'rounds' ? '<span class="att-full-line"></span>' : ''}</span>
          <span class="att-val">${label}</span></button>`;
      }).join('');
      const axis = view === 'rounds'
        ? `<div class="att-axis">${[0, 2, 4, 6, 8, 8.5].map((x) => `<span style="left:${(100 * x) / 8.5}%">${String(x).replace('.', ',')}</span>`).join('')}</div>`
        : `<div class="att-axis">${[96, 104, 112, 120, 128].map((x) => `<span style="left:${(100 * (x - 96)) / 32}%">2<sup>${x}</sup></span>`).join('')}</div>`;
      el.querySelector('.att-chart').innerHTML = rows + axis;
      const a = ATTACKS[sel];
      el.querySelector('.att-detail').innerHTML = `<b>${a.type}</b> · ${a.rounds === 8.5 ? '<span class="tag real">IDEA completo</span>' : '<span class="tag didactic">rondas reducidas</span>'}
        <span class="muted"> · datos: ${a.data} · tiempo: ${a.time ? `2<sup>${String(a.time).replace('.', ',')}</sup>` : 'ver artículo'}</span>
        <p class="small">${a.brute ? 'Coste genérico de probar todas las claves. Sirve de vara de medir.' : a.full ? 'Es formalmente más rápido que la fuerza bruta, pero sigue muy por encima de lo computable. No permite descifrar mensajes reales.' : 'Ataca una versión recortada del cifrador. Mide el margen de seguridad, no rompe IDEA tal como se usa.'}</p>`;
    }
    el.addEventListener('click', (e) => {
      const t = e.target.closest('.tab');
      if (t) { view = t.dataset.v; render(); return; }
      const r = e.target.closest('.att-row');
      if (r) { sel = +r.dataset.i; render(); }
    });
    render();
    return {
      next: () => { if (view === 'rounds') view = 'cost'; else sel = Math.min(ATTACKS.length - 1, sel + 1); render(); },
      prev: () => { if (view === 'cost') view = 'rounds'; else sel = Math.max(0, sel - 1); render(); },
    };
  };

  /* ------------------------------------------------------------------ */
  W.CompareViz = function (container) {
    const C = ['DES', 'IDEA', 'AES'];
    const TABS = {
      'Tamaños': [
        ['Bloque', '64 bits', '64 bits', '128 bits'],
        ['Clave', '56 bits efectivos', '128 bits', '128 / 192 / 256 bits'],
        ['Rondas', '16', '8 + ½', '10 / 12 / 14'],
      ],
      'Diseño': [
        ['Estructura', 'Red de Feistel', 'Esquema de Lai–Massey', 'Red de sustitución-permutación'],
        ['No linealidad', 'Cajas S de 6→4 bits', '⊙ mód 2¹⁶+1 frente a ⊞ y ⊕', 'Caja S: inversión en GF(2⁸)'],
        ['Pensado para', 'Hardware (1970s)', 'Software de 16 bits', 'Software y hardware'],
      ],
      'Historia': [
        ['Publicación', '1977 (FIPS 46)', '1991 (Lai y Massey)', '2001 (FIPS 197)'],
        ['Origen', 'IBM, revisión de la NSA', 'ETH Zúrich', 'Daemen y Rijmen, concurso abierto del NIST'],
        ['Licencia', '—', 'Patentado hasta 2011–2012', 'Libre de regalías (requisito del concurso)'],
      ],
      'Seguridad hoy': [
        ['Mejor ataque', 'Fuerza bruta práctica (1998)', 'Teórico: ≈ 2¹²⁶ (biclique)', 'Teórico: 2¹²⁶·¹ (biclique, AES-128)'],
        ['Limitación principal', 'Clave demasiado corta', 'Bloque de 64 bits', '—'],
        ['Estado', 'Retirado (2005)', 'Heredado: solo compatibilidad', 'Estándar vigente'],
      ],
    };
    let tab = 'Tamaños';
    const el = W.html(`<div class="w compare">
      <div class="att-tabs">${Object.keys(TABS).map((t) => `<button class="tab" data-t="${t}">${t}</button>`).join('')}</div>
      <div class="cmp-table"></div>
      <div class="cmp-keys"></div>
    </div>`);
    container.appendChild(el);
    function render() {
      el.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.t === tab));
      el.querySelector('.cmp-table').innerHTML = `<table><thead><tr><th></th>${C.map((c) => `<th class="c-${c.toLowerCase()}">${c}</th>`).join('')}</tr></thead>
        <tbody>${TABS[tab].map((r) => `<tr><th>${r[0]}</th>${r.slice(1).map((x, i) => `<td class="c-${C[i].toLowerCase()}">${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
    // Barras del espacio de claves en escala log2
    el.querySelector('.cmp-keys').innerHTML = `<div class="cmp-k-title">Espacio de claves (escala logarítmica, log₂)</div>` +
      [['DES', 56], ['IDEA', 128], ['AES-128', 128], ['AES-256', 256]].map(([n, b]) => `<div class="cmpk"><span>${n}</span><span class="cmpk-track"><span class="cmpk-bar c-${n.split('-')[0].toLowerCase()}" style="width:${(100 * b) / 256}%"></span></span><b class="mono">2<sup>${b}</sup></b></div>`).join('');
    el.addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (t) { tab = t.dataset.t; render(); } });
    render();
    const keys = Object.keys(TABS);
    return {
      next: () => { tab = keys[Math.min(keys.length - 1, keys.indexOf(tab) + 1)]; render(); },
      prev: () => { tab = keys[Math.max(0, keys.indexOf(tab) - 1)]; render(); },
    };
  };
})();
