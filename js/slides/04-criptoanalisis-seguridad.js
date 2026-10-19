/*
 * BLOQUE 4: Criptoanálisis y seguridad (≈ 4,3 min).
 * Temas exclusivos: espacio de claves, seguridad teórica vs práctica, claves
 * débiles, ataques publicados (rondas reducidas vs IDEA completo), ventajas,
 * desventajas, patentes y licencias, transición a AES y relevancia actual.
 * Regla editorial: no exagerar los ataques; distinguir diseño, ataques,
 * implementación, modo de operación y gestión de claves.
 */
(function () {
  const W = window.Widgets;
  const P = 4;

  window.SLIDES.push(
    /* 4.0 Portada */
    {
      id: 'b4-portada', person: P, type: 'cover', title: 'Criptoanálisis y seguridad', minutes: 0.2,
      agenda: ['Espacio de claves', 'Teoría vs práctica', 'Claves débiles', 'Ataques publicados', 'Patentes y AES', 'Comparación', '¿Sigue siendo relevante?'],
      notes: String.raw`
        <p class="script">«La pregunta natural: ¿es seguro IDEA? La respuesta tiene matices, y hay que separar el algoritmo de cómo se usa.»</p>`,
    },

    /* 4.1 Espacio de claves */
    {
      id: 'b4-claves', person: P, title: 'Espacio de claves: 2¹²⁸', minutes: 0.6,
      refs: ['eff-1998', 'klr-2012'],
      html: String.raw`
        <p class="lead" style="margin-bottom:18px">\(2^{128} \approx 3{,}4 \times 10^{38}\) claves posibles. ¿Cuánto tardaría probarlas todas?</p>
        <div class="ksv-slot"></div>`,
      mount: (root) => W.KeyspaceViz(root.querySelector('.ksv-slot')),
      notes: String.raw`
        <p class="script">«Con un billón de claves por segundo en un millón de equipos, DES cae en milisegundos; IDEA necesitaría unos 10 a la 13 años, cientos de veces la edad del universo. La tercera barra es el mejor ataque que explota la estructura de IDEA: 2 a la 126 operaciones. Es cuatro veces mejor que la fuerza bruta, pero igual de inalcanzable.»</p>
        <ul><li>Mover los deslizadores en directo.</li></ul>`,
    },

    /* 4.2 Teoría vs práctica */
    {
      id: 'b4-teoria-practica', person: P, title: 'Seguridad teórica y seguridad práctica', minutes: 0.5,
      refs: ['sweet32-2016', 'klr-2012'],
      html: String.raw`<div class="layers-slot"></div>`,
      mount: (root) => W.LayersViz(root.querySelector('.layers-slot')),
      notes: String.raw`
        <p class="script">«La seguridad teórica pregunta si hay un ataque mejor que la fuerza bruta; la práctica, si un sistema real está protegido. En el diseño, IDEA completo no tiene ataques prácticos. Pero el bloque de 64 bits limita cuántos datos se pueden cifrar con una clave: tras unos 32 GiB aparecen colisiones, como mostró Sweet32 en 2016. Eso afecta a cualquier cifrador de 64 bits mal usado.»</p>`,
    },

    /* 4.3 Claves débiles */
    {
      id: 'b4-debiles', person: P, title: 'Claves débiles', minutes: 0.5,
      refs: ['dgv-1994', 'hawkes-1998', 'bnpv-2002', 'npv-2002'],
      html: String.raw`
        <div class="row" style="gap:30px;margin-bottom:16px">
          <div class="card grow"><b>1993</b> · Daemen et al.: \(2^{51}\) claves débiles</div>
          <div class="card grow"><b>1998</b> · Hawkes: \(2^{63}\) <span class="muted small">(1 de cada \(2^{65}\))</span></div>
          <div class="card grow"><b>2002</b> · Biryukov et al.: de \(2^{53}\) a \(2^{64}\)</div>
        </div>
        <div class="weak-slot"></div>`,
      mount: (root) => W.WeakKeyCheck(root.querySelector('.weak-slot')),
      notes: String.raw`
        <p class="script">«Una clave con muchos ceros produce subclaves 0000 o 0001, y entonces la multiplicación solo copia o cambia de signo: pierde su no linealidad. Con una clave aleatoria ninguna subclave es trivial; con una casi toda a cero, casi todas. Las clases conocidas tienen hasta 2 a la 64 claves: la probabilidad de caer en una al azar es despreciable.»</p>
        <ul><li>Los botones ilustran el mecanismo; no afirman que una clave pertenezca a una clase publicada.</li></ul>`,
    },

    /* 4.4 Ataques publicados */
    {
      id: 'b4-ataques', person: P, title: 'Ataques publicados: rondas reducidas e IDEA completo', minutes: 0.9,
      refs: ['bbs-1999', 'bdk-2006', 'sun-lai-2009', 'bdks-2015', 'klr-2012', 'bkr-2011'],
      html: String.raw`<div class="att-slot"></div>`,
      mount: (root) => W.AttacksViz(root.querySelector('.att-slot')),
      notes: String.raw`
        <p class="script">«Durante años, los ataques solo alcanzaban versiones recortadas: 4,5 rondas en 1999, 5 en 2006 y 6 en 2009. En 2011–2012 llegaron los primeros contra las 8,5 rondas completas, con bicliques y encuentro a medio camino.»</p>
        <p class="script">«A diferencia de la fuerza bruta, estos ataques explotan la estructura: cada subclave es una copia literal de bits de la clave. Aun así cuestan 2 a la 126, frente a 2 a la 128, y no permiten descifrar mensajes reales. Un ataque equivalente contra AES-128 cuesta 2 a la 126,1, y nadie considera roto AES.»</p>
        <ul><li><b>.</b> cambia a la vista de coste.</li></ul>`,
    },

    /* 4.5 Patentes y transición a AES */
    {
      id: 'b4-patentes', person: P, title: 'Patentes, licencias y la transición hacia AES', minutes: 0.5,
      refs: ['us5214703', 'ep0482154', 'gnupg-2012', 'aes-report-2001', 'fips197', 'rfc4880', 'rfc9580'],
      html: String.raw`
        <div class="lanes">
          <div class="lane"><div class="lane-h">Patentes de IDEA</div>
            <div class="ev"><b>1993</b>Patente US 5,214,703</div>
            <div class="ev"><b>1994</b>Patente europea EP 0 482 154</div>
            <div class="ev mid">Uso no comercial gratuito; el comercial requería licencia</div>
            <div class="ev"><b>2012</b>Expiran las últimas · GnuPG incorpora IDEA</div>
          </div>
          <div class="lane std"><div class="lane-h">Estándares</div>
            <div class="ev"><b>1997</b>Concurso abierto del NIST, libre de regalías</div>
            <div class="ev"><b>2001</b>FIPS 197: AES (Rijndael)</div>
            <div class="ev"><b>2005</b>El NIST retira DES</div>
            <div class="ev"><b>2024</b>RFC 9580: IDEA «MUST NOT be generated»</div>
          </div>
        </div>`,
      notes: String.raw`
        <p class="script">«IDEA estuvo patentado en EE. UU. y Europa. El uso comercial requería licencia, lo que frenó su adopción en el software libre. Mientras tanto, el NIST eligió en un concurso abierto y libre de regalías el AES, publicado en 2001. Cuando las patentes expiraron, en 2011 y 2012, AES ya era el estándar; hoy OpenPGP solo permite leer mensajes antiguos con IDEA.»</p>
        <ul><li>EP y JP expiraron el 16-05-2011; US el 07-01-2012. El RFC 4880 (2007) ya dejaba IDEA como opcional.</li></ul>`,
    },

    /* 4.6 Comparación IDEA / DES / AES */
    {
      id: 'b4-comparacion', person: P, title: 'DES, IDEA y AES: comparación conceptual', minutes: 0.5,
      refs: ['fips46', 'fips197', 'bkr-2011', 'klr-2012'],
      html: String.raw`<div class="cmp-slot"></div>`,
      mount: (root) => W.CompareViz(root.querySelector('.cmp-slot')),
      notes: String.raw`
        <p class="script">«DES e IDEA comparten el bloque de 64 bits, pero IDEA tiene 128 bits de clave frente a 56. AES duplica el bloque. Cada uno representa una escuela: Feistel, mezcla de grupos y sustitución-permutación. Hoy DES está roto en la práctica; IDEA y AES tienen ataques teóricos de coste parecido, sin impacto práctico.»</p>`,
    },

    /* 4.7 Ventajas, desventajas y relevancia actual */
    {
      id: 'b4-cierre', person: P, type: 'handoff', title: '¿Es relevante IDEA hoy?', minutes: 0.6,
      nextLabel: 'Preguntas',
      teaser: 'Gracias. En la siguiente diapositiva está la bibliografía completa.',
      refs: ['klr-2012', 'rfc9580', 'sweet32-2016'],
      html: String.raw`
        <div class="grid-2 proscons compact">
          <div class="card pros"><h3>Ventajas</h3><ul class="clean">
            <li>Sin ataques prácticos en 30 años</li><li>Diseño compacto, sin tablas</li><li>Mismo circuito para cifrar y descifrar</li></ul></div>
          <div class="card cons"><h3>Desventajas</h3><ul class="clean">
            <li>Bloque de 64 bits</li><li>Planificación de claves lineal</li><li>Patentes y poco soporte actual</li></ul></div>
        </div>
        <p class="lead" style="margin-top:20px;font-size:26px"><strong>No está roto</strong>, pero para sistemas nuevos se prefiere AES. Sigue siendo valioso para leer datos antiguos (PGP 2.x) y como caso de estudio.</p>`,
      notes: String.raw`
        <p class="script">«A favor: treinta años sin ataques prácticos, un diseño compacto y el mismo circuito para cifrar y descifrar. En contra: el bloque de 64 bits, una planificación de claves que solo copia bits y las patentes.»</p>
        <p class="script">«Conclusión: IDEA no está roto, pero no lo usaríamos en un sistema nuevo; no por viejo, sino por su bloque y por el soporte de los estándares. Sigue siendo útil para leer datos antiguos y como ejemplo de diseño. Muchas gracias.»</p>`,
    },
  );
})();
