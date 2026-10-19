/*
 * round-visualizer.js — Bloque 2. Visualizador del cifrado ronda por ronda.
 * Todos los valores provienen de IDEA.trace() (nada está simulado).
 *
 * Posiciones navegables:
 *   ronda r (1..8): s=0 entrada, s=1..14 operaciones, s=15 salida (cruce)
 *   transformación final: s=0 entrada, s=1..4 operaciones, s=5 bloque cifrado
 */
(function () {
  'use strict';
  const W = window.Widgets;

  const ZONES = { key: 'Capa de subclaves', 'ma-in': 'Entradas de la caja MA', ma: 'Caja MA (multiplicación–adición)', out: 'Mezcla de salida' };

  W.RoundVisualizer = function (container, opts = {}) {
    const I = window.IDEA;
    let ptHex = opts.plaintext || '4944 4541 3139 3931';
    let keyHex = opts.key || '5875 656A 6961 4C61 6926 4D61 7373 6579';
    let T = null;            // traza
    let positions = [];
    let p = 0;               // índice de posición
    let timer = null;

    const el = W.html(`<div class="w rviz">
      <div class="rviz-top">
        <label class="field"><span>Bloque (64 bits)</span><input class="hex-in wide" data-f="pt" spellcheck="false"></label>
        <label class="field"><span>Clave (128 bits)</span><input class="hex-in xwide" data-f="key" spellcheck="false"></label>
        <button class="btn" data-a="random" title="Bloque y clave aleatorios">Aleatorio</button>
        <span class="err"></span>
      </div>
      <div class="rviz-main">
        <div class="rviz-rail" role="tablist" aria-label="Rondas"></div>
        <div class="rviz-diagram"></div>
        <div class="rviz-info">
          <div class="rviz-where"></div>
          <div class="rviz-zone"></div>
          <div class="rviz-formula"></div>
          <div class="rviz-state"></div>
          <div class="rviz-keys"></div>
        </div>
      </div>
      <div class="demo-controls" aria-label="Controles de la demostración">
        <button class="btn" data-a="reset" title="Volver al inicio">⟲ Reiniciar</button>
        <button class="btn" data-a="prevR" title="Ronda anterior">⏮ Ronda</button>
        <button class="btn" data-a="prev" title="Paso anterior (,)">◀ Paso</button>
        <button class="btn primary" data-a="next" title="Paso siguiente (.)">Paso ▶</button>
        <button class="btn" data-a="nextR" title="Ronda siguiente">Ronda ⏭</button>
        <button class="btn" data-a="play" title="Reproducción automática">▷ Auto</button>
        <span class="pos-counter mono"></span>
      </div>
    </div>`);
    container.appendChild(el);
    const diagram = W.RoundDiagram(el.querySelector('.rviz-diagram'), { values: true });
    const $ = (s) => el.querySelector(s);
    $('[data-f="pt"]').value = ptHex;
    $('[data-f="key"]').value = keyHex;

    $('.rviz-rail').innerHTML = Array.from({ length: 8 }, (_, i) => `<button class="rail-btn" data-r="${i}">R${i + 1}</button>`).join('') +
      `<button class="rail-btn final" data-r="8">½<small>salida</small></button>`;

    function compute() {
      try {
        T = I.trace(ptHex, keyHex);
        $('.err').textContent = '';
        el.querySelectorAll('input').forEach((i) => i.classList.remove('invalid'));
      } catch (e) {
        $('.err').textContent = e.message;
        return false;
      }
      positions = [];
      for (let r = 0; r < 8; r++) for (let s = 0; s <= 15; s++) positions.push({ r, s });
      for (let s = 0; s <= 5; s++) positions.push({ r: 8, s });
      return true;
    }

    const roundOf = (r) => (r < 8 ? T.rounds[r] : T.final);
    const fmt = (st) => {
      const o = W.OPS[st.op];
      return `<span class="f-a">${st.ka}</span> <span class="f-op" style="color:${o.color}">${o.sym}</span> <span class="f-b">${st.kb}</span>
        <div class="f-num mono">${W.hex(st.a)} <span style="color:${o.color}">${o.sym}</span> ${W.hex(st.b)} = <b>${W.hex(st.out)}</b></div>
        <div class="f-note">${o.name}${st.op === 'mul' && (st.a === 0 || st.b === 0) ? ' · aquí 0000 vale 2<sup>16</sup>' : ''}</div>`;
    };
    const words = (ws, label) => `<div class="state-row"><span>${label}</span>${ws.map((w, i) => `<b class="mono sw w${i + 1}">${W.hex(w)}</b>`).join('')}</div>`;

    function render() {
      if (!T) return;
      const { r, s } = positions[p];
      const R = roundOf(r);
      const isFinal = r === 8;
      const lastS = isFinal ? 5 : 15;
      diagram.setRound(R, s);
      diagram.highlight(s >= 1 && s < lastS ? s : null);
      const st = s >= 1 && s < lastS ? R.steps[s - 1] : null;

      el.querySelectorAll('.rail-btn').forEach((b) => {
        const k = +b.dataset.r;
        b.classList.toggle('active', k === r);
        b.classList.toggle('done', k < r);
      });
      $('.rviz-where').innerHTML = isFinal
        ? `<b>Transformación de salida</b> <span class="muted">· media ronda</span>`
        : `<b>Ronda ${r + 1}</b> <span class="muted">de 8</span>`;
      $('.rviz-zone').textContent = st ? `Paso ${st.n} · ${ZONES[st.group]}` : '';

      let f = '';
      if (st) f = fmt(st);
      else if (s === 0) f = `<div class="f-msg">${isFinal ? 'Entra el resultado de la ronda 8. Solo se usan Z49…Z52, sin caja MA.' : r === 0 ? 'El texto en claro, dividido en X1…X4, entra en la primera ronda.' : `La salida de la ronda ${r} es la entrada de la ronda ${r + 1}.`}</div>`;
      else if (isFinal) f = `<div class="f-msg ok">Bloque cifrado de 64 bits:<div class="cipher mono">${I.wordsToHex(T.output)}</div></div>`;
      else f = `<div class="f-msg">${R.swap ? 'Salida: <b>(11, 12, 13, 14)</b>. Los bloques centrales se <b>cruzan</b> antes de la ronda siguiente.' : 'Ronda 8: <b>sin cruce</b> de los bloques centrales. Se pasa directamente a la transformación final.'}</div>`;
      $('.rviz-formula').innerHTML = f;

      $('.rviz-state').innerHTML = words(R.input, 'Entrada') + (s === lastS ? words(R.output, 'Salida') : '');
      $('.rviz-keys').innerHTML = `<div class="keys-title">Subclaves de ${isFinal ? 'la salida' : 'esta ronda'}</div>` +
        R.subkeys.map((k, i) => {
          const used = st && st.kb === `${R.keyName}${R.subkeyIndex + i + 1}`;
          return `<span class="kchip ${used ? 'on' : ''}">${R.keyName}<sub>${R.subkeyIndex + i + 1}</sub> <b class="mono">${W.hex(k)}</b></span>`;
        }).join('');
      $('.pos-counter').textContent = `${p + 1} / ${positions.length}`;
      $('[data-a="prev"]').disabled = p === 0;
      $('[data-a="next"]').disabled = p === positions.length - 1;
    }

    function go(np) { p = Math.max(0, Math.min(positions.length - 1, np)); render(); }
    function goRound(d) {
      const r = positions[p].r;
      const target = Math.max(0, Math.min(8, (positions[p].s === 0 && d < 0) ? r - 1 : r + (d > 0 ? 1 : 0)));
      const idx = positions.findIndex((x) => x.r === target && x.s === 0);
      go(idx === -1 ? p : idx);
    }
    function stop() { clearInterval(timer); timer = null; $('[data-a="play"]').textContent = '▷ Auto'; }
    function play() {
      if (timer) return stop();
      $('[data-a="play"]').textContent = '❚❚ Pausa';
      timer = setInterval(() => { if (p >= positions.length - 1) stop(); else go(p + 1); }, 700);
    }

    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.r != null) { stop(); go(positions.findIndex((x) => x.r === +b.dataset.r && x.s === 0)); return; }
      const a = b.dataset.a;
      if (a !== 'play') stop();
      if (a === 'next') go(p + 1);
      if (a === 'prev') go(p - 1);
      if (a === 'nextR') goRound(1);
      if (a === 'prevR') goRound(-1);
      if (a === 'reset') go(0);
      if (a === 'play') play();
      if (a === 'random') {
        ptHex = W.randomHex(4); keyHex = W.randomHex(8);
        $('[data-f="pt"]').value = ptHex; $('[data-f="key"]').value = keyHex;
        if (compute()) go(0);
      }
    });
    el.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => {
      if (inp.dataset.f === 'pt') ptHex = inp.value; else keyHex = inp.value;
      stop();
      if (compute()) go(Math.min(p, positions.length - 1)); else inp.classList.add('invalid');
    }));

    if (compute()) render();
    return { next: () => { stop(); go(p + 1); }, prev: () => { stop(); go(p - 1); }, destroy: stop };
  };
})();
