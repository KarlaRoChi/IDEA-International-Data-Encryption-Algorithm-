/*
 * BLOQUE 2: Arquitectura y cifrado.
 * Temas exclusivos: estructura general, bloque de 64 bits, clave de 128 bits,
 * división en 4 subbloques, 52 subclaves, rotación de 25 bits, 8 rondas + ½,
 * organización de la ronda, caja MA y transformación del bloque.
 * Ejemplo PROPIO de este bloque: texto «IDEA1991» y clave «XuejiaLai&Massey»
 * (distinto del ejemplo numérico de el bloque 3, para no duplicarlo).
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
      id: 'b2-portada', person: P, type: 'cover', title: 'Arquitectura y cifrado', minutes: 0.3,
      agenda: ['Estructura general', 'Bloque de 64 bits', 'Clave de 128 bits', '52 subclaves', 'Rotación de 25 bits', '8 rondas + ½', 'Caja MA', 'Del texto en claro al cifrado'],
      notes: String.raw`
        <p class="script">«Ya conocemos las tres operaciones. En mi parte veremos cómo se organizan: tamaños, subclaves, rondas y la caja MA, y cómo un bloque de texto en claro se convierte en texto cifrado.»</p>`,
    },

    /* 2.1 Estructura general + división del bloque */
    {
      id: 'b2-estructura', person: P, title: 'Estructura general', minutes: 1.3,
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
        <p class="script">«Cuatro números resumen IDEA. Cifra bloques de 64 bits con una clave de 128 bits. De esa clave se derivan 52 subclaves de 16 bits. El bloque atraviesa 8 rondas idénticas y una media ronda final, la transformación de salida. Por eso se habla de “8,5 rondas”.»</p>
        <p class="script">«El primer paso es dividir el bloque de 64 bits en cuatro palabras de 16 bits, X1, X2, X3 y X4. Aquí uso como ejemplo el texto ASCII “IDEA1991”: al dividirlo, cada palabra contiene dos caracteres. A partir de ahora, todas las operaciones trabajan con estas palabras de 16 bits.»</p>
        <ul><li>Pulsar «Dividir en 4 palabras» (o la tecla <b>.</b>).</li>
        <li>Fíjate en el diagrama de la derecha: cada ronda usa 6 subclaves y la media ronda final usa 4. 8 × 6 + 4 = 52.</li></ul>`,
    },

    /* 2.2 Subclaves */
    {
      id: 'b2-subclaves', person: P, title: '52 subclaves por rotaciones de 25 bits', minutes: 1.4,
      refs: ['lai-1992', 'hac-1996'],
      html: String.raw`
        <div class="formula-row">
          <span>\(Z_1 \dots Z_8 = K\)</span><span class="arrow">→</span>
          <span>\(K \leftarrow K \lll 25\)</span><span class="arrow">→</span>
          <span>\(Z_9 \dots Z_{16}\)</span><span class="arrow">→ ⋯ →</span>
          <span>\(Z_{49} \dots Z_{52}\)</span>
          <span class="muted small" style="margin-left:auto">6 rotaciones · 7 × 8 = 56 palabras · se usan 52</span>
        </div>
        <div class="ks-slot"></div>`,
      mount: (root) => W.KeySchedule(root.querySelector('.ks-slot'), { key: DEMO.key }),
      notes: String.raw`
        <p class="script">«¿De dónde salen las 52 subclaves? El procedimiento es sencillo. La clave de 128 bits se parte en 8 palabras de 16 bits: esas son Z1 a Z8. Después se rota la clave completa 25 bits a la izquierda, de forma cíclica, y se vuelve a partir en 8 palabras: Z9 a Z16. Y así sucesivamente.»</p>
        <p class="script">«Cada celda conserva el color de su posición original en la clave, así que al pulsar “Rotar 25 bits” se ve el desplazamiento del patrón. Tras 6 rotaciones hay 56 palabras; solo se necesitan 52, así que las 4 últimas se descartan.»</p>
        <p class="script">«En la tabla de la derecha se ve qué subclave corresponde a cada ronda: seis por ronda, en este orden: multiplicación, suma, suma, multiplicación y dos multiplicaciones para la caja MA. La fila de salida solo usa cuatro.»</p>
        <ul><li>La clave de ejemplo es el texto ASCII «XuejiaLai&Massey».</li>
        <li>Una observación sin desarrollarla: la planificación solo selecciona bits, no los mezcla. Sus consecuencias de seguridad las analiza el bloque 4.</li></ul>`,
    },

    /* 2.3 Organización de una ronda */
    {
      id: 'b2-ronda', className: 'dense', person: P, title: 'Organización de una ronda', minutes: 1.2,
      refs: ['lai-massey-1990', 'schneier-1996'],
      html: String.raw`
        <div class="row" style="gap:36px;flex:1;min-height:0">
          <div class="col" style="width:640px">
            <div class="phase" data-ph="key"><b>1–4</b><div><strong>Capa de subclaves</strong><span>\(X_1{\odot}Z_1,\; X_2{\boxplus}Z_2,\; X_3{\boxplus}Z_3,\; X_4{\odot}Z_4\)</span></div></div>
            <div class="phase" data-ph="ma-in"><b>5–6</b><div><strong>Entradas de la caja MA</strong><span>\(p=(1)\oplus(3),\quad q=(2)\oplus(4)\)</span></div></div>
            <div class="phase" data-ph="ma"><b>7–10</b><div><strong>Caja MA</strong><span>\(t\) y \(u\) a partir de \(p, q, Z_5, Z_6\)</span></div></div>
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
        <p class="script">«Esta es una ronda completa. Usa seis subclaves y catorce operaciones, en cuatro fases. Los colores son los de las operaciones: violeta para ⊙, verde para ⊞ y cian para ⊕.»</p>
        <p class="script">«Primero, la capa de subclaves: cada palabra se combina con una subclave, multiplicando las de los extremos y sumando las centrales. Segundo, se calculan dos valores con XOR, p y q, que entran en la caja MA. Tercero, la caja MA produce dos salidas, t y u. Cuarto, t y u se combinan con XOR con las cuatro palabras. Por último, las dos palabras centrales se cruzan antes de la siguiente ronda.»</p>
        <p class="script">«Importante: en la octava ronda no hay cruce. Veremos que eso deja todo preparado para la transformación de salida.»</p>
        <ul><li>Avanzar paso a paso con el botón o con <b>.</b>; los nodos con borde punteado son los operandos del paso activo.</li></ul>`,
    },

    /* 2.4 Caja MA */
    {
      id: 'b2-ma', person: P, title: 'La caja de multiplicación-adición (MA)', minutes: 0.9,
      refs: ['lai-massey-1990'],
      html: String.raw`
        <div class="row" style="gap:40px;flex:1;min-height:0">
          <div class="col" style="width:700px">
            <div class="formula">\[\begin{aligned} s &= p \odot Z_5 \\ t &= (q \boxplus s) \odot Z_6 \\ u &= s \boxplus t \end{aligned}\]</div>
            <ul class="clean">
              <li>Dos entradas de 16 bits (\(p, q\)) y dos subclaves (\(Z_5, Z_6\)) dan dos salidas (\(t, u\)).</li>
              <li>Alterna ⊙ y ⊞: cada bit de \(t\) y \(u\) depende de <strong>todos</strong> los bits de \(p\), \(q\), \(Z_5\) y \(Z_6\). Es la difusión completa.</li>
              <li>Según Lai y Massey, es la estructura más pequeña (4 operaciones) que logra esa difusión.</li>
            </ul>
          </div>
          <div class="grow diagram-slot"></div>
        </div>`,
      mount: (root) => { const d = W.RoundDiagram(root.querySelector('.diagram-slot'), {}); d.focus('ma'); return {}; },
      notes: String.raw`
        <p class="script">«El corazón de cada ronda es la caja MA, de multiplicación-adición. Recibe p y q, los dos XOR de la fase anterior, y las subclaves Z5 y Z6. Calcula s = p ⊙ Z5; t = (q ⊞ s) ⊙ Z6; y u = s ⊞ t.»</p>
        <p class="script">«¿Por qué esta forma? Porque, alternando multiplicaciones y sumas, cada bit de salida depende de todos los bits de entrada y de las dos subclaves. A eso se le llama difusión completa. Según sus autores, es la estructura más pequeña, de solo cuatro operaciones, que la consigue.»</p>
        <p class="script">«Después, t se combina con XOR con las palabras 1 y 3, y u con las palabras 2 y 4. Así el efecto de la caja MA llega a todo el bloque.»</p>
        <ul><li>No adelantar por qué esta estructura facilita el descifrado: lo explica el bloque 3.</li></ul>`,
    },

    /* 2.5 Visualizador interactivo */
    {
      id: 'b2-visualizador', className: 'dense', person: P, title: 'Cifrado ronda por ronda', minutes: 1.9,
      kicker: 'Bloque 2 · Interactivo · valores calculados en vivo',
      refs: ['lai-1992'],
      html: String.raw`<div class="viz-slot" style="flex:1;min-height:0"></div>`,
      mount: (root) => W.RoundVisualizer(root.querySelector('.viz-slot'), DEMO),
      notes: String.raw`
        <p class="script">«Ahora vemos el algoritmo completo en marcha. Arriba están el bloque y la clave de mi ejemplo; puedo cambiarlos o generarlos al azar. A la izquierda están las rondas: R1 a R8 y la media ronda final, marcada aparte. En el centro, el diagrama con los valores reales. A la derecha, la operación activa y las subclaves de la ronda.»</p>
        <p class="script">«Avanzo paso a paso por la primera ronda. Cada operación muestra sus operandos y su resultado, y se resalta la subclave que usa. Al terminar la ronda, los bloques centrales se cruzan y la salida entra en la ronda 2.»</p>
        <p class="script">«Con “Ronda ⏭” salto a la octava: no hay cruce. Después, la transformación de salida solo hace cuatro operaciones con Z49 a Z52, sin caja MA. Su resultado es el bloque cifrado.»</p>
        <ul><li>Guion de clics: Paso ▶ ×4 (capa de subclaves) → Ronda ⏭ hasta R8 → Ronda ⏭ (½) → Paso ▶ hasta el final.</li>
        <li>«⟲ Reiniciar» vuelve al principio. «▷ Auto» reproduce sola la animación.</li>
        <li>El ejemplo numérico «oficial» y su verificación los presenta el bloque 3; aquí no se detallan.</li></ul>`,
    },

    /* 2.6 Transformación del bloque */
    {
      id: 'b2-trayectoria', person: P, title: 'Del texto en claro al texto cifrado', minutes: 0.7,
      refs: ['lai-massey-1990'],
      html: String.raw`<div class="traj-slot"></div>`,
      mount: (root) => W.Trajectory(root.querySelector('.traj-slot'), DEMO),
      notes: String.raw`
        <p class="script">«Esta tabla resume el recorrido del bloque: el texto en claro, el estado tras cada ronda y el texto cifrado.»</p>
        <p class="script">«Si invierto un solo bit del texto en claro, la diferencia se propaga. Después de la primera ronda ya cambian varias palabras, y en pocas rondas la mitad de los 64 bits ha cambiado, que es lo esperable en un buen cifrador. Esto es la caja MA y la mezcla de operaciones en acción.»</p>
        <ul><li>Pulsar «Invertir 1 bit» varias veces: cada pulsación prueba otro bit (secuencia fija, repetible).</li></ul>`,
    },

    /* 2.7 Conclusión y transición */
    {
      id: 'b2-cierre', person: P, type: 'handoff', next: 3, title: 'Conclusión del bloque 2', minutes: 0.4,
      teaser: 'Un ejemplo numérico completo y verificable, y cómo se deshace el cifrado.',
      html: String.raw`
        <ul class="clean">
          <li>Bloque de 64 bits en 4 palabras; clave de 128 bits en 52 subclaves (rotaciones de 25 bits).</li>
          <li>8 rondas idénticas con caja MA y cruce, más una transformación de salida.</li>
          <li>Cada ronda alterna las tres operaciones y la caja MA difunde cada bit a todo el bloque.</li>
        </ul>`,
      notes: String.raw`
        <p class="script">«Recapitulando: 64 bits de bloque, 128 de clave, 52 subclaves y 8 rondas y media, con la caja MA como núcleo de cada ronda. Mi compañero ahora hará el cálculo completo con un ejemplo publicado y explicará cómo se descifra.»</p>`,
    },
  );
})();
