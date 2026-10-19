/*
 * BLOQUE 4: Criptoanálisis y seguridad.
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
      id: 'b4-portada', person: P, type: 'cover', title: 'Criptoanálisis y seguridad', minutes: 0.3,
      agenda: ['Espacio de claves', 'Teoría vs práctica', 'Claves débiles', 'Ataques publicados', 'Fuerza bruta vs estructura', 'Ventajas y desventajas', 'Patentes', 'De IDEA a AES', '¿Sigue siendo relevante?'],
      notes: String.raw`
        <p class="script">«Ya sabemos cómo funciona IDEA y que nuestra implementación es correcta. Mi parte responde a la pregunta natural: ¿es seguro? La respuesta tiene matices, y conviene separar el algoritmo de cómo se usa.»</p>`,
    },

    /* 4.1 Espacio de claves */
    {
      id: 'b4-claves', person: P, title: 'Espacio de claves: 2¹²⁸', minutes: 0.9,
      refs: ['eff-1998', 'klr-2012'],
      html: String.raw`
        <p class="lead" style="margin-bottom:18px">\(2^{128} \approx 3{,}4 \times 10^{38}\) claves posibles. ¿Cuánto tardaría probarlas todas?</p>
        <div class="ksv-slot"></div>`,
      mount: (root) => W.KeyspaceViz(root.querySelector('.ksv-slot')),
      notes: String.raw`
        <p class="script">«Empecemos por el ataque más simple: probar todas las claves. IDEA tiene 2 elevado a 128 claves, unos 3,4 por 10 a la 38.»</p>
        <p class="script">«Con estos controles supongo un atacante muy poderoso: un billón de claves por segundo en cada equipo y un millón de equipos. DES cae en menos de un minuto. IDEA requeriría del orden de 10 a la 13 años, cientos de veces la edad del universo. Si subo los dos controles al máximo, mil billones de claves por segundo en mil millones de equipos, algo muy lejos de cualquier tecnología actual, aún harían falta unos diez millones de años.»</p>
        <p class="script">«La tercera barra es el mejor ataque publicado contra IDEA completo. Reduce el trabajo a unas 2 a la 126 operaciones: es cuatro veces menos, pero sigue siendo igual de inalcanzable.»</p>
        <ul><li>Mover los deslizadores en directo. Con los valores por defecto: 10¹² claves/s × 10⁶ equipos.</li></ul>`,
    },

    /* 4.2 Teoría vs práctica */
    {
      id: 'b4-teoria-practica', person: P, title: 'Seguridad teórica y seguridad práctica', minutes: 0.8,
      refs: ['sweet32-2016', 'klr-2012'],
      html: String.raw`
        <p class="lead" style="margin-bottom:20px">«¿IDEA es seguro?» depende de la capa que se analice.</p>
        <div class="layers-slot"></div>`,
      mount: (root) => W.LayersViz(root.querySelector('.layers-slot')),
      notes: String.raw`
        <p class="script">«Hay que distinguir capas. La seguridad teórica del algoritmo pregunta si existe un ataque mejor que la fuerza bruta. La seguridad práctica pregunta si un sistema real que usa IDEA está protegido.»</p>
        <p class="script">«En el diseño, IDEA completo no tiene ataques prácticos. Pero un sistema puede fallar por otras razones: una implementación que filtre información por tiempos, el modo de operación o una mala gestión de claves. En IDEA destaca el bloque de 64 bits: tras unos 2 a la 32 bloques cifrados con la misma clave, unos 32 GiB, aparecen colisiones por la paradoja del cumpleaños. Eso se explotó en 2016 contra 3DES y Blowfish con el ataque Sweet32. No es un fallo de IDEA en sí, sino de cualquier cifrador de bloque de 64 bits mal usado.»</p>
        <ul><li>Recorrer las cinco capas con un clic o con <b>.</b>.</li></ul>`,
    },

    /* 4.3 Claves débiles */
    {
      id: 'b4-debiles', person: P, title: 'Claves débiles', minutes: 0.9,
      refs: ['dgv-1994', 'hawkes-1998', 'bnpv-2002', 'npv-2002'],
      html: String.raw`
        <div class="row" style="gap:30px;margin-bottom:16px">
          <div class="card grow"><b>1993</b> · Daemen et al.: \(2^{51}\) claves débiles <span class="muted small">(probabilidad \(2^{-77}\))</span></div>
          <div class="card grow"><b>1998</b> · Hawkes: \(2^{63}\) claves <span class="muted small">(1 de cada \(2^{65}\))</span></div>
          <div class="card grow"><b>2002</b> · Biryukov et al.: clases de \(2^{53}\) a \(2^{64}\)</div>
        </div>
        <div class="weak-slot"></div>
        <p class="small muted mt-auto">Propuesta de corrección: combinar cada subclave con una constante mediante XOR (p. ej., <span class="mono">0DAE</span>), para que las claves con muchos ceros no den multiplicaciones triviales.</p>`,
      mount: (root) => W.WeakKeyCheck(root.querySelector('.weak-slot')),
      notes: String.raw`
        <p class="script">«Una debilidad conocida son las claves débiles. Como la planificación solo copia bits de la clave, una clave con muchos ceros produce subclaves 0000 o 0001. Multiplicar por 1 no hace nada, y multiplicar por 0000, que vale −1, solo cambia el signo. Así ⊙ pierde su no linealidad.»</p>
        <p class="script">«Aquí lo vemos: con una clave aleatoria, ninguna de las 34 subclaves multiplicativas es trivial. Con una clave casi toda a cero, casi todas lo son. En 1993, Daemen, Govaerts y Vandewalle encontraron 2 a la 51 claves débiles; después se encontraron clases mayores, de hasta 2 a la 64.»</p>
        <p class="script">«¿Es grave? Si la clave se genera al azar, la probabilidad de caer en una de esas clases es como mucho de 1 entre 2 a la 64. Es despreciable. Aun así, muestra un punto débil de la planificación de claves, y se propuso corregirlo combinando las subclaves con una constante.»</p>
        <ul><li>Los botones solo ilustran el mecanismo: no afirman que una clave pertenezca a una clase concreta publicada.</li></ul>`,
    },

    /* 4.4 Ataques publicados */
    {
      id: 'b4-ataques', person: P, title: 'Ataques publicados: rondas reducidas e IDEA completo', minutes: 1.2,
      refs: ['bbs-1999', 'bdk-2006', 'sun-lai-2009', 'bdks-2015', 'klr-2012'],
      html: String.raw`<div class="att-slot"></div>`,
      mount: (root) => W.AttacksViz(root.querySelector('.att-slot')),
      notes: String.raw`
        <p class="script">«Esta gráfica resume tres décadas de criptoanálisis. En la vista “¿Cuántas rondas?”, cada barra indica hasta qué ronda llega un ataque; la línea final marca las 8,5 rondas reales. Durante años, los mejores ataques solo alcanzaban versiones recortadas: 4,5 rondas en 1999, 5 en 2006 y 6 en 2009 y 2011.»</p>
        <p class="script">«En 2011–2012 aparecieron los primeros ataques contra IDEA completo: el de Biham, Dunkelman, Keller y Shamir, y el de bicliques de Khovratovich, Leurent y Rechberger. Pero ahora miremos “¿Cuánto cuesta?”: 2 a la 126,06 frente a 2 a la 128. Es un ataque formalmente mejor que la fuerza bruta, pero sigue completamente fuera de alcance, y además necesita 2 a la 52 textos elegidos.»</p>
        <p class="script">«Entonces, ¿qué significa “romper” IDEA? Que su margen de seguridad teórico se ha reducido un poco. No que alguien pueda descifrar un mensaje real. Para comparar: un ataque similar contra AES-128 cuesta 2 a la 126,1, y nadie considera roto AES.»</p>
        <ul><li>Cifras tomadas de las fuentes de la bibliografía. El ataque de 1999 se muestra sin coste porque no se verificaron sus cifras exactas.</li>
        <li><b>.</b> cambia a la vista de coste; luego recorre los ataques.</li></ul>`,
    },

    /* 4.5 Fuerza bruta vs ataque estructural */
    {
      id: 'b4-estructura', person: P, title: 'Fuerza bruta frente a ataques que explotan la estructura', minutes: 0.8,
      refs: ['bdks-2015', 'klr-2012'],
      html: String.raw`
        <div class="grid-2" style="margin-bottom:22px">
          <div class="card"><h3>Fuerza bruta</h3><p class="small">Trata el cifrador como una caja negra: prueba claves completas hasta acertar. El coste solo depende del tamaño de la clave.</p></div>
          <div class="card accent"><h3>Encuentro a medio camino / bicliques</h3><p class="small">Aprovechan que <strong>cada subclave es una selección de bits</strong> de la clave. Adivinando una parte, se calcula desde ambos extremos y se comprueba en el medio, reutilizando trabajo.</p></div>
        </div>
        <div class="kbu-slot"></div>`,
      mount: (root) => W.KeyBitUsage(root.querySelector('.kbu-slot')),
      notes: String.raw`
        <p class="script">«¿Cómo pueden ser mejores que la fuerza bruta? La fuerza bruta no usa ningún conocimiento del algoritmo. Los ataques estructurales sí: aprovechan propiedades matemáticas.»</p>
        <p class="script">«En IDEA la propiedad clave es la planificación de claves: cada subclave es una copia literal de 16 bits de la clave. Esta cuadrícula muestra los 128 bits de la clave y, en amarillo, los que usa la ronda seleccionada. Cada ronda completa depende de 96 bits; la transformación de salida, de solo 64; y la ronda 8 junto con la salida, de 103. Quien adivine esos bits puede calcular esa parte del cifrado sin conocer el resto. Con dos rondas completas ya se usan los 128 bits, y por eso los ataques trabajan con fragmentos de ronda y con los bits que comparten. Los ataques de encuentro a medio camino calculan desde el texto en claro y desde el cifrado y comparan en el centro. Los de bicliques optimizan esa idea.»</p>
        <p class="script">«La ganancia existe, pero es pequeña: en IDEA completo, un factor de cuatro sobre 2 a la 128.»</p>`,
    },

    /* 4.6 Ventajas y desventajas */
    {
      id: 'b4-pros-contras', person: P, title: 'Ventajas y desventajas técnicas', minutes: 0.8,
      refs: ['lai-massey-1990', 'sweet32-2016', 'dgv-1994'],
      html: String.raw`
        <div class="grid-2 proscons">
          <div class="card pros"><h3>Ventajas</h3><ul class="clean">
            <li>Más de 30 años de análisis público sin ataques prácticos contra las 8,5 rondas.</li>
            <li>Diseño compacto: sin tablas de sustitución, poca memoria.</li>
            <li>Operaciones naturales de 16 bits, eficientes en software y en hardware.</li>
            <li>Cifrar y descifrar usan el mismo circuito.</li>
            <li>Clave de 128 bits: búsqueda exhaustiva inviable.</li>
          </ul></div>
          <div class="card cons"><h3>Desventajas</h3><ul class="clean">
            <li><strong>Bloque de 64 bits:</strong> colisiones por cumpleaños con grandes volúmenes de datos.</li>
            <li>Planificación de claves lineal: clases de claves débiles y ataques de encuentro a medio camino.</li>
            <li>La multiplicación mód \(2^{16}+1\) es costosa y difícil de implementar en tiempo constante.</li>
            <li>Sin aceleración por hardware ni soporte en estándares actuales.</li>
            <li>Las patentes frenaron su adopción.</li>
          </ul></div>
        </div>`,
      notes: String.raw`
        <p class="script">«Haciendo balance. A favor: más de treinta años de análisis sin un ataque práctico, un diseño compacto sin tablas, operaciones simples de 16 bits y el mismo circuito para cifrar y descifrar.»</p>
        <p class="script">«En contra: el bloque de 64 bits, hoy demasiado pequeño para grandes volúmenes de datos; una planificación de claves que solo selecciona bits, la causa de las claves débiles y de los ataques de encuentro a medio camino; una multiplicación costosa y delicada de implementar sin filtrar tiempos; y, como veremos, las patentes.»</p>`,
    },

    /* 4.7 Patentes y transición a AES */
    {
      id: 'b4-patentes', person: P, title: 'Patentes, licencias y la transición hacia AES', minutes: 0.8,
      refs: ['us5214703', 'ep0482154', 'gnupg-2012', 'aes-report-2001', 'fips197', 'rfc4880', 'rfc9580'],
      html: String.raw`
        <div class="lanes">
          <div class="lane"><div class="lane-h">Patentes de IDEA</div>
            <div class="ev"><b>1990</b>Solicitud suiza</div>
            <div class="ev"><b>1993</b>Patente US 5,214,703</div>
            <div class="ev"><b>1994</b>Patente europea EP 0 482 154</div>
            <div class="ev mid">Uso no comercial gratuito; el uso comercial requería licencia</div>
            <div class="ev"><b>2011</b>Expiran EP y JP</div>
            <div class="ev"><b>2012</b>Expira la de EE. UU. · GnuPG incorpora IDEA</div>
          </div>
          <div class="lane std"><div class="lane-h">Estándares</div>
            <div class="ev"><b>1997</b>El NIST convoca un concurso abierto, libre de regalías</div>
            <div class="ev"><b>2000</b>Gana Rijndael (Daemen y Rijmen)</div>
            <div class="ev"><b>2001</b>FIPS 197: AES, bloque de 128 bits</div>
            <div class="ev"><b>2005</b>El NIST retira DES (FIPS 46-3)</div>
            <div class="ev"><b>2024</b>RFC 9580 (OpenPGP): IDEA «MUST NOT be generated»</div>
          </div>
        </div>`,
      notes: String.raw`
        <p class="script">«IDEA estuvo patentado. La solicitud original es suiza, de 1990; la patente estadounidense se concedió en 1993 y la europea en 1994. El uso no comercial era gratuito, pero el comercial requería una licencia. Eso frenó su adopción: el software libre, como GnuPG, no lo incluyó durante años.»</p>
        <p class="script">«Mientras tanto, en 1997 el NIST convocó un concurso abierto para sustituir a DES, con la condición de que el ganador fuera libre de regalías. En 2000 ganó Rijndael y en 2001 se publicó como AES, con bloques de 128 bits. Las patentes de IDEA expiraron en 2011 y 2012, y entonces GnuPG lo incorporó, pero para entonces AES ya era el estándar. En 2024, la especificación actual de OpenPGP prohíbe generar mensajes nuevos con IDEA y solo permite leerlos por compatibilidad.»</p>
        <ul><li>En OpenPGP, el RFC 4880 (2007) ya dejaba IDEA como algoritmo opcional, solo para compatibilidad con PGP 2.x.</li>
        <li>Fechas exactas: EP y JP expiraron el 16-05-2011; US el 07-01-2012; GnuPG 1.4.13 se publicó el 21-12-2012.</li></ul>`,
    },

    /* 4.8 Comparación IDEA / DES / AES */
    {
      id: 'b4-comparacion', person: P, title: 'DES, IDEA y AES: comparación conceptual', minutes: 0.8,
      refs: ['fips46', 'fips197', 'bkr-2011', 'klr-2012'],
      html: String.raw`<div class="cmp-slot"></div>`,
      mount: (root) => W.CompareViz(root.querySelector('.cmp-slot')),
      notes: String.raw`
        <p class="script">«Comparemos los tres. En tamaños: DES e IDEA comparten el bloque de 64 bits, pero IDEA tiene una clave de 128 bits frente a los 56 de DES. AES duplica el bloque a 128 bits y admite claves de hasta 256.»</p>
        <p class="script">«En diseño, cada uno representa una escuela: la red de Feistel de DES, la mezcla de grupos de Lai y Massey en IDEA y la red de sustitución-permutación de AES.»</p>
        <p class="script">«Y en seguridad hoy: DES está roto en la práctica por su clave corta. IDEA y AES tienen ataques teóricos de un coste parecido, alrededor de 2 a la 126, sin impacto práctico. La diferencia real está en el bloque de 64 bits y en el soporte de los estándares.»</p>
        <ul><li>Recorrer las pestañas con un clic o con <b>.</b>.</li></ul>`,
    },

    /* 4.9 Relevancia actual y conclusión */
    {
      id: 'b4-cierre', person: P, type: 'handoff', title: '¿Es relevante IDEA hoy?', minutes: 0.6,
      nextLabel: 'Preguntas',
      teaser: 'Gracias. En la siguiente diapositiva está la bibliografía completa.',
      refs: ['klr-2012', 'rfc9580', 'sweet32-2016'],
      html: String.raw`
        <ul class="clean">
          <li><strong>No está roto:</strong> el mejor ataque contra IDEA completo (≈ \(2^{126}\)) sigue siendo inviable.</li>
          <li><strong>No se recomienda para sistemas nuevos:</strong> su bloque de 64 bits y los estándares actuales favorecen AES.</li>
          <li><strong>Sigue siendo valioso:</strong> para leer datos heredados (PGP 2.x), como caso de estudio de mezcla de grupos algebraicos y como base de diseños posteriores.</li>
        </ul>`,
      notes: String.raw`
        <p class="script">«Para cerrar: IDEA no está roto. Más de treinta años después, ningún ataque contra la versión completa es practicable. Pero no lo usaríamos en un sistema nuevo, y no porque sea viejo: su bloque de 64 bits es pequeño para los volúmenes de datos actuales y los estándares han adoptado AES, con mejor soporte y aceleración por hardware.»</p>
        <p class="script">«Su valor hoy es triple: leer datos antiguos cifrados con PGP, servir como caso de estudio de un diseño original basado en la mezcla de grupos algebraicos, e inspirar diseños posteriores de sus propios autores y de otros. Muchas gracias; quedamos atentos a sus preguntas.»</p>
        <ul><li>Si preguntan por sucesores: la empresa MediaCrypt publicó en 2005 IDEA NXT (antes llamado FOX).</li></ul>`,
    },
  );
})();
