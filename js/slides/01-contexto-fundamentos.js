/*
 * BLOQUE 1: Contexto y fundamentos (≈ 4,3 min).
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
      id: 'b1-portada', person: P, type: 'cover', title: 'Contexto y fundamentos', minutes: 0.2,
      agenda: ['Qué es IDEA y su origen', 'DES y PGP', 'Tres operaciones', 'Por qué mezclarlas'],
      notes: String.raw`
        <p class="script">«En este bloque vemos qué es IDEA, por qué se creó y en qué matemáticas se apoya.»</p>`,
    },

    /* 1.1 Qué es IDEA + contexto histórico */
    {
      id: 'b1-intro', person: P, title: '¿Qué es IDEA? Origen en el ETH Zúrich', minutes: 1.0,
      refs: ['lai-massey-1990', 'lai-massey-murphy-1991', 'lai-1992'],
      html: String.raw`
        <p class="lead" style="margin-bottom:6px">Un <strong>cifrador simétrico por bloques</strong>: la misma clave cifra y descifra. Su idea central es mezclar operaciones de <span class="op-xor">tres</span> <span class="op-add">grupos</span> <span class="op-mul">algebraicos</span> distintos.</p>
        <div class="tl-slot"></div>`,
      mount: (root) => W.Timeline(root.querySelector('.tl-slot')),
      notes: String.raw`
        <p class="script">«IDEA es un cifrador simétrico por bloques: emisor y receptor comparten la misma clave. En lugar de tablas de sustitución, como DES, mezcla tres operaciones aritméticas de grupos algebraicos distintos.»</p>
        <p class="script">«Nació en el ETH de Zúrich. Xuejia Lai y James Massey presentaron un primer diseño, PES, en 1990. Ese mismo año apareció el criptoanálisis diferencial, y en 1991 lo reforzaron frente a él con el nombre IPES. En 1992, la tesis de Lai lo presenta ya como IDEA.»</p>
        <ul><li>Recorrer la línea de tiempo con <b>.</b> sin cambiar de diapositiva. No dar aquí los tamaños de bloque ni de clave (bloque 2).</li></ul>`,
    },

    /* 1.2 DES y PGP */
    {
      id: 'b1-des-pgp', person: P, title: 'Por qué nació y dónde se usó: DES y PGP', minutes: 0.9,
      refs: ['fips46', 'biham-shamir-1991', 'eff-1998', 'garfinkel-1994', 'rfc1991'],
      html: String.raw`
        <div class="grid-2" style="flex:1;align-items:start">
          <div class="col">
            <h3>Limitaciones de DES (1977)</h3>
            <div class="mini-card"><b>56 bits</b><span>de clave: en 1998 la EFF encontraba una clave en días</span></div>
            <div class="mini-card"><b>Hardware</b><span>permutaciones de bits, lentas en el software de la época</span></div>
            <div class="mini-card"><b>Δ 1990</b><span>el ataque diferencial obligó a diseñar contra ataques estadísticos</span></div>
            <div class="callout" style="margin-top:6px">IDEA: clave mucho más larga y operaciones naturales de 16 bits.</div>
          </div>
          <div class="col">
            <h3>IDEA en PGP 2.0 (1992)</h3>
            <svg viewBox="0 0 620 300" role="img" aria-label="Esquema híbrido de PGP">
              <defs><marker id="ar2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#7f90ae"/></marker></defs>
              <g font-family="Inter, sans-serif" font-size="19" fill="#e8eef9" text-anchor="middle">
                <rect x="0" y="20" width="150" height="60" rx="10" fill="#14213b" stroke="#22314f"/><text x="75" y="56">Mensaje</text>
                <rect x="0" y="190" width="170" height="70" rx="10" fill="#14213b" stroke="var(--key)"/><text x="85" y="220" fill="var(--key)">Clave de</text><text x="85" y="244" fill="var(--key)">sesión aleatoria</text>
                <rect x="220" y="14" width="180" height="72" rx="12" fill="#14213b" stroke="var(--pc)" stroke-width="2.5"/><text x="310" y="48" font-weight="700" fill="var(--pc)">IDEA</text><text x="310" y="70" font-size="15" fill="#7f90ae">cifra los datos</text>
                <rect x="220" y="188" width="180" height="74" rx="12" fill="#14213b" stroke="#7f90ae" stroke-width="2"/><text x="310" y="220" font-weight="700">RSA</text><text x="310" y="244" font-size="15" fill="#7f90ae">protege la clave</text>
                <rect x="460" y="96" width="160" height="96" rx="12" fill="#0f1a30" stroke="#22314f"/><text x="540" y="136">Mensaje</text><text x="540" y="160">PGP</text>
                <path d="M150 50H218" stroke="#7f90ae" stroke-width="2.5" marker-end="url(#ar2)"/>
                <path d="M170 225H218" stroke="var(--key)" stroke-width="2.5" marker-end="url(#ar2)"/>
                <path d="M85 190V120H310V88" stroke="var(--key)" stroke-width="2" fill="none" stroke-dasharray="6 5" marker-end="url(#ar2)"/>
                <path d="M400 50H430V125H458" stroke="#7f90ae" stroke-width="2.5" fill="none" marker-end="url(#ar2)"/>
                <path d="M400 225H430V165H458" stroke="#7f90ae" stroke-width="2.5" fill="none" marker-end="url(#ar2)"/>
              </g>
            </svg>
            <p class="small muted">Sustituyó a BassOmatic, el cifrador de PGP 1.0, y llevó IDEA al correo cifrado de todo el mundo.</p>
          </div>
        </div>`,
      notes: String.raw`
        <p class="script">«¿Por qué hacía falta? DES tenía una clave de solo 56 bits: en 1998 la EFF construyó una máquina que encontraba una clave en días. Además, estaba pensado para hardware y en 1990 el ataque diferencial cambió las reglas del diseño. IDEA respondió con una clave mucho más larga y operaciones naturales para un procesador de 16 bits.»</p>
        <p class="script">«Se hizo famoso con PGP. En la versión 2.0, de 1992, Phil Zimmermann sustituyó su cifrador BassOmatic por IDEA. PGP usa un esquema híbrido: IDEA cifra el mensaje con una clave de sesión aleatoria y RSA cifra solo esa clave.»</p>
        <ul><li>Las patentes y licencias las trata el bloque 4.</li></ul>`,
    },

    /* 1.3 Tres operaciones (fundamentos + laboratorio) */
    {
      id: 'b1-lab', person: P, title: 'Tres operaciones sobre palabras de 16 bits', minutes: 1.3,
      kicker: 'Bloque 1 · Interactivo · operaciones reales de IDEA',
      refs: ['lai-massey-1990', 'hac-1996'],
      html: String.raw`
        <div class="formula-row ops-groups">
          <span class="op-xor">\(a \oplus b\)</span><span class="muted small">XOR · \((\mathbb{Z}_2)^{16}\)</span>
          <span class="op-add">\((a+b) \bmod 2^{16}\)</span><span class="muted small">\(\mathbb{Z}_{2^{16}}\)</span>
          <span class="op-mul">\((a\cdot b) \bmod (2^{16}{+}1)\)</span><span class="muted small">\(\mathbb{Z}^{*}_{65537}\) · <span class="mono">0000</span> ≡ \(2^{16}\)</span>
        </div>
        <div class="ops-slot"></div>`,
      mount: (root) => W.OpsLab(root.querySelector('.ops-slot')),
      notes: String.raw`
        <p class="script">«IDEA trabaja con palabras de 16 bits y solo tres operaciones, cada una de un grupo distinto: el XOR, la suma módulo 2 a la 16 y la multiplicación módulo 2 a la 16 más 1, es decir, módulo 65 537.»</p>
        <p class="script">«65 537 es primo, así que los valores del 1 al 65 536 forman un grupo y todos tienen inverso. Como 65 536 no cabe en 16 bits, la palabra 0000 representa 2 a la 16. Por ejemplo, con a = 0, 0 ⊙ 3 = 65 536 · 3 mód 65 537 = 65 534, FFFE. Con los mismos dos números, cada operación da un resultado muy distinto.»</p>
        <ul><li>Secuencia: Ejemplo → Con acarreo → a = 0 → b = 1.</li></ul>`,
    },

    /* 1.4 Por qué mezclar */
    {
      id: 'b1-mezcla', person: P, title: '¿Por qué mezclar operaciones incompatibles?', minutes: 0.6,
      refs: ['lai-massey-1990'],
      html: String.raw`
        <div class="laws-slot"></div>
        <div class="callout mt-auto">Entre ⊕, ⊞ y ⊙ no hay distributividad ni asociatividad: el cifrado no se reduce a un sistema de ecuaciones sencillo. Es <strong>confusión</strong> conseguida sin tablas.</div>`,
      mount: (root) => W.LawsLab(root.querySelector('.laws-slot')),
      notes: String.raw`
        <p class="script">«¿Por qué tres operaciones distintas? Porque son incompatibles. Si pruebo 100 000 ternas al azar, la distributividad o la asociatividad entre ellas casi nunca se cumplen. Así, ninguna operación es lineal vista desde las otras, y un atacante no puede simplificar el cifrador a ecuaciones fáciles.»</p>`,
    },

    /* 1.5 Conclusión y transición */
    {
      id: 'b1-cierre', person: P, type: 'handoff', next: 2, title: 'Conclusión del bloque 1', minutes: 0.3,
      teaser: 'Cómo se organizan estas operaciones dentro del algoritmo.',
      html: String.raw`
        <ul class="clean">
          <li>IDEA nace en el ETH Zúrich (1990–1992) como alternativa a DES.</li>
          <li>PGP 2.0 lo llevó a todo el mundo.</li>
          <li>Su fuerza: mezclar <span class="op-xor">⊕</span>, <span class="op-add">⊞</span> y <span class="op-mul">⊙</span>, tres grupos incompatibles.</li>
        </ul>`,
      notes: String.raw`
        <p class="script">«En resumen: alternativa a DES, difundido con PGP y basado en mezclar tres grupos incompatibles. Ahora veremos cómo se organizan dentro del algoritmo.»</p>`,
    },
  );
})();
