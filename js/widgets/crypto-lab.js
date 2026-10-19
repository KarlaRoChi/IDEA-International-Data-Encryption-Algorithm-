/*
 * crypto-lab.js — Bloque 3. Laboratorio de cifrado y descifrado IDEA.
 *
 * Flujo: introducir clave (128 bits) y bloque (64 bits) -> cifrar paso a paso
 * -> usar el resultado para descifrar con las subclaves inversas -> comprobar
 * que se recupera el bloque original. Todo se calcula con js/idea/idea.js.
 */
(function () {
  'use strict';
  const W = window.Widgets;

  const PRESETS = [
    { id: 'lai', label: 'Vector de Lai (1992)', key: '0001 0002 0003 0004 0005 0006 0007 0008', pt: '0000 0001 0002 0003' },
    { id: 'zero', label: 'Todo ceros', key: '0000 0000 0000 0000 0000 0000 0000 0000', pt: '0000 0000 0000 0000' },
    { id: 'text', label: 'Texto «Cripto!!»', key: '0123 4567 89AB CDEF FEDC BA98 7654 3210', pt: '4372 6970 746F 2121' },
  ];

  W.CryptoLab = function (container, opts = {}) {
    const I = window.IDEA;
    let keyHex = opts.key || PRESETS[0].key;
    let ptHex = opts.plaintext || PRESETS[0].pt;
    let mode = 'encrypt';     // 'encrypt' | 'decrypt'
    let T = null;             // traza activa
    let original = null;      // bloque original (palabras) del cifrado
    let cipher = null;        // bloque cifrado (palabras)
    let pos = [];             // posiciones {r, s}
    let p = 0;
    let started = false;

    const el = W.html(`<div class="w lab">
      <div class="lab-top">
        <label class="field"><span>Clave K · 128 bits (hex)</span><input class="hex-in xwide" data-f="key" spellcheck="false"></label>
        <label class="field"><span>Bloque P · 64 bits (hex)</span><input class="hex-in wide" data-f="pt" spellcheck="false"></label>
        <label class="field"><span>Ejemplos</span><select data-f="preset">
          ${PRESETS.map((x) => `<option value="${x.id}">${x.label}</option>`).join('')}<option value="rnd">Aleatorio</option><option value="custom" hidden>Personalizado</option>
        </select></label>
        <span class="mode-badge"></span>
      </div>
      <div class="err"></div>
      <div class="lab-main">
        <section class="lab-states"><h4>Estado del bloque</h4><div class="states"></div></section>
        <section class="lab-ops"><h4 class="ops-title"></h4><table class="ops-table"><tbody></tbody></table></section>
        <section class="lab-side">
          <h4 class="keys-title"></h4><div class="lab-keys"></div>
          <div class="lab-verdict"></div>
        </section>
      </div>
      <div class="demo-controls">
        <button class="btn" data-a="reset">⟲ Reiniciar</button>
        <button class="btn" data-a="prev">◀ Paso</button>
        <button class="btn primary" data-a="next">Paso ▶</button>
        <button class="btn" data-a="round">Ronda completa ⏭</button>
        <button class="btn" data-a="all">Ejecutar todo ⏩</button>
        <button class="btn accent" data-a="decrypt" disabled>Descifrar el resultado ↺</button>
        <span class="pos-counter mono"></span>
      </div>
    </div>`);
    container.appendChild(el);
    const $ = (s) => el.querySelector(s);
    $('[data-f="key"]').value = keyHex;
    $('[data-f="pt"]').value = ptHex;

    function build(m, inputHex) {
      mode = m;
      try {
        T = I.trace(inputHex, keyHex, m);
        $('.err').textContent = '';
      } catch (e) {
        $('.err').textContent = e.message;
        T = null;
        return false;
      }
      pos = [{ r: -1, s: 0 }];
      for (let r = 0; r < 8; r++) for (let s = 1; s <= 15; s++) pos.push({ r, s });
      for (let s = 1; s <= 5; s++) pos.push({ r: 8, s });
      p = 0;
      return true;
    }

    function startEncrypt() {
      started = false;
      if (!build('encrypt', ptHex)) return render();
      original = T.block.slice();
      cipher = null;
      render();
    }

    const R = (r) => (r < 8 ? T.rounds[r] : T.final);
    const kn = () => (mode === 'decrypt' ? 'U' : 'Z');

    function render() {
      const badge = $('.mode-badge');
      badge.className = `mode-badge ${mode}`;
      badge.textContent = mode === 'decrypt' ? 'Descifrado · subclaves U' : 'Cifrado · subclaves Z';
      if (!T) { $('.states').innerHTML = ''; $('.ops-table tbody').innerHTML = ''; return; }
      const { r, s } = pos[p];
      const cr = Math.max(r, 0);
      const cur = R(cr);
      const isFinal = cr === 8;
      const lastS = isFinal ? 5 : 15;

      // --- Columna de estados ---
      const rowsS = [];
      rowsS.push({ lbl: mode === 'decrypt' ? 'C' : 'P', ws: T.input, show: true, cur: r === -1 });
      for (let k = 0; k < 8; k++) rowsS.push({ lbl: `R${k + 1}`, ws: T.rounds[k].output, show: k < r || (k === r && s === 15), cur: k === r });
      rowsS.push({ lbl: mode === 'decrypt' ? 'P′' : 'C', ws: T.output, show: r === 8 && s === 5, cur: r === 8, final: true });
      $('.states').innerHTML = rowsS.map((x) => `<div class="st ${x.cur ? 'cur' : ''} ${x.final ? 'fin' : ''}"><span>${x.lbl}</span>${x.ws.map((w) => `<b class="mono">${x.show ? W.hex(w) : '····'}</b>`).join('')}</div>`).join('');

      // --- Tabla de operaciones ---
      $('.ops-title').innerHTML = r === -1
        ? 'Preparación: X1…X4'
        : isFinal ? 'Transformación de salida' : `Ronda ${cr + 1}: 14 operaciones`;
      let body = '';
      if (r === -1) {
        body = T.input.map((w, i) => `<tr class="shown"><td class="n">X${i + 1}</td><td colspan="3" class="mono">${I.bin16(w).replace(/(.{4})/g, '$1 ')}</td><td class="mono out">${W.hex(w)}</td></tr>`).join('') +
          `<tr><td colspan="5" class="note">El bloque de 64 bits se divide en cuatro palabras de 16 bits.${mode === 'encrypt' ? ' Pulsa «Paso ▶» para empezar.' : ''}</td></tr>`;
      } else {
        body = cur.steps.map((st) => {
          const shown = st.n <= s;
          const o = W.OPS[st.op];
          return `<tr class="${shown ? 'shown' : ''} ${st.n === s ? 'cur' : ''}" style="--oc:${o.color}">
            <td class="n">${st.n}</td><td class="lbl">${st.label.replace(/⊙|⊞|⊕/, `<b style="color:${o.color}">$&</b>`)}</td>
            <td class="mono">${shown ? W.hex(st.a) : ''}</td><td class="mono">${shown ? W.hex(st.b) : ''}</td>
            <td class="mono out">${shown ? W.hex(st.out) : '····'}</td></tr>`;
        }).join('');
        if (s === lastS) {
          body += `<tr class="shown sum"><td class="n">→</td><td colspan="4">${isFinal ? 'Resultado: ' : cur.swap ? 'Salida con cruce: (11, 12, 13, 14) = ' : 'Ronda 8, sin cruce: (11, 13, 12, 14) = '}<b class="mono">${I.wordsToHex(cur.output)}</b></td></tr>`;
        }
      }
      $('.ops-table tbody').innerHTML = body;

      // --- Subclaves de la ronda (y su origen en el descifrado) ---
      $('.keys-title').textContent = r === -1 ? 'Subclaves' : `Subclaves ${isFinal ? 'de salida' : 'de la ronda ' + (cr + 1)}`;
      if (r === -1) {
        $('.lab-keys').innerHTML = `<p class="small muted">${mode === 'encrypt'
          ? 'Las 52 subclaves Z se obtienen de K con rotaciones de 25 bits.'
          : 'Las 52 subclaves U se obtienen de Z: inversos y orden invertido.'}</p>`;
      } else {
        const curStep = s >= 1 && s < lastS ? cur.steps[s - 1] : null;
        $('.lab-keys').innerHTML = cur.subkeys.map((k, i) => {
          const gi = cur.subkeyIndex + i;
          const name = `${kn()}${gi + 1}`;
          let origin = '';
          if (mode === 'decrypt') {
            const o = T.origin[gi];
            const zf = `Z<sub>${o.from + 1}</sub>`;
            const zv = W.hex(T.Z[o.from]);
            origin = o.op === 'mulInv' ? `= (${zf})<sup>−1</sup> = ${zv}<sup>−1</sup>` : o.op === 'addInv' ? `= −${zf} = −${zv}` : `= ${zf}`;
          }
          const on = curStep && curStep.kb === name;
          return `<div class="lkey ${on ? 'on' : ''}"><span>${kn()}<sub>${gi + 1}</sub></span><b class="mono">${W.hex(k)}</b><small>${origin}</small></div>`;
        }).join('');
      }

      // --- Veredicto ---
      let v = '';
      const done = r === 8 && s === 5;
      if (done && mode === 'encrypt') {
        const ref = I.REFERENCE_VECTOR;
        const isRef = I.cleanHex(keyHex) === ref.key && I.cleanHex(ptHex) === ref.plaintext;
        const match = I.wordsToHex(T.output, '') === ref.ciphertext;
        v = `<div class="verdict ok"><div>Texto cifrado</div><b class="mono">${I.wordsToHex(T.output)}</b>
          ${isRef ? `<p>${match ? '✓ Coincide con el vector publicado por Lai (1992): 11FB ED2B 0198 6DE5.' : '✗ No coincide con el vector publicado.'}</p>` : '<p>Pulsa «Descifrar el resultado» para comprobar la ida y vuelta.</p>'}</div>`;
      } else if (done && mode === 'decrypt') {
        const ok = I.wordsToHex(T.output) === I.wordsToHex(original);
        v = `<div class="verdict ${ok ? 'ok' : 'bad'}"><div>Bloque recuperado</div><b class="mono">${I.wordsToHex(T.output)}</b>
          <p>${ok ? `✓ Igual al original P = ${I.wordsToHex(original)}` : '✗ No coincide con el original'}</p></div>`;
      }
      $('.lab-verdict').innerHTML = v;

      $('.pos-counter').textContent = `${p + 1} / ${pos.length}`;
      $('[data-a="prev"]').disabled = p === 0;
      $('[data-a="next"]').disabled = p === pos.length - 1;
      $('[data-a="round"]').disabled = p === pos.length - 1;
      $('[data-a="all"]').disabled = p === pos.length - 1;
      $('[data-a="decrypt"]').disabled = !(mode === 'encrypt' && done);
    }

    function go(np) { p = Math.max(0, Math.min(pos.length - 1, np)); started = true; render(); }
    function nextRound() {
      const { r } = pos[p];
      let idx = pos.findIndex((x) => x.r === r && x.s === (r === 8 ? 5 : 15));
      if (idx <= p) idx = pos.findIndex((x) => x.r === r + 1 && x.s === (r + 1 === 8 ? 5 : 15));
      go(idx === -1 ? pos.length - 1 : idx);
    }

    function setPreset(id) {
      if (id === 'rnd') { keyHex = W.randomHex(8); ptHex = W.randomHex(4); }
      else { const x = PRESETS.find((q) => q.id === id); keyHex = x.key; ptHex = x.pt; }
      $('[data-f="key"]').value = keyHex;
      $('[data-f="pt"]').value = ptHex;
      startEncrypt();
    }

    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !T && b.dataset.a !== 'reset') return;
      const a = b.dataset.a;
      if (a === 'next') go(p + 1);
      if (a === 'prev') go(p - 1);
      if (a === 'round') nextRound();
      if (a === 'all') go(pos.length - 1);
      if (a === 'reset') startEncrypt();
      if (a === 'decrypt') {
        cipher = T.output.slice();
        if (build('decrypt', I.wordsToHex(cipher, ''))) render();
      }
    });
    $('[data-f="preset"]').addEventListener('change', (e) => setPreset(e.target.value));
    el.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => {
      if (inp.dataset.f === 'key') keyHex = inp.value; else ptHex = inp.value;
      $('[data-f="preset"]').value = 'custom';
      startEncrypt();
      inp.classList.toggle('invalid', !T);
    }));

    startEncrypt();
    return { next: () => T && go(p + 1), prev: () => T && go(p - 1), reset: () => startEncrypt(), all: () => T && nextRound() };
  };

  /* ------------------------------------------------------------------ */
  /* Tabla de subclaves de descifrado (bloque 3, diapositiva de teoría)  */
  /* ------------------------------------------------------------------ */
  W.DecryptKeyTable = function (container, opts = {}) {
    const I = window.IDEA;
    const key = I.hexToWords(opts.key || I.REFERENCE_VECTOR.key, 8);
    const { Z } = I.expandKey(key);
    const { U, origin } = I.decryptSubkeys(Z);
    let sel = 0; // ronda de descifrado seleccionada (0..8)
    const el = W.html(`<div class="w dkt">
      <div class="dkt-rounds">${Array.from({ length: 9 }, (_, i) => `<button class="rail-btn" data-r="${i}">${i < 8 ? 'R' + (i + 1) : '½'}</button>`).join('')}</div>
      <div class="dkt-body"></div>
    </div>`);
    container.appendChild(el);
    function render() {
      el.querySelectorAll('.rail-btn').forEach((b) => b.classList.toggle('active', +b.dataset.r === sel));
      const n = sel < 8 ? 6 : 4;
      const names = ['⊙', '⊞', '⊞', '⊙', '⊙ MA', '⊙ MA'];
      let rows = '';
      for (let k = 0; k < n; k++) {
        const i = 6 * sel + k;
        const o = origin[i];
        const opTxt = o.op === 'mulInv' ? 'inverso multiplicativo mód 65537' : o.op === 'addInv' ? 'opuesto aditivo mód 2¹⁶' : 'se copia tal cual';
        const formula = o.op === 'mulInv' ? `(Z<sub>${o.from + 1}</sub>)<sup>−1</sup>` : o.op === 'addInv' ? `−Z<sub>${o.from + 1}</sub>` : `Z<sub>${o.from + 1}</sub>`;
        const check = o.op === 'mulInv' ? `${W.hex(Z[o.from])} ⊙ ${W.hex(U[i])} = ${W.hex(I.mul(Z[o.from], U[i]))}`
          : o.op === 'addInv' ? `${W.hex(Z[o.from])} ⊞ ${W.hex(U[i])} = ${W.hex(I.add(Z[o.from], U[i]))}` : '';
        rows += `<tr class="t-${o.op}"><td>U<sub>${i + 1}</sub> <small>${names[k]}</small></td><td>= ${formula}</td><td class="mono">${W.hex(Z[o.from])}</td><td class="mono"><b>${W.hex(U[i])}</b></td><td class="small muted">${opTxt}</td><td class="mono small">${check}</td></tr>`;
      }
      el.querySelector('.dkt-body').innerHTML = `<table><thead><tr><th>Subclave</th><th>Origen</th><th>Z</th><th>U</th><th>Operación</th><th>Comprobación</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    el.addEventListener('click', (e) => { const b = e.target.closest('.rail-btn'); if (b) { sel = +b.dataset.r; render(); } });
    render();
    return { next: () => { sel = Math.min(8, sel + 1); render(); }, prev: () => { sel = Math.max(0, sel - 1); render(); }, reset: () => { sel = 0; render(); }, all: () => { sel = 8; render(); } };
  };
})();
