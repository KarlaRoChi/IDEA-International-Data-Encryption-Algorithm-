/*
 * BLOQUE 1 — Persona 1: Contexto y fundamentos.
 * Temas exclusivos: introducción, historia (ETH Zúrich, Lai y Massey),
 * limitaciones de DES, adopción en PGP, fundamentos matemáticos y las tres
 * operaciones (⊕, ⊞, ⊙ con el tratamiento del cero), y por qué mezclarlas.
 * NO incluye: rondas, subclaves, ejemplo completo ni ataques.
 */
(function () {
  const W = window.Widgets;
  const P = 1;

  window.SLIDES.push(
    /* 1.0 Portada del bloque */
    {
      id: 'b1-portada', person: P, type: 'cover', title: 'Contexto y fundamentos', minutes: 0.3,
      agenda: ['Qué es IDEA', 'ETH Zúrich, 1990–1992', 'El problema de DES', 'IDEA en PGP', 'Tres operaciones', 'Por qué mezclarlas'],
      notes: String.raw`
        <p class="script">«Mi parte responde a tres preguntas: qué es IDEA, por qué se creó y en qué matemáticas se apoya. Mis compañeros explicarán después cómo se organiza el algoritmo, un ejemplo completo y su seguridad.»</p>`,
    },

    /* 1.1 Introducción */
    {
      id: 'b1-intro', person: P, title: '¿Qué es IDEA?', minutes: 0.8,
      refs: ['lai-massey-1990', 'hac-1996'],
      html: String.raw`
        <div class="row" style="gap:56px;align-items:center;flex:1">
          <div class="col grow">
            <p class="lead">Un <strong>cifrador simétrico por bloques</strong> propuesto como alternativa a DES.</p>
            <ul class="clean" style="margin-top:18px">
              <li><strong>Simétrico:</strong> la misma clave secreta cifra y descifra.</li>
              <li><strong>Por bloques:</strong> transforma bloques de tamaño fijo, no un flujo de bits.</li>
              <li><strong>Idea central:</strong> mezclar operaciones de <span class="op-xor">tres</span> <span class="op-add">grupos</span> <span class="op-mul">algebraicos</span> distintos en lugar de usar tablas de sustitución.</li>
            </ul>
          </div>
          <svg class="intro-diagram" viewBox="0 0 560 300" role="img" aria-label="Esquema de cifrado simétrico">
            <defs><marker id="ar1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#7f90ae"/></marker></defs>
            <g font-family="Inter, sans-serif" font-size="20" fill="#e8eef9" text-anchor="middle">
              <rect x="10" y="120" width="110" height="60" rx="10" fill="#14213b" stroke="#22314f"/><text x="65" y="157">Mensaje</text>
              <rect x="200" y="110" width="160" height="80" rx="12" fill="#14213b" stroke="var(--pc)" stroke-width="2"/><text x="280" y="148" font-weight="700" fill="var(--pc)">IDEA</text><text x="280" y="172" font-size="15" fill="#7f90ae">cifrar / descifrar</text>
              <rect x="440" y="120" width="110" height="60" rx="10" fill="#14213b" stroke="#22314f"/><text x="495" y="150">Texto</text><text x="495" y="170" font-size="15" fill="#7f90ae">cifrado</text>
              <path d="M120 150H198" stroke="#7f90ae" stroke-width="2.5" marker-end="url(#ar1)"/>
              <path d="M360 150H438" stroke="#7f90ae" stroke-width="2.5" marker-end="url(#ar1)"/>
              <circle cx="280" cy="40" r="22" fill="none" stroke="var(--key)" stroke-width="3"/><path d="M280 62V80M280 72h10" stroke="var(--key)" stroke-width="3"/>
              <path d="M280 84V108" stroke="var(--key)" stroke-width="2.5" marker-end="url(#ar1)"/>
              <text x="340" y="46" font-size="17" fill="var(--key)" text-anchor="start">clave secreta</text>
              <text x="280" y="250" font-size="16" fill="#7f90ae">La misma clave en ambos sentidos</text>
            </g>
          </svg>
        </div>`,
      notes: String.raw`
        <p class="script">«IDEA es un cifrador simétrico por bloques: emisor y receptor comparten una misma clave secreta, y el algoritmo transforma bloques de tamaño fijo. Lo propusieron Xuejia Lai y James Massey como alternativa a DES.»</p>
        <p class="script">«Lo que lo hace especial no es su tamaño ni su velocidad, sino su principio de diseño. DES usa tablas de sustitución, las cajas S. IDEA, en cambio, consigue la no linealidad mezclando tres operaciones aritméticas que pertenecen a grupos algebraicos distintos. Esa idea guía toda la presentación.»</p>
        <ul><li>No dar aquí el tamaño de bloque ni de clave: lo presenta la Persona 2.</li>
        <li>Si preguntan por el nombre: IDEA = <i>International Data Encryption Algorithm</i>.</li></ul>`,
    },

    /* 1.2 Contexto histórico */
    {
      id: 'b1-historia', person: P, title: 'Contexto histórico: ETH Zúrich, 1990–1992', minutes: 1.2,
      refs: ['lai-massey-1990', 'lai-massey-murphy-1991', 'lai-1992'],
      html: String.raw`<div class="tl-slot"></div>
        <p class="xsmall muted mt-auto">Haz clic en cada hito o usa las teclas <kbd>.</kbd> y <kbd>,</kbd> para recorrer la línea de tiempo.</p>`,
      mount: (root) => W.Timeline(root.querySelector('.tl-slot')),
      notes: String.raw`
        <p class="script">«IDEA nace en el ETH de Zúrich, en el grupo de James Massey. Su doctorando Xuejia Lai y él presentaron en EUROCRYPT 1990 un primer diseño llamado PES, <i>Proposed Encryption Standard</i>.»</p>
        <p class="script">«Ese mismo año, Biham y Shamir presentaron el criptoanálisis diferencial, una técnica nueva que obligó a revisar muchos diseños. En 1991, Lai, Massey y Murphy estudiaron esa amenaza con la teoría de los cifradores de Markov y reforzaron PES. El resultado se llamó IPES, <i>Improved</i> PES. En 1992 la tesis doctoral de Lai lo presenta ya como IDEA, junto con el vector de prueba que usará mi compañero en el bloque 3.»</p>
        <ul><li>El diseño se hizo con un contrato de investigación de la Fundación Hasler, luego integrada en Ascom-Tech AG. Las patentes las cuenta la Persona 4.</li>
        <li>Recorrer con <b>.</b> (siguiente hito) sin cambiar de diapositiva.</li></ul>`,
    },

    /* 1.3 El problema que resolvía */
    {
      id: 'b1-des', person: P, title: 'El problema: las limitaciones de DES', minutes: 1.1,
      refs: ['fips46', 'biham-shamir-1991', 'eff-1998'],
      html: String.raw`
        <div class="grid-3 des-cards" style="margin-top:6px">
          <div class="card accent">
            <div class="big-number">56<small>bits</small></div>
            <h3 style="margin-top:14px">Clave corta</h3>
            <p class="small">\(2^{56} \approx 7{,}2\times10^{16}\) claves. En 1998 la EFF construyó una máquina, <i>Deep Crack</i>, que encontraba una clave DES en días.</p>
          </div>
          <div class="card accent">
            <div class="big-number" style="font-size:60px">HW</div>
            <h3 style="margin-top:14px">Pensado para hardware</h3>
            <p class="small">Las permutaciones de bits son baratas en un chip pero lentas en el software de la época, que trabajaba con palabras de 8 o 16 bits.</p>
          </div>
          <div class="card accent">
            <div class="big-number" style="font-size:60px">Δ</div>
            <h3 style="margin-top:14px">Ataques nuevos</h3>
            <p class="small">El criptoanálisis diferencial (1990) mostró que había que diseñar contra ataques estadísticos. Los criterios de las cajas S de DES no eran públicos.</p>
          </div>
        </div>
        <div class="callout mt-auto"><strong>Objetivo de IDEA:</strong> una clave mucho más larga, operaciones eficientes en procesadores de 16 bits y un diseño razonado frente al ataque diferencial.</div>`,
      notes: String.raw`
        <p class="script">«¿Por qué hacía falta una alternativa? DES, estandarizado en 1977, tenía tres problemas. El primero, una clave efectiva de solo 56 bits. Hoy eso se recorre por fuerza bruta: en 1998 la Electronic Frontier Foundation construyó, por unos 250 000 dólares, una máquina que encontraba una clave en días.»</p>
        <p class="script">«El segundo: DES se diseñó para hardware. Sus permutaciones de bits son muy rápidas en un chip, pero costosas en un programa. El tercero: en 1990 apareció el criptoanálisis diferencial y los diseñadores ya no podían ignorar los ataques estadísticos. Además, los criterios con los que se eligieron las cajas S de DES no se habían publicado.»</p>
        <p class="script">«IDEA se propuso resolver los tres: una clave mucho más larga, operaciones naturales para un procesador de 16 bits y un diseño justificado frente al ataque diferencial.»</p>
        <ul><li>No dar todavía los 128 bits de IDEA: decir solo «mucho más larga». La cifra la da la Persona 2.</li></ul>`,
    },

    /* 1.4 PGP */
    {
      id: 'b1-pgp', person: P, title: 'Aplicación histórica: IDEA en PGP', minutes: 0.9,
      refs: ['garfinkel-1994', 'rfc1991'],
      html: String.raw`
        <div class="row" style="gap:48px;flex:1;align-items:center">
          <div class="col" style="width:560px">
            <ul class="clean">
              <li><strong>1991 · PGP 1.0</strong> (Phil Zimmermann) usaba un cifrador propio, <i>BassOmatic</i>, con debilidades graves.</li>
              <li><strong>1992 · PGP 2.0</strong> lo sustituye por IDEA.</li>
              <li>PGP se difunde por todo el mundo para el correo cifrado y lleva IDEA consigo.</li>
            </ul>
            <p class="small muted" style="margin-top:12px">El formato de PGP 2.x quedó documentado en el RFC 1991 (1996).</p>
          </div>
          <svg viewBox="0 0 760 380" class="grow" role="img" aria-label="Esquema híbrido de PGP">
            <defs><marker id="ar2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#7f90ae"/></marker></defs>
            <g font-family="Inter, sans-serif" font-size="19" fill="#e8eef9" text-anchor="middle">
              <rect x="0" y="40" width="150" height="64" rx="10" fill="#14213b" stroke="#22314f"/><text x="75" y="78">Mensaje</text>
              <rect x="0" y="226" width="170" height="72" rx="10" fill="#14213b" stroke="var(--key)"/><text x="85" y="257" fill="var(--key)">Clave de</text><text x="85" y="281" fill="var(--key)">sesión aleatoria</text>
              <rect x="250" y="32" width="190" height="80" rx="12" fill="#14213b" stroke="var(--pc)" stroke-width="2.5"/><text x="345" y="68" font-weight="700" fill="var(--pc)">IDEA</text><text x="345" y="92" font-size="15" fill="#7f90ae">rápido, simétrico</text>
              <rect x="240" y="222" width="230" height="80" rx="12" fill="#14213b" stroke="#7f90ae" stroke-width="2"/><text x="355" y="256" font-weight="700">RSA</text><text x="355" y="282" font-size="15" fill="#7f90ae">clave pública del destinatario</text>
              <rect x="560" y="120" width="190" height="110" rx="12" fill="#0f1a30" stroke="#22314f"/><text x="655" y="160">Mensaje PGP</text><text x="655" y="186" font-size="15" fill="#7f90ae">texto cifrado</text><text x="655" y="208" font-size="15" fill="#7f90ae">+ clave cifrada</text>
              <path d="M150 72H248" stroke="#7f90ae" stroke-width="2.5" marker-end="url(#ar2)"/>
              <path d="M170 262H238" stroke="var(--key)" stroke-width="2.5" marker-end="url(#ar2)"/>
              <path d="M85 226V150H345V114" stroke="var(--key)" stroke-width="2" fill="none" stroke-dasharray="6 5" marker-end="url(#ar2)"/>
              <path d="M440 72H500V150H558" stroke="#7f90ae" stroke-width="2.5" fill="none" marker-end="url(#ar2)"/>
              <path d="M470 262H510V200H558" stroke="#7f90ae" stroke-width="2.5" fill="none" marker-end="url(#ar2)"/>
              <text x="380" y="355" font-size="16" fill="#7f90ae">Esquema híbrido: IDEA cifra los datos; RSA solo protege la clave</text>
            </g>
          </svg>
        </div>`,
      notes: String.raw`
        <p class="script">«IDEA se hizo famoso gracias a PGP, <i>Pretty Good Privacy</i>, el programa de Phil Zimmermann para cifrar correo. La primera versión, de 1991, usaba un cifrador inventado por el propio Zimmermann, BassOmatic. Eli Biham le mostró que era débil. En PGP 2.0, de 1992, Zimmermann lo cambió por IDEA.»</p>
        <p class="script">«PGP usa un esquema híbrido. Para cada mensaje genera una clave de sesión aleatoria y cifra el texto con IDEA, que es rápido. Después cifra solo esa clave con RSA, usando la clave pública del destinatario. Así IDEA pasó a proteger el correo de usuarios de todo el mundo durante los años noventa.»</p>
        <ul><li>Las licencias y patentes de IDEA, que influyeron en la evolución de PGP, las trata la Persona 4.</li></ul>`,
    },

    /* 1.5 Fundamentos matemáticos */
    {
      id: 'b1-fundamentos', person: P, title: 'Fundamentos: tres grupos sobre palabras de 16 bits', minutes: 1.1,
      refs: ['lai-massey-1990', 'hac-1996'],
      html: String.raw`
        <div class="grid-3">
          <div class="card op-card" style="--oc:var(--xor)">
            <div class="op-big op-xor">⊕</div><h3>XOR bit a bit</h3>
            <div class="formula">\(a \oplus b\)</div>
            <p class="small">Suma módulo 2 de cada bit, sin acarreos.<br>Grupo \((\mathbb{Z}_2)^{16}\) · neutro 0 · cada elemento es su propio inverso.</p>
          </div>
          <div class="card op-card" style="--oc:var(--add)">
            <div class="op-big op-add">⊞</div><h3>Suma módulo \(2^{16}\)</h3>
            <div class="formula">\((a + b) \bmod 2^{16}\)</div>
            <p class="small">Suma entera que descarta el acarreo final.<br>Grupo \(\mathbb{Z}_{2^{16}}\) · neutro 0 · inverso \(-a\).</p>
          </div>
          <div class="card op-card" style="--oc:var(--mul)">
            <div class="op-big op-mul">⊙</div><h3>Producto módulo \(2^{16}+1\)</h3>
            <div class="formula">\((a \cdot b) \bmod 65537\)</div>
            <p class="small">Grupo \(\mathbb{Z}^{*}_{65537}\) · neutro 1.<br>La palabra <span class="mono">0000</span> representa \(2^{16} \equiv -1\).</p>
          </div>
        </div>
        <div class="callout mt-auto">\(65537 = 2^{2^4}+1\) es <strong>primo</strong> (primo de Fermat). Por eso los 65 536 valores no nulos forman un grupo multiplicativo: exactamente uno por cada palabra de 16 bits, si el 0 se reinterpreta como \(2^{16}\).</div>`,
      notes: String.raw`
        <p class="script">«IDEA trabaja siempre con palabras de 16 bits y solo usa tres operaciones, cada una de un grupo algebraico distinto.»</p>
        <p class="script">«La primera es el XOR: sumamos bit a bit módulo 2, sin acarreos. La segunda es la suma de enteros módulo 2 a la 16: sumamos normalmente y descartamos el acarreo que se sale de los 16 bits. La tercera es la más original: la multiplicación módulo 2 a la 16 más 1, es decir, módulo 65 537.»</p>
        <p class="script">«¿Por qué 65 537? Porque es primo. Entonces los números del 1 al 65 536 forman un grupo con la multiplicación y todos tienen inverso. Son exactamente 2 a la 16 valores, tantos como palabras de 16 bits. El único problema es que 65 536 no cabe en 16 bits. La solución es reinterpretar la palabra 0000 como 2 a la 16. Este es el “tratamiento especial del cero”.»</p>
        <ul><li>Dato útil: \(2^{16} \equiv -1 \pmod{65537}\), así que multiplicar por la palabra 0 equivale a cambiar de signo.</li>
        <li>No entrar en cómo se usan los inversos para descifrar: es tema de la Persona 3.</li></ul>`,
    },

    /* 1.6 Laboratorio de operaciones */
    {
      id: 'b1-lab', person: P, title: 'Laboratorio: las tres operaciones', minutes: 1.4,
      kicker: 'Persona 1 · Interactivo · operaciones reales de IDEA sobre 16 bits',
      refs: ['lai-1992'],
      html: String.raw`<div class="ops-slot"></div>`,
      mount: (root) => W.OpsLab(root.querySelector('.ops-slot')),
      notes: String.raw`
        <p class="script">«Veamos las tres operaciones con los mismos dos números. Arriba están a y b en hexadecimal y en binario. Puedo cambiar cualquier bit con un clic.»</p>
        <p class="script">«El XOR, en cian, marca los bits en que a y b difieren. La suma, en verde, propaga acarreos: con el ejemplo “con acarreo”, el resultado pasa de 65 536 y se descarta el 2 a la 16. La multiplicación, en violeta, se calcula módulo 65 537.»</p>
        <p class="script">«Ahora el caso especial: con a = 0, la palabra cero se interpreta como 65 536. Por ejemplo, 0 ⊙ 3 da 65 536 · 3 módulo 65 537, que es 65 534, FFFE. Y con b = 1, la multiplicación deja a sin cambios: 1 es el neutro.»</p>
        <ul><li>Secuencia recomendada: Ejemplo → Con acarreo → a = 0 → b = 1.</li>
        <li>Mensaje clave: con las mismas entradas, cada operación da un resultado muy distinto.</li></ul>`,
    },

    /* 1.7 Por qué mezclar */
    {
      id: 'b1-mezcla', person: P, title: '¿Por qué mezclar operaciones incompatibles?', minutes: 1.0,
      refs: ['lai-massey-1990'],
      html: String.raw`
        <p class="lead" style="margin-bottom:20px">Entre estas tres operaciones no se cumplen las leyes que permitirían simplificar el cifrador.</p>
        <div class="laws-slot"></div>
        <div class="callout mt-auto">Si ⊙ fuera distributiva sobre ⊞, o ⊕ y ⊞ asociaran entre sí, el cifrado podría reescribirse como un sistema de ecuaciones sencillo. Al alternarlas se obtiene <strong>confusión</strong> sin tablas: ninguna operación es lineal vista desde el grupo de las otras.</div>`,
      mount: (root) => W.LawsLab(root.querySelector('.laws-slot')),
      notes: String.raw`
        <p class="script">«¿Por qué mezclar tres operaciones distintas? Porque son incompatibles: entre ellas no hay distributividad ni asociatividad. Este laboratorio lo comprueba con números reales.»</p>
        <p class="script">«Con una terna concreta vemos que a ⊙ (b ⊞ c) no es igual a (a ⊙ b) ⊞ (a ⊙ c). Si pruebo 100 000 ternas al azar, la igualdad casi nunca se cumple. Lo mismo pasa con la suma y el XOR.»</p>
        <p class="script">«Esto importa por lo siguiente. Si las operaciones se combinaran de forma regular, un atacante podría reescribir el cifrador como un sistema de ecuaciones sencillo y resolverlo. Al alternar grupos distintos, cada operación es no lineal desde el punto de vista de las otras dos. Es la “confusión” de Shannon, conseguida sin cajas S: solo con aritmética que un procesador de 16 bits ejecuta muy rápido.»</p>
        <ul><li>Detalle por si preguntan: ⊕ y ⊞ coinciden en el bit menos significativo (allí no hay acarreo de entrada); la diferencia aparece por la propagación de acarreos.</li></ul>`,
    },

    /* 1.8 Conclusión y transición */
    {
      id: 'b1-cierre', person: P, type: 'handoff', next: 2, title: 'Conclusión del bloque 1', minutes: 0.4,
      teaser: 'Cómo se organizan estas tres operaciones dentro del algoritmo.',
      html: String.raw`
        <ul class="clean">
          <li>IDEA nace en el ETH Zúrich (1990–1992) como alternativa a DES.</li>
          <li>PGP 2.0 lo llevó a usuarios de todo el mundo.</li>
          <li>Su fuerza se basa en mezclar <span class="op-xor">⊕</span>, <span class="op-add">⊞</span> y <span class="op-mul">⊙</span>, tres grupos que no se combinan entre sí.</li>
        </ul>`,
      notes: String.raw`
        <p class="script">«En resumen: IDEA nació en Zúrich como alternativa a DES, se difundió con PGP y su seguridad se apoya en mezclar tres grupos algebraicos incompatibles. Ahora mi compañero explicará cómo se organizan estas operaciones dentro del algoritmo.»</p>
        <ul><li>Pasar la palabra sin adelantar rondas ni subclaves.</li></ul>`,
    },
  );
})();
