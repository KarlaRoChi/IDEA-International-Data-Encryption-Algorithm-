/*
 * ops-lab.js — Bloque 1. Laboratorio de las tres operaciones de IDEA
 * sobre palabras de 16 bits: ⊕ (XOR), ⊞ (suma mód 2^16), ⊙ (mult. mód 2^16+1).
 * Todos los resultados se calculan con el núcleo js/idea/idea.js.
 */
(function () {
  'use strict';
  const W = window.Widgets;

  const PRESETS = [
    { label: 'Ejemplo', a: 0x5A3C, b: 0x0F0F },
    { label: 'Con acarreo', a: 0xFFF0, b: 0x0020 },
    { label: 'a = 0 (≡ 2¹⁶)', a: 0x0000, b: 0x0003 },
    { label: 'b = 1 (neutro de ⊙)', a: 0x1234, b: 0x0001 },
  ];

  W.OpsLab = function (container) {
    const I = window.IDEA;
    let a = PRESETS[0].a, b = PRESETS[0].b;

    const el = W.html(`<div class="w ops-lab">
      <div class="ops-inputs">
        <div class="ops-word" data-w="a">
          <label>a</label>
          <input class="hex-in" maxlength="4" spellcheck="false" aria-label="Palabra a en hexadecimal">
          <div class="bits-slot"></div>
          <span class="dec"></span>
        </div>
        <div class="ops-word" data-w="b">
          <label>b</label>
          <input class="hex-in" maxlength="4" spellcheck="false" aria-label="Palabra b en hexadecimal">
          <div class="bits-slot"></div>
          <span class="dec"></span>
        </div>
        <div class="ops-presets">${PRESETS.map((p, i) => `<button class="chip" data-p="${i}">${p.label}</button>`).join('')}<button class="chip" data-p="rnd">Aleatorio</button></div>
        <p class="hint">Haz clic en un bit para cambiarlo o escribe en hexadecimal.</p>
      </div>
      <div class="ops-results">
        ${['xor', 'add', 'mul'].map((op) => `<div class="ops-row op-${op}" data-op="${op}">
            <div class="ops-sym" style="color:${W.OPS[op].color}">${W.OPS[op].sym}</div>
            <div class="ops-main">
              <div class="ops-line"><span class="ops-name">${op === 'xor' ? 'XOR bit a bit' : op === 'add' ? 'Suma módulo 2<sup>16</sup>' : 'Multiplicación módulo 2<sup>16</sup>+1'}</span><span class="res-hex mono"></span></div>
              <div class="bits-slot"></div>
              <div class="explain"></div>
            </div>
          </div>`).join('')}
      </div>
    </div>`);
    container.appendChild(el);

    const words = { a: el.querySelector('[data-w="a"]'), b: el.querySelector('[data-w="b"]') };

    function render() {
      for (const k of ['a', 'b']) {
        const v = k === 'a' ? a : b;
        const w = words[k];
        if (document.activeElement !== w.querySelector('input')) w.querySelector('input').value = W.hex(v);
        w.querySelector('.bits-slot').innerHTML = W.bitsHtml(v, { cls: 'clickable' });
        w.querySelector('.dec').textContent = `= ${v}${v === 0 ? '  (en ⊙ vale 65536)' : ''}`;
      }
      const x = I.xor(a, b), s = I.add(a, b), m = I.mul(a, b);
      const diff = Array.from(I.bin16(x), (c) => c === '1');
      const row = (op) => el.querySelector(`.ops-row[data-op="${op}"]`);

      row('xor').querySelector('.res-hex').textContent = W.hex(x);
      row('xor').querySelector('.bits-slot').innerHTML = W.bitsHtml(x, { diff });
      row('xor').querySelector('.explain').innerHTML = `Cada bit se suma <b>módulo 2</b> por separado: 1 donde a y b difieren, sin acarreos.`;

      const raw = a + b;
      row('add').querySelector('.res-hex').textContent = W.hex(s);
      row('add').querySelector('.bits-slot').innerHTML = W.bitsHtml(s);
      row('add').querySelector('.explain').innerHTML = raw >= 0x10000
        ? `${a} + ${b} = ${raw} ≥ 65536 → se descarta el acarreo 2<sup>16</sup>: <b>${s}</b>`
        : `${a} + ${b} = <b>${s}</b> (los acarreos se propagan de derecha a izquierda)`;

      const ea = a === 0 ? 65536 : a, eb = b === 0 ? 65536 : b;
      const prod = ea * eb, r = prod % 65537;
      const zeroNote = (a === 0 || b === 0) ? '<span class="warn-text">0 representa 2<sup>16</sup> = 65536.</span> ' : '';
      row('mul').querySelector('.res-hex').textContent = W.hex(m);
      row('mul').querySelector('.bits-slot').innerHTML = W.bitsHtml(m);
      row('mul').querySelector('.explain').innerHTML =
        `${zeroNote}${ea} · ${eb} = ${prod} ≡ <b>${r}</b> (mód 65537)` +
        (r === 65536 ? ' → 65536 se escribe como <b>0000</b>' : '');
    }

    el.addEventListener('click', (e) => {
      const bit = e.target.closest('.bits.clickable .bit');
      if (bit) {
        const k = bit.closest('.ops-word').dataset.w;
        const mask = 1 << (15 - +bit.dataset.i);
        if (k === 'a') a ^= mask; else b ^= mask;
        render();
        return;
      }
      const chip = e.target.closest('.chip');
      if (chip) {
        if (chip.dataset.p === 'rnd') { const r = new Uint16Array(2); crypto.getRandomValues(r); [a, b] = r; }
        else { const p = PRESETS[+chip.dataset.p]; a = p.a; b = p.b; }
        render();
      }
    });
    el.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => {
      const h = I.cleanHex(inp.value);
      const ok = /^[0-9A-F]{1,4}$/.test(h);
      inp.classList.toggle('invalid', !ok);
      if (!ok) return;
      const v = parseInt(h, 16);
      if (inp.closest('.ops-word').dataset.w === 'a') a = v; else b = v;
      render();
    }));
    el.querySelectorAll('input').forEach((inp) => inp.addEventListener('blur', render));

    render();
    return {};
  };
})();
