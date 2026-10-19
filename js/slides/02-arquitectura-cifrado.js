/*
 * BLOQUE 2: Arquitectura y cifrado (≈ 4,4 min).
 * Temas exclusivos: estructura general, bloque de 64 bits, clave de 128 bits,
 * división en 4 subbloques, 52 subclaves, rotación de 25 bits, 8 rondas + ½,
 * organización de la ronda, caja MA y transformación del bloque.
 * Ejemplo PROPIO de este bloque: texto «IDEA1991» y clave «XuejiaLai&Massey»
 * (distinto del ejemplo numérico del bloque 3, para no duplicarlo).
 * NO incluye: el ejemplo académico completo, el descifrado ni la seguridad.
 */
(function () {
  const W = window.Widgets;
  const P = 2;
  const DEMO = { plaintext: '4944 4541 3139 3931', key: '5875 656A 6961 4C61 6926 4D61 7373 6579' };

  /* Diagrama de arquitectura (estático, vectorial) */
  const arch = (() => {
    const rows = [];
    let y = 70;
    for (let r = 1; r <= 8; r++) {
      const show = r <= 2 || r >= 7;
      if (!show) { if (r === 3) { rows.push(`<text x="260" y="${y + 18}" text-anchor="middle" fill="#7f90ae" font-size="22">⋮</text>`); y += 34; } continue; }
      rows.push(`<rect x="120" y="${y}" width="280" height="46" rx="9" fill="#14213b" stroke="#22314f"/>
        <text x="140" y="${y + 30}" fill="#e8eef9" font-weight="600">Ronda ${r}</text>
        <text x="380" y="${y + 30}" text-anchor="end" fill="var(--key)" font-family="JetBrains Mono, monospace" font-size="16">Z${6 * r - 5}–Z${6 * r}</text>`);
      y += 58;
    }
    rows.push(`<rect x="120" y="${y}" width="280" height="46" rx="9" fill="#14213b" stroke="var(--pc)" stroke-dasharray="6 4"/>
      <text x="140" y="${y + 30}" fill="var(--pc)" font-weight="600">Transf. de salida</text>
      <text x="380" y="${y + 30}" text-anchor="end" fill="var(--key)" font-family="JetBrains Mono, monospace" font-size="16">Z49–Z52</text>`);
    const end = y + 46;
    return `<svg viewBox="0 0 520 ${end + 70}" class="arch-svg" role="img" aria-label="Arquitectura de 8 rondas y media">
      <g font-family="Inter, sans-serif" font-size="18">
        <text x="260" y="26" text-anchor="middle" fill="#e8eef9" font-weight="600">Texto en claro · 64 bits</text>
        <g>${[0, 1, 2, 3].map((i) => `<rect x="${120 + i * 72}" y="38" width="64" height="22" rx="5" fill="#1d2c4c"/><text x="${152 + i * 72}" y="54" text-anchor="middle" fill="#b6c3da" font-size="14">X${i + 1}</text>`).join('')}</g>
        ${rows.join('')}
        <path d="M260 60V70" stroke="#3a4b6e" stroke-width="2"/>
        <text x="260" y="${end + 36}" text-anchor="middle" fill="#e8eef9" font-weight="600">Texto cifrado · 64 bits</text>
        <path d="M440 82V${end - 4}" stroke="#7f90ae" stroke-width="1.5"/><text x="452" y="${(82 + end) / 2}" fill="#7f90ae" font-size="15" transform="rotate(90 452 ${(82 + end) / 2})" text-anchor="middle">8 rondas + ½ = «8,5 rondas»</text>
      </g></svg>`;
  })();

  window.SLIDES.push(
    /* 2.0 Portada */
    {
      id: 'b2-portada', person: P, type: 'cover', title: 'Arquitectura y cifrado', minutes: 0.2,
      agenda: ['64 y 128 bits', '52 subclaves', 'Rotación de 25 bits', 'Ronda y caja MA', '8 rondas + ½'],
      notes: String.raw`
        <p class="script">«Ya conocemos las operaciones. Ahora veremos cómo se organizan: tamaños, subclaves, rondas y la caja MA.»</p>`,
    },

    /* 2.1 Estructura general + división del bloque */
    {
      id: 'b2-estructura', person: P, title: 'Estructura general', minutes: 0.8,
      refs: ['lai-1992', 'hac-1996'],
      html: String.raw`
        <div class="row" style="gap:40px;flex:1;min-height:0">
          <div class="col grow">
            <div class="grid-4 sizes">
              <div class="card"><div class="big-number">64</div><p class="small">bits por bloque</p></div>
              <div class="card"><div class="big-number">128</div><p class="small">bits de clave</p></div>
              <div class="card"><div class="big-number">52</div><p class="small">subclaves de 16 bits</p></div>
              <div class="card"><div class="big-number">8,5</div><p class="small">rondas</p></div>
            </div>
            <div class="split-slot" style="margin-top:26px"></div>
          </div>
          <div class="arch-wrap">${arch}</div>
        </div>`,
      mount: (root) => W.BlockSplit(root.querySelector('.split-slot'), { block: DEMO.plaintext }),
      notes: String.raw`
        <p class="script">«IDEA cifra bloques de 64 bits con una clave de 128 bits, de la que salen 52 subclaves de 16 bits. El bloque pasa por 8 rondas idénticas y una media ronda final: “8,5 rondas”. Lo primero es dividir el bloque en cuatro palabras de 16 bits, X1 a X4; aquí, el texto “IDEA1991”.»</p>
        <ul><li>Pulsar «Dividir en 4 palabras» (o <b>.</b>). 8 rondas × 6 subclaves + 4 = 52.</li></ul>`,
    },

    /* 2.2 Subclaves */
    {
      id: 'b2-subclaves', person: P, title: '52 subclaves por rotaciones de 25 bits', minutes: 0.9,
      refs: ['lai-1992', 'hac-1996'],
      html: String.raw`
        <div class="formula-row">
          <span>\(Z_1 \dots Z_8 = K\)</span><span class="arrow">→</span>
          <span>\(K \leftarrow K \lll 25\)</span><span class="arrow">→</span>
          <span>\(Z_9 \dots Z_{16}\)</span><span class="arrow">→ ⋯ →</span>
          <span>\(Z_{49} \dots Z_{52}\)</span>
          <span class="muted small" style="margin-left:auto">6 rotaciones · 56 palabras · se usan 52</span>
        </div>
        <div class="ks-slot"></div>`,
      mount: (root) => W.KeySchedule(root.querySelector('.ks-slot'), { key: DEMO.key }),
      notes: String.raw`
        <p class="script">«La clave de 128 bits se parte en 8 palabras: Z1 a Z8. Luego se rota 25 bits a la izquierda y se vuelve a partir: Z9 a Z16. Cada celda conserva el color de su posición original, así que se ve el desplazamiento. Tras 6 rotaciones hay 56 palabras y se usan 52: seis por ronda y cuatro para la salida.»</p>`,
    },

    /* 2.3 Ronda + caja MA */
    {
      id: 'b2-ronda', person: P, className: 'dense', title: 'Una ronda y su caja MA', minutes: 1.0,
      refs: ['lai-massey-1990', 'schneier-1996'],
      html: String.raw`
        <div class="row" style="gap:36px;flex:1;min-height:0">
          <div class="col" style="width:660px">
            <div class="phase" data-ph="key"><b>1–4</b><div><strong>Capa de subclaves</strong><span>\(X_1{\odot}Z_1,\; X_2{\boxplus}Z_2,\; X_3{\boxplus}Z_3,\; X_4{\odot}Z_4\)</span></div></div>
            <div class="phase" data-ph="ma-in"><b>5–6</b><div><strong>Entradas de la caja MA</strong><span>\(p=(1)\oplus(3),\quad q=(2)\oplus(4)\)</span></div></div>
            <div class="phase" data-ph="ma"><b>7–10</b><div><strong>Caja MA</strong><span>\(s=p\odot Z_5,\;\; t=(q\boxplus s)\odot Z_6,\;\; u=s\boxplus t\)</span></div></div>
            <div class="phase" data-ph="out"><b>11–14</b><div><strong>Mezcla de salida</strong><span>\((1){\oplus}t,\; (3){\oplus}t,\; (2){\oplus}u,\; (4){\oplus}u\)</span></div></div>
            <div class="phase" data-ph="cross"><b>⤨</b><div><strong>Cruce de los bloques centrales</strong><span>en las rondas 1–7, no en la 8</span></div></div>
            <div class="demo-controls"><button class="btn" data-a="prev">◀ Paso</button><button class="btn primary" data-a="next">Paso ▶</button><span class="pos-counter mono"></span></div>
          </div>
          <div class="grow diagram-slot"></div>
        </div>`,
      mount: (root) => {
        const d = W.RoundDiagram(root.querySelector('.diagram-slot'), {});
        const zoneOf = (n) => (n <= 4 ? 'key' : n <= 6 ? 'ma-in' : n <= 10 ? 'ma' : n <= 14 ? 'out' : 'cross');
        let s = 0;
        const render = () => {
          d.highlight(s >= 1 && s <= 14 ? s : null);
          d.focus(s >= 7 && s <= 10 ? 'ma' : null);
          root.querySelectorAll('.phase').forEach((ph) => ph.classList.toggle('on', s > 0 && ph.dataset.ph === zoneOf(s)));
          root.querySelector('.pos-counter').textContent = s === 0 ? 'Vista general' : s <= 14 ? `Paso ${s} de 14` : 'Cruce';
        };
        const go = (n) => { s = Math.max(0, Math.min(15, n)); render(); };
        root.querySelector('[data-a="next"]').onclick = () => go(s + 1);
        root.querySelector('[data-a="prev"]').onclick = () => go(s - 1);
        render();
        return { next: () => go(s + 1), prev: () => go(s - 1) };
      },
      notes: String.raw`
        <p class="script">«Cada ronda usa seis subclaves y catorce operaciones en cuatro fases. Primero, cada palabra se combina con una subclave. Después, dos XOR producen p y q, que entran en la caja MA.»</p>
        <p class="script">«La caja MA es el corazón de la ronda: alterna multiplicaciones y sumas con Z5 y Z6, de modo que cada bit de sus salidas t y u depende de todos los bits de entrada. Es la difusión completa. Por último, t y u se combinan con las cuatro palabras y las dos centrales se cruzan, excepto en la ronda 8.»</p>
        <ul><li>Avanzar con <b>.</b>; en los pasos 7–10 el diagrama enfoca la caja MA.</li></ul>`,
    },

    /* 2.4 Visualizador interactivo */
    {
      id: 'b2-visualizador', person: P, className: 'dense', title: 'Cifrado ronda por ronda', minutes: 1.2,
      kicker: 'Bloque 2 · Interactivo · valores calculados en vivo',
      refs: ['lai-1992'],
      html: String.raw`<div class="viz-slot" style="flex:1;min-height:0"></div>`,
      mount: (root) => W.RoundVisualizer(root.querySelector('.viz-slot'), DEMO),
      notes: String.raw`
        <p class="script">«Así se transforma el bloque de entrada en el cifrado, con valores reales. Avanzo unos pasos de la ronda 1: cada operación muestra sus operandos, su resultado y la subclave que usa.»</p>
        <p class="script">«Con “Ronda ⏭” llego a la octava, que no cruza los bloques centrales, y después a la transformación de salida: cuatro operaciones con Z49 a Z52. Su resultado es el bloque cifrado.»</p>
        <ul><li>Guion: Paso ▶ ×4 → Ronda ⏭ hasta R8 → Ronda ⏭ (½) → Paso ▶ hasta el final.</li></ul>`,
    },

    /* 2.5 Conclusión y transición */
    {
      id: 'b2-cierre', person: P, type: 'handoff', next: 3, title: 'Conclusión del bloque 2', minutes: 0.3,
      teaser: 'Un ejemplo numérico completo y verificable, y cómo se descifra.',
      html: String.raw`
        <ul class="clean">
          <li>Bloque de 64 bits en 4 palabras; clave de 128 bits en 52 subclaves.</li>
          <li>8 rondas con caja MA y cruce, más una transformación de salida.</li>
          <li>La caja MA difunde cada bit a todo el bloque.</li>
        </ul>`,
      notes: String.raw`
        <p class="script">«Resumiendo: 64 bits de bloque, 128 de clave, 52 subclaves y 8 rondas y media con la caja MA como núcleo. Ahora veremos un ejemplo completo y cómo se descifra.»</p>`,
    },
  );
})();
