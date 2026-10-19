/*
 * BLOQUE 3: Ejemplo práctico y descifrado (≈ 4,4 min).
 * Ejemplo REAL de IDEA (64/128 bits): el vector de prueba de Lai (1992),
 *   K = 0001 0002 0003 0004 0005 0006 0007 0008
 *   P = 0000 0001 0002 0003  ->  C = 11FB ED2B 0198 6DE5
 * Todos los valores se calculan en vivo con js/idea/idea.js.
 * NO incluye: el diseño general (bloque 2) ni el análisis de seguridad (bloque 4).
 */
(function () {
  const W = window.Widgets;
  const P = 3;

  window.SLIDES.push(
    /* 3.0 Portada */
    {
      id: 'b3-portada', person: P, type: 'cover', title: 'Ejemplo práctico y descifrado', minutes: 0.2,
      agenda: ['Datos del ejemplo', 'Ronda 1 paso a paso', 'Resultado final', 'Descifrado', 'Laboratorio'],
      notes: String.raw`
        <p class="script">«Ahora hacemos el cálculo completo con un ejemplo publicado, para que los números se puedan comprobar, y después vemos cómo se descifra.»</p>`,
    },

    /* 3.1 Datos y preparación */
    {
      id: 'b3-datos', person: P, title: 'Datos del ejemplo y preparación', minutes: 0.5,
      refs: ['lai-1992', 'schneier-1996'],
      html: String.raw`
        <div class="row" style="gap:40px;flex:1;min-height:0">
          <div class="col" style="width:640px">
            <span class="tag real" style="align-self:flex-start">Ejemplo real · bloque de 64 bits · clave de 128 bits</span>
            <div class="data-box"><span>Clave K</span><b class="mono k">0001 0002 0003 0004 0005 0006 0007 0008</b></div>
            <div class="data-box"><span>Texto en claro P</span><b class="mono">0000 0001 0002 0003</b></div>
            <div class="data-box muted-box"><span>Cifrado esperado (publicado)</span><b class="mono">11FB ED2B 0198 6DE5</b></div>
            <div class="callout">Preparación: \(X_1{=}0000,\; X_2{=}0001,\; X_3{=}0002,\; X_4{=}0003\)</div>
          </div>
          <div class="grow">
            <h4 class="table-title">Las 52 subclaves calculadas a partir de K</h4>
            <div class="zt-slot"></div>
          </div>
        </div>`,
      mount: (root) => {
        const I = window.IDEA;
        const { Z } = I.expandKey(I.hexToWords(I.REFERENCE_VECTOR.key, 8));
        let rows = '';
        for (let r = 0; r < 9; r++) {
          const n = r < 8 ? 6 : 4;
          rows += `<tr class="${r === 0 ? 'hl' : ''}"><th>${r < 8 ? 'R' + (r + 1) : 'Salida'}</th>${Array.from({ length: 6 }, (_, k) => k < n ? `<td class="mono">${W.hex(Z[6 * r + k])}</td>` : '<td></td>').join('')}</tr>`;
        }
        root.querySelector('.zt-slot').innerHTML = `<table class="zt"><thead><tr><th></th><th>Z₁</th><th>Z₂</th><th>Z₃</th><th>Z₄</th><th>Z₅</th><th>Z₆</th></tr></thead><tbody>${rows}</tbody></table>`;
        return {};
      },
      notes: String.raw`
        <p class="script">«Usamos el vector de prueba que publicó Lai en 1992: clave 0001 a 0008 y texto 0000 a 0003. El resultado debe ser 11FB ED2B 0198 6DE5. Preparar los datos es dividir el bloque en X1 a X4 y generar las 52 subclaves; las de la ronda 1 son 0001 a 0006.»</p>`,
    },

    /* 3.2 Ronda 1 paso a paso */
    {
      id: 'b3-ronda1', person: P, className: 'dense', title: 'Ronda 1, operación por operación', minutes: 1.0,
      kicker: 'Bloque 3 · Interactivo · 14 operaciones con valores reales',
      refs: ['lai-1992'],
      html: String.raw`<div class="walk-slot" style="flex:1;min-height:0"></div>`,
      mount: (root) => W.RoundWalkthrough(root.querySelector('.walk-slot')),
      notes: String.raw`
        <p class="script">«Paso 1: 0000 ⊙ 0001. Aquí aparece el cero: 0000 vale 65 536, y 65 536 · 1 vuelve a escribirse como 0000. Pasos 2 a 4: 0003, 0005 y 000C. Entradas de la caja MA: 0005 y 000F. La caja MA da 00F0 y 0109.»</p>
        <p class="script">«Tras la mezcla, la salida de la ronda 1 es 00F0 00F5 010A 0105.»</p>
        <ul><li>Detenerse en el paso 1 (cero) y en el 9 (caja MA); luego «Toda la ronda ⏩».</li></ul>`,
    },

    /* 3.3 Rondas restantes y resultado */
    {
      id: 'b3-resto', person: P, title: 'Rondas 2 a 8 y transformación final', minutes: 0.5,
      refs: ['lai-1992'],
      html: String.raw`<div class="rsum-slot"></div>`,
      mount: (root) => W.RoundsSummary(root.querySelector('.rsum-slot')),
      notes: String.raw`
        <p class="script">«Las rondas 2 a 8 repiten las mismas operaciones con sus subclaves. Tras la transformación de salida obtenemos 11FB ED2B 0198 6DE5: coincide con el valor publicado.»</p>
        <ul><li>Pulsar «Hasta el final ⏩». La implementación también se validó con 100 vectores de OpenSSL.</li></ul>`,
    },

    /* 3.4 Descifrado: subclaves inversas */
    {
      id: 'b3-descifrado', person: P, title: 'Descifrado: mismo circuito, subclaves inversas', minutes: 1.0,
      refs: ['hac-1996', 'lai-massey-1990'],
      html: String.raw`
        <div class="dec-rules">
          <div class="card op-card" style="--oc:var(--mul)"><b>⊙ → inverso multiplicativo</b><span>\(U = Z^{-1} \bmod 65537\) · \(0^{-1}=0\)</span></div>
          <div class="card op-card" style="--oc:var(--add)"><b>⊞ → opuesto aditivo</b><span>\(U = -Z \bmod 2^{16}\)</span></div>
          <div class="card op-card" style="--oc:var(--xor)"><b>Caja MA → la misma subclave</b><span>\((a\oplus t)\oplus(c\oplus t)=a\oplus c\): es una involución</span></div>
        </div>
        <p class="small muted" style="margin:8px 0 10px">Orden inverso: la ronda \(r\) de descifrado usa las subclaves de la ronda \(10-r\) del cifrado (\(U_2\) y \(U_3\) se intercambian en las rondas 2–8).</p>
        <div class="dkt-slot"></div>`,
      mount: (root) => W.DecryptKeyTable(root.querySelector('.dkt-slot')),
      notes: String.raw`
        <p class="script">«Para descifrar se usa el mismo algoritmo; solo cambian las subclaves, en orden inverso. Lo que se multiplicó se deshace con el inverso módulo 65 537, y lo que se sumó, con el opuesto módulo 2 a la 16.»</p>
        <p class="script">«La caja MA no se invierte: sus entradas p y q no cambian al aplicar la mezcla, porque el XOR con t se cancela entre dos palabras. Por eso Z5 y Z6 se reutilizan tal cual. Por ejemplo, U1 es el inverso de Z49 = 0080: FE01, y 0080 ⊙ FE01 = 0001.»</p>`,
    },

    /* 3.5 Laboratorio */
    {
      id: 'b3-laboratorio', person: P, className: 'dense', title: 'Laboratorio de cifrado y descifrado', minutes: 0.9,
      kicker: 'Bloque 3 · Interactivo · IDEA completo (64/128 bits)',
      refs: ['lai-1992'],
      html: String.raw`<div class="lab-slot" style="flex:1;min-height:0"></div>`,
      mount: (root) => W.CryptoLab(root.querySelector('.lab-slot')),
      notes: String.raw`
        <p class="script">«En el laboratorio se puede cifrar cualquier clave y bloque. Con “Ejecutar todo” obtengo 11FB ED2B 0198 6DE5. Al pulsar “Descifrar el resultado”, las subclaves pasan a ser U, y al terminar recuperamos 0000 0001 0002 0003, igual que el original.»</p>
        <ul><li>Si sobra tiempo, elegir «Aleatorio» y repetir la ida y vuelta.</li></ul>`,
    },

    /* 3.6 Conclusión y transición */
    {
      id: 'b3-cierre', person: P, type: 'handoff', next: 4, title: 'Conclusión del bloque 3', minutes: 0.3,
      teaser: '¿Qué tan seguro es IDEA?',
      html: String.raw`
        <ul class="clean">
          <li>Obtuvimos <span class="mono">11FB ED2B 0198 6DE5</span>, igual que el valor publicado.</li>
          <li>Se descifra con el mismo circuito y subclaves invertidas y reordenadas.</li>
          <li>El descifrado recupera exactamente el bloque original.</li>
        </ul>`,
      notes: String.raw`
        <p class="script">«El cifrado da el resultado publicado y el descifrado recupera el original. Queda una pregunta: ¿es seguro?»</p>`,
    },
  );
})();
