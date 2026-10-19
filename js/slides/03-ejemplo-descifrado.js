/*
 * BLOQUE 3: Ejemplo práctico y descifrado.
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
      id: 'b3-portada', person: P, type: 'cover', title: 'Ejemplo práctico y descifrado', minutes: 0.3,
      agenda: ['Datos del ejemplo', 'Preparación', 'Ronda 1 paso a paso', 'Rondas 2–8 y salida', 'Descifrado', 'Subclaves inversas', 'Laboratorio'],
      notes: String.raw`
        <p class="script">«Mi compañero mostró cómo está construido IDEA. Yo voy a hacer el cálculo completo con un ejemplo publicado, para que cualquiera pueda comprobar los números, y después explicaré cómo se descifra.»</p>`,
    },

    /* 3.1 Datos y preparación */
    {
      id: 'b3-datos', person: P, title: 'Datos del ejemplo y preparación', minutes: 1.0,
      refs: ['lai-1992', 'schneier-1996'],
      html: String.raw`
        <div class="row" style="gap:40px;flex:1;min-height:0">
          <div class="col" style="width:640px">
            <span class="tag real" style="align-self:flex-start">Ejemplo real · bloque de 64 bits · clave de 128 bits</span>
            <div class="data-box"><span>Clave K</span><b class="mono k">0001 0002 0003 0004 0005 0006 0007 0008</b></div>
            <div class="data-box"><span>Texto en claro P</span><b class="mono">0000 0001 0002 0003</b></div>
            <div class="data-box muted-box"><span>Cifrado esperado (publicado)</span><b class="mono">11FB ED2B 0198 6DE5</b></div>
            <p class="small">Es el vector de prueba de la tesis de Lai (1992), reproducido en la literatura. Permite comprobar que la implementación es correcta.</p>
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
        <p class="script">«Elegimos un ejemplo verificable: el vector de prueba que publicó Xuejia Lai en su tesis de 1992. La clave son las palabras 1 a 8 y el texto en claro, las palabras 0 a 3. Según la publicación, el resultado debe ser 11FB ED2B 0198 6DE5.»</p>
        <p class="script">«La preparación tiene dos partes. Primero se divide el bloque: X1 = 0000, X2 = 0001, X3 = 0002, X4 = 0003. Después se generan las 52 subclaves con el método que explicó mi compañero. Las de la ronda 1, resaltadas, son las propias palabras de la clave: 0001 a 0006. Las demás salen de las rotaciones; por ejemplo, la ronda 2 empieza con 0007 y 0008 y sigue con 0400, 0600, etc.»</p>
        <ul><li>Este ejemplo es real, con tamaños completos; no es una versión reducida.</li>
        <li>Las subclaves de la tabla se calculan al cargar la diapositiva; no están escritas a mano.</li></ul>`,
    },

    /* 3.2 Ronda 1 paso a paso */
    {
      id: 'b3-ronda1', className: 'dense', person: P, title: 'Ronda 1, operación por operación', minutes: 1.6,
      kicker: 'Bloque 3 · Interactivo · 14 operaciones con valores reales',
      refs: ['lai-1992'],
      html: String.raw`<div class="walk-slot" style="flex:1;min-height:0"></div>`,
      mount: (root) => W.RoundWalkthrough(root.querySelector('.walk-slot')),
      notes: String.raw`
        <p class="script">«Hagamos la primera ronda a mano. Paso 1: X1 ⊙ Z1 = 0000 ⊙ 0001. Aquí aparece el cero: la palabra 0000 vale 65 536, y 65 536 · 1 = 65 536, que vuelve a escribirse como 0000. Paso 2: 0001 ⊞ 0002 = 0003. Paso 3: 0002 ⊞ 0003 = 0005. Paso 4: 0003 ⊙ 0004 = 12, es decir, 000C.»</p>
        <p class="script">«Pasos 5 y 6, entradas de la caja MA: 0000 ⊕ 0005 = 0005, y 0003 ⊕ 000C = 000F. Caja MA: 0005 ⊙ 0005 = 0019; 000F ⊞ 0019 = 0028; 0028 ⊙ 0006 = 00F0; y 0019 ⊞ 00F0 = 0109.»</p>
        <p class="script">«Por último, la mezcla: 0000 ⊕ 00F0 = 00F0, 0005 ⊕ 00F0 = 00F5, 0003 ⊕ 0109 = 010A y 000C ⊕ 0109 = 0105. La salida de la ronda 1 es 00F0 00F5 010A 0105. La comprobación definitiva llegará al final: si el texto cifrado coincide con el publicado, toda la cadena de operaciones es correcta.»</p>
        <ul><li>Usar «Paso ▶» o la tecla <b>.</b>. Detenerse en el paso 1 (cero) y en el 9 (caja MA).</li></ul>`,
    },

    /* 3.3 Rondas restantes y resultado */
    {
      id: 'b3-resto', person: P, title: 'Rondas 2 a 8 y transformación final', minutes: 0.9,
      refs: ['lai-1992'],
      html: String.raw`<div class="rsum-slot"></div>`,
      mount: (root) => W.RoundsSummary(root.querySelector('.rsum-slot')),
      notes: String.raw`
        <p class="script">«Las rondas 2 a 8 repiten exactamente las mismas 14 operaciones, cada una con sus seis subclaves. La tabla muestra el estado del bloque al final de cada ronda.»</p>
        <p class="script">«Tras la ronda 8, que no cruza los bloques centrales, viene la transformación de salida: X1 ⊙ Z49, X2 ⊞ Z50, X3 ⊞ Z51 y X4 ⊙ Z52. El resultado es 11FB ED2B 0198 6DE5. Coincide con el valor publicado, así que podemos afirmar que nuestra implementación reproduce el vector de prueba.»</p>
        <ul><li>Además del vector de Lai, la implementación se validó con 100 vectores independientes generados con OpenSSL (ver README).</li></ul>`,
    },

    /* 3.4 Descifrado: la misma estructura */
    {
      id: 'b3-descifrado', person: P, title: 'Descifrar: el mismo circuito, otras subclaves', minutes: 1.0,
      refs: ['lai-massey-1990', 'hac-1996'],
      html: String.raw`
        <div class="grid-2" style="flex:1">
          <div class="col">
            <p class="lead" style="font-size:28px">IDEA descifra con el <strong>mismo algoritmo</strong>. Solo cambian las subclaves: \(U_1,\dots,U_{52}\).</p>
            <h3>1 · Deshacer la transformación de salida</h3>
            <div class="formula">\[X_1 = Y_1 \odot Z_{49}^{-1} \qquad X_2 = Y_2 \boxplus (-Z_{50})\]</div>
            <p class="small">Cada operación con subclave se deshace con su <strong>inverso</strong> en el mismo grupo: multiplicativo para ⊙ y aditivo para ⊞.</p>
          </div>
          <div class="col">
            <h3>2 · Deshacer la mezcla de una ronda</h3>
            <div class="formula">\[(a \oplus t) \oplus (c \oplus t) = a \oplus c\]</div>
            <p class="small">Las entradas de la caja MA, \(p\) y \(q\), <strong>no cambian</strong> al aplicar la mezcla: el XOR con \(t\) (o \(u\)) se cancela entre las dos palabras. Por eso, al pasar la salida otra vez por la misma estructura, la caja MA recalcula los mismos \(t, u\) y el XOR los elimina.</p>
            <div class="callout">La mezcla con la caja MA es una <strong>involución</strong>: aplicada dos veces es la identidad. \(Z_5\) y \(Z_6\) se reutilizan <strong>sin invertir</strong>.</div>
          </div>
        </div>`,
      notes: String.raw`
        <p class="script">«¿Cómo se descifra? Una de las ventajas de IDEA es que se usa exactamente el mismo algoritmo y solo cambian las subclaves.»</p>
        <p class="script">«Hay que deshacer dos cosas. La primera, las operaciones con subclave. Si se multiplicó por Z49, ahora se multiplica por su inverso módulo 65 537. Si se sumó Z50, ahora se suma su opuesto módulo 2 a la 16. Por eso usamos inversos multiplicativos y aditivos.»</p>
        <p class="script">«La segunda, la caja MA. Aquí hay un detalle elegante. La caja recibe p, el XOR de las palabras 1 y 3, y q, el XOR de las palabras 2 y 4. Después de la mezcla, ambas palabras quedan combinadas con el mismo t, y al hacer de nuevo su XOR, t se cancela. Es decir, p y q se pueden recalcular a partir de la salida, la caja MA produce los mismos t y u, y un segundo XOR los elimina. La mezcla es su propia inversa: una involución. Por eso Z5 y Z6 se reutilizan sin invertir.»</p>`,
    },

    /* 3.5 Subclaves de descifrado */
    {
      id: 'b3-subclaves-inv', person: P, title: 'Inversión y reordenamiento de las subclaves', minutes: 1.3,
      refs: ['hac-1996', 'lai-1992'],
      html: String.raw`
        <div class="formula small-formula">\[
          U^{(r)}_1 = \big(Z^{(10-r)}_1\big)^{-1},\;\;
          U^{(r)}_{2} = -Z^{(10-r)}_{3},\;\;
          U^{(r)}_{3} = -Z^{(10-r)}_{2},\;\;
          U^{(r)}_4 = \big(Z^{(10-r)}_4\big)^{-1},\;\;
          U^{(r)}_{5,6} = Z^{(9-r)}_{5,6}
        \]</div>
        <p class="small muted" style="margin:-6px 0 14px">\(r = 1,\dots,9\) · la «ronda 9» es la transformación de salida · en \(r=1\) y \(r=9\) no se intercambian \(U_2\) y \(U_3\) · \(0^{-1} = 0\) porque \(2^{16}\cdot 2^{16} \equiv 1 \pmod{65537}\)</p>
        <div class="dkt-slot"></div>`,
      mount: (root) => W.DecryptKeyTable(root.querySelector('.dkt-slot')),
      notes: String.raw`
        <p class="script">«Esta es la receta general. La ronda r de descifrado usa las subclaves de la ronda espejo del cifrado, la 10 − r, en orden inverso. Las multiplicativas se invierten módulo 65 537 y las aditivas se cambian de signo módulo 2 a la 16. Las de la caja MA se copian tal cual, porque la caja no se invierte, como acabamos de ver.»</p>
        <p class="script">«Un detalle: en las rondas intermedias las subclaves aditivas U2 y U3 se intercambian. Es para compensar el cruce de los bloques centrales. En la primera y en la última no se intercambian, porque allí no hay cruce.»</p>
        <p class="script">«Con nuestra clave: la primera subclave de descifrado es el inverso de Z49 = 0080. La tabla da FE01, y la comprobación 0080 ⊙ FE01 = 0001 confirma que es su inverso. Y la segunda es −Z50: 0000 menos 00C0, FF40.»</p>
        <ul><li>Recorrer R1 → R2 → ½ con los botones (o con <b>.</b>) para mostrar el intercambio y la copia de Z5/Z6.</li>
        <li>Inverso del cero: 0000 representa 2¹⁶ ≡ −1, y (−1)(−1) = 1, así que 0⁻¹ = 0.</li></ul>`,
    },

    /* 3.6 Laboratorio */
    {
      id: 'b3-laboratorio', className: 'dense', person: P, title: 'Laboratorio de cifrado y descifrado', minutes: 1.8,
      kicker: 'Bloque 3 · Interactivo · IDEA completo (64/128 bits)',
      refs: ['lai-1992'],
      html: String.raw`<div class="lab-slot" style="flex:1;min-height:0"></div>`,
      mount: (root) => W.CryptoLab(root.querySelector('.lab-slot')),
      notes: String.raw`
        <p class="script">«Para terminar, el laboratorio. Arriba se escriben la clave de 128 bits y el bloque de 64 bits en hexadecimal, o se elige un ejemplo. Dejo el vector de Lai.»</p>
        <p class="script">«Avanzo paso a paso: a la izquierda, el estado del bloque tras cada ronda; en el centro, las 14 operaciones de la ronda actual con sus operandos; a la derecha, las subclaves. Con “Ejecutar todo” llego al final: 11FB ED2B 0198 6DE5, y el laboratorio confirma que coincide con el valor publicado.»</p>
        <p class="script">«Ahora pulso “Descifrar el resultado”. El modo cambia a descifrado y las subclaves son ahora U: cada una indica de qué Z procede, si se invierte o si cambia de signo. Al ejecutar todo recuperamos 0000 0001 0002 0003, igual que el original.»</p>
        <ul><li>Si sobra tiempo: elegir «Aleatorio» y repetir la ida y vuelta para mostrar que funciona con cualquier clave.</li>
        <li>«⟲ Reiniciar» vuelve al cifrado con los datos actuales.</li></ul>`,
    },

    /* 3.7 Conclusión y transición */
    {
      id: 'b3-cierre', person: P, type: 'handoff', next: 4, title: 'Conclusión del bloque 3', minutes: 0.4,
      teaser: '¿Qué tan seguro es IDEA y qué ataques se conocen?',
      html: String.raw`
        <ul class="clean">
          <li>Con K = 0001…0008 y P = 0000 0001 0002 0003 obtuvimos <span class="mono">11FB ED2B 0198 6DE5</span>, igual que el valor publicado.</li>
          <li>Para descifrar se usa el mismo circuito con subclaves invertidas y reordenadas; Z5 y Z6 se reutilizan.</li>
          <li>El descifrado recupera exactamente el bloque original.</li>
        </ul>`,
      notes: String.raw`
        <p class="script">«Hemos comprobado con números reales que el cifrado da el resultado publicado y que el descifrado recupera el original. La pregunta que queda es si es seguro. Eso lo responde mi compañero.»</p>`,
    },
  );
})();
