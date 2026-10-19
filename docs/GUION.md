# Guion y distribución de tiempos

> Archivo generado con `node tools/export-guion.js` a partir de `js/slides/*.js`. No editar a mano.

**37 diapositivas · 33,5 min previstos** (sin preguntas). Objetivo: 30–40 min, ≈ 8 min por bloque.

| Bloque | Diapositivas | Minutos |
|---|--:|--:|
| Portada y cierre (compartidas) | 2 | 1,0 |
| Bloque 1 · Contexto y fundamentos | 9 | 8,2 |
| Bloque 2 · Arquitectura y cifrado | 8 | 8,1 |
| Bloque 3 · Ejemplo práctico y descifrado | 8 | 8,3 |
| Bloque 4 · Criptoanálisis y seguridad | 10 | 7,9 |
| **Total** | **37** | **33,5** |

## Mapa de diapositivas

| # | Diapositiva | Bloque | Min | Acumulado | Interactiva |
|--:|---|---|--:|--:|:-:|
| 1 | Portada | — | 0,5 | 0,5 | ● |
| 2 | Contexto y fundamentos | 1 | 0,3 | 0,8 |  |
| 3 | ¿Qué es IDEA? | 1 | 0,8 | 1,6 |  |
| 4 | Contexto histórico: ETH Zúrich, 1990–1992 | 1 | 1,2 | 2,8 | ● |
| 5 | El problema: las limitaciones de DES | 1 | 1,1 | 3,9 |  |
| 6 | Aplicación histórica: IDEA en PGP | 1 | 0,9 | 4,8 |  |
| 7 | Fundamentos: tres grupos sobre palabras de 16 bits | 1 | 1,1 | 5,9 |  |
| 8 | Laboratorio: las tres operaciones | 1 | 1,4 | 7,3 | ● |
| 9 | ¿Por qué mezclar operaciones incompatibles? | 1 | 1,0 | 8,3 | ● |
| 10 | Conclusión del bloque 1 | 1 | 0,4 | 8,7 |  |
| 11 | Arquitectura y cifrado | 2 | 0,3 | 9,0 |  |
| 12 | Estructura general | 2 | 1,3 | 10,3 | ● |
| 13 | 52 subclaves por rotaciones de 25 bits | 2 | 1,4 | 11,7 | ● |
| 14 | Organización de una ronda | 2 | 1,2 | 12,9 | ● |
| 15 | La caja de multiplicación-adición (MA) | 2 | 0,9 | 13,8 | ● |
| 16 | Cifrado ronda por ronda | 2 | 1,9 | 15,7 | ● |
| 17 | Del texto en claro al texto cifrado | 2 | 0,7 | 16,4 | ● |
| 18 | Conclusión del bloque 2 | 2 | 0,4 | 16,8 |  |
| 19 | Ejemplo práctico y descifrado | 3 | 0,3 | 17,1 |  |
| 20 | Datos del ejemplo y preparación | 3 | 1,0 | 18,1 | ● |
| 21 | Ronda 1, operación por operación | 3 | 1,6 | 19,7 | ● |
| 22 | Rondas 2 a 8 y transformación final | 3 | 0,9 | 20,6 | ● |
| 23 | Descifrar: el mismo circuito, otras subclaves | 3 | 1,0 | 21,6 |  |
| 24 | Inversión y reordenamiento de las subclaves | 3 | 1,3 | 22,9 | ● |
| 25 | Laboratorio de cifrado y descifrado | 3 | 1,8 | 24,7 | ● |
| 26 | Conclusión del bloque 3 | 3 | 0,4 | 25,1 |  |
| 27 | Criptoanálisis y seguridad | 4 | 0,3 | 25,4 |  |
| 28 | Espacio de claves: 2¹²⁸ | 4 | 0,9 | 26,3 | ● |
| 29 | Seguridad teórica y seguridad práctica | 4 | 0,8 | 27,1 | ● |
| 30 | Claves débiles | 4 | 0,9 | 28,0 | ● |
| 31 | Ataques publicados: rondas reducidas e IDEA completo | 4 | 1,2 | 29,2 | ● |
| 32 | Fuerza bruta frente a ataques que explotan la estructura | 4 | 0,8 | 30,0 | ● |
| 33 | Ventajas y desventajas técnicas | 4 | 0,8 | 30,8 |  |
| 34 | Patentes, licencias y la transición hacia AES | 4 | 0,8 | 31,6 |  |
| 35 | DES, IDEA y AES: comparación conceptual | 4 | 0,8 | 32,4 | ● |
| 36 | ¿Es relevante IDEA hoy? | 4 | 0,6 | 33,0 |  |
| 37 | Preguntas · Bibliografía | — | 0,5 | 33,5 | ● |

## Bloque 1 · Contexto y fundamentos (8,2 min)

### 2. Contexto y fundamentos · 0,3 min

> «Mi parte responde a tres preguntas: qué es IDEA, por qué se creó y en qué matemáticas se apoya. Mis compañeros explicarán después cómo se organiza el algoritmo, un ejemplo completo y su seguridad.»

### 3. ¿Qué es IDEA? · 0,8 min · fuentes [1] [4]

> «IDEA es un cifrador simétrico por bloques: emisor y receptor comparten una misma clave secreta, y el algoritmo transforma bloques de tamaño fijo. Lo propusieron Xuejia Lai y James Massey como alternativa a DES.»

> «Lo que lo hace especial no es su tamaño ni su velocidad, sino su principio de diseño. DES usa tablas de sustitución, las cajas S. IDEA, en cambio, consigue la no linealidad mezclando tres operaciones aritméticas que pertenecen a grupos algebraicos distintos. Esa idea guía toda la presentación.»

- No dar aquí el tamaño de bloque ni de clave: lo presenta el bloque 2.

- Si preguntan por el nombre: IDEA = *International Data Encryption Algorithm*.

### 4. Contexto histórico: ETH Zúrich, 1990–1992 · 1,2 min · fuentes [1] [2] [3]

> «IDEA nace en el ETH de Zúrich, en el grupo de James Massey. Su doctorando Xuejia Lai y él presentaron en EUROCRYPT 1990 un primer diseño llamado PES, *Proposed Encryption Standard*.»

> «Ese mismo año, Biham y Shamir presentaron el criptoanálisis diferencial, una técnica nueva que obligó a revisar muchos diseños. En 1991, Lai, Massey y Murphy estudiaron esa amenaza con la teoría de los cifradores de Markov y reforzaron PES. El resultado se llamó IPES, *Improved* PES. En 1992 la tesis doctoral de Lai lo presenta ya como IDEA, junto con el vector de prueba que usará mi compañero en el bloque 3.»

- El diseño se hizo con un contrato de investigación de la Fundación Hasler, luego integrada en Ascom-Tech AG. Las patentes las cuenta el bloque 4.

- Recorrer con **.** (siguiente hito) sin cambiar de diapositiva.

### 5. El problema: las limitaciones de DES · 1,1 min · fuentes [6] [7] [8]

> «¿Por qué hacía falta una alternativa? DES, estandarizado en 1977, tenía tres problemas. El primero, una clave efectiva de solo 56 bits. Hoy eso se recorre por fuerza bruta: en 1998 la Electronic Frontier Foundation construyó, por unos 250 000 dólares, una máquina que encontraba una clave en días.»

> «El segundo: DES se diseñó para hardware. Sus permutaciones de bits son muy rápidas en un chip, pero costosas en un programa. El tercero: en 1990 apareció el criptoanálisis diferencial y los diseñadores ya no podían ignorar los ataques estadísticos. Además, los criterios con los que se eligieron las cajas S de DES no se habían publicado.»

> «IDEA se propuso resolver los tres: una clave mucho más larga, operaciones naturales para un procesador de 16 bits y un diseño justificado frente al ataque diferencial.»

- No dar todavía los 128 bits de IDEA: decir solo «mucho más larga». La cifra la da el bloque 2.

### 6. Aplicación histórica: IDEA en PGP · 0,9 min · fuentes [9] [10]

> «IDEA se hizo famoso gracias a PGP, *Pretty Good Privacy*, el programa de Phil Zimmermann para cifrar correo. La primera versión, de 1991, usaba un cifrador inventado por el propio Zimmermann, BassOmatic. Eli Biham le mostró que era débil. En PGP 2.0, de 1992, Zimmermann lo cambió por IDEA.»

> «PGP usa un esquema híbrido. Para cada mensaje genera una clave de sesión aleatoria y cifra el texto con IDEA, que es rápido. Después cifra solo esa clave con RSA, usando la clave pública del destinatario. Así IDEA pasó a proteger el correo de usuarios de todo el mundo durante los años noventa.»

- Las licencias y patentes de IDEA, que influyeron en la evolución de PGP, las trata el bloque 4.

### 7. Fundamentos: tres grupos sobre palabras de 16 bits · 1,1 min · fuentes [1] [4]

> «IDEA trabaja siempre con palabras de 16 bits y solo usa tres operaciones, cada una de un grupo algebraico distinto.»

> «La primera es el XOR: sumamos bit a bit módulo 2, sin acarreos. La segunda es la suma de enteros módulo 2 a la 16: sumamos normalmente y descartamos el acarreo que se sale de los 16 bits. La tercera es la más original: la multiplicación módulo 2 a la 16 más 1, es decir, módulo 65 537.»

> «¿Por qué 65 537? Porque es primo. Entonces los números del 1 al 65 536 forman un grupo con la multiplicación y todos tienen inverso. Son exactamente 2 a la 16 valores, tantos como palabras de 16 bits. El único problema es que 65 536 no cabe en 16 bits. La solución es reinterpretar la palabra 0000 como 2 a la 16. Este es el “tratamiento especial del cero”.»

- Dato útil: $2^{16} \equiv -1 \pmod{65537}$, así que multiplicar por la palabra 0 equivale a cambiar de signo.

- No entrar en cómo se usan los inversos para descifrar: es tema de el bloque 3.

### 8. Laboratorio: las tres operaciones · 1,4 min · fuentes [3]

> «Veamos las tres operaciones con los mismos dos números. Arriba están a y b en hexadecimal y en binario. Puedo cambiar cualquier bit con un clic.»

> «El XOR, en cian, marca los bits en que a y b difieren. La suma, en verde, propaga acarreos: con el ejemplo “con acarreo”, el resultado pasa de 65 536 y se descarta el 2 a la 16. La multiplicación, en violeta, se calcula módulo 65 537.»

> «Ahora el caso especial: con a = 0, la palabra cero se interpreta como 65 536. Por ejemplo, 0 ⊙ 3 da 65 536 · 3 módulo 65 537, que es 65 534, FFFE. Y con b = 1, la multiplicación deja a sin cambios: 1 es el neutro.»

- Secuencia recomendada: Ejemplo → Con acarreo → a = 0 → b = 1.

- Mensaje clave: con las mismas entradas, cada operación da un resultado muy distinto.

### 9. ¿Por qué mezclar operaciones incompatibles? · 1,0 min · fuentes [1]

> «¿Por qué mezclar tres operaciones distintas? Porque son incompatibles: entre ellas no hay distributividad ni asociatividad. Este laboratorio lo comprueba con números reales.»

> «Con una terna concreta vemos que a ⊙ (b ⊞ c) no es igual a (a ⊙ b) ⊞ (a ⊙ c). Si pruebo 100 000 ternas al azar, la igualdad casi nunca se cumple. Lo mismo pasa con la suma y el XOR.»

> «Esto importa por lo siguiente. Si las operaciones se combinaran de forma regular, un atacante podría reescribir el cifrador como un sistema de ecuaciones sencillo y resolverlo. Al alternar grupos distintos, cada operación es no lineal desde el punto de vista de las otras dos. Es la “confusión” de Shannon, conseguida sin cajas S: solo con aritmética que un procesador de 16 bits ejecuta muy rápido.»

- Detalle por si preguntan: ⊕ y ⊞ coinciden en el bit menos significativo (allí no hay acarreo de entrada); la diferencia aparece por la propagación de acarreos.

### 10. Conclusión del bloque 1 · 0,4 min

> «En resumen: IDEA nació en Zúrich como alternativa a DES, se difundió con PGP y su seguridad se apoya en mezclar tres grupos algebraicos incompatibles. Ahora mi compañero explicará cómo se organizan estas operaciones dentro del algoritmo.»

- Pasar la palabra sin adelantar rondas ni subclaves.

## Bloque 2 · Arquitectura y cifrado (8,1 min)

### 11. Arquitectura y cifrado · 0,3 min

> «Ya conocemos las tres operaciones. En mi parte veremos cómo se organizan: tamaños, subclaves, rondas y la caja MA, y cómo un bloque de texto en claro se convierte en texto cifrado.»

### 12. Estructura general · 1,3 min · fuentes [3] [4]

> «Cuatro números resumen IDEA. Cifra bloques de 64 bits con una clave de 128 bits. De esa clave se derivan 52 subclaves de 16 bits. El bloque atraviesa 8 rondas idénticas y una media ronda final, la transformación de salida. Por eso se habla de “8,5 rondas”.»

> «El primer paso es dividir el bloque de 64 bits en cuatro palabras de 16 bits, X1, X2, X3 y X4. Aquí uso como ejemplo el texto ASCII “IDEA1991”: al dividirlo, cada palabra contiene dos caracteres. A partir de ahora, todas las operaciones trabajan con estas palabras de 16 bits.»

- Pulsar «Dividir en 4 palabras» (o la tecla **.**).

- Fíjate en el diagrama de la derecha: cada ronda usa 6 subclaves y la media ronda final usa 4. 8 × 6 + 4 = 52.

### 13. 52 subclaves por rotaciones de 25 bits · 1,4 min · fuentes [3] [4]

> «¿De dónde salen las 52 subclaves? El procedimiento es sencillo. La clave de 128 bits se parte en 8 palabras de 16 bits: esas son Z1 a Z8. Después se rota la clave completa 25 bits a la izquierda, de forma cíclica, y se vuelve a partir en 8 palabras: Z9 a Z16. Y así sucesivamente.»

> «Cada celda conserva el color de su posición original en la clave, así que al pulsar “Rotar 25 bits” se ve el desplazamiento del patrón. Tras 6 rotaciones hay 56 palabras; solo se necesitan 52, así que las 4 últimas se descartan.»

> «En la tabla de la derecha se ve qué subclave corresponde a cada ronda: seis por ronda, en este orden: multiplicación, suma, suma, multiplicación y dos multiplicaciones para la caja MA. La fila de salida solo usa cuatro.»

- La clave de ejemplo es el texto ASCII «XuejiaLai&Massey».

- Una observación sin desarrollarla: la planificación solo selecciona bits, no los mezcla. Sus consecuencias de seguridad las analiza el bloque 4.

### 14. Organización de una ronda · 1,2 min · fuentes [1] [5]

> «Esta es una ronda completa. Usa seis subclaves y catorce operaciones, en cuatro fases. Los colores son los de las operaciones: violeta para ⊙, verde para ⊞ y cian para ⊕.»

> «Primero, la capa de subclaves: cada palabra se combina con una subclave, multiplicando las de los extremos y sumando las centrales. Segundo, se calculan dos valores con XOR, p y q, que entran en la caja MA. Tercero, la caja MA produce dos salidas, t y u. Cuarto, t y u se combinan con XOR con las cuatro palabras. Por último, las dos palabras centrales se cruzan antes de la siguiente ronda.»

> «Importante: en la octava ronda no hay cruce. Veremos que eso deja todo preparado para la transformación de salida.»

- Avanzar paso a paso con el botón o con **.**; los nodos con borde punteado son los operandos del paso activo.

### 15. La caja de multiplicación-adición (MA) · 0,9 min · fuentes [1]

> «El corazón de cada ronda es la caja MA, de multiplicación-adición. Recibe p y q, los dos XOR de la fase anterior, y las subclaves Z5 y Z6. Calcula s = p ⊙ Z5; t = (q ⊞ s) ⊙ Z6; y u = s ⊞ t.»

> «¿Por qué esta forma? Porque, alternando multiplicaciones y sumas, cada bit de salida depende de todos los bits de entrada y de las dos subclaves. A eso se le llama difusión completa. Según sus autores, es la estructura más pequeña, de solo cuatro operaciones, que la consigue.»

> «Después, t se combina con XOR con las palabras 1 y 3, y u con las palabras 2 y 4. Así el efecto de la caja MA llega a todo el bloque.»

- No adelantar por qué esta estructura facilita el descifrado: lo explica el bloque 3.

### 16. Cifrado ronda por ronda · 1,9 min · fuentes [3]

> «Ahora vemos el algoritmo completo en marcha. Arriba están el bloque y la clave de mi ejemplo; puedo cambiarlos o generarlos al azar. A la izquierda están las rondas: R1 a R8 y la media ronda final, marcada aparte. En el centro, el diagrama con los valores reales. A la derecha, la operación activa y las subclaves de la ronda.»

> «Avanzo paso a paso por la primera ronda. Cada operación muestra sus operandos y su resultado, y se resalta la subclave que usa. Al terminar la ronda, los bloques centrales se cruzan y la salida entra en la ronda 2.»

> «Con “Ronda ⏭” salto a la octava: no hay cruce. Después, la transformación de salida solo hace cuatro operaciones con Z49 a Z52, sin caja MA. Su resultado es el bloque cifrado.»

- Guion de clics: Paso ▶ ×4 (capa de subclaves) → Ronda ⏭ hasta R8 → Ronda ⏭ (½) → Paso ▶ hasta el final.

- «⟲ Reiniciar» vuelve al principio. «▷ Auto» reproduce sola la animación.

- El ejemplo numérico «oficial» y su verificación los presenta el bloque 3; aquí no se detallan.

### 17. Del texto en claro al texto cifrado · 0,7 min · fuentes [1]

> «Esta tabla resume el recorrido del bloque: el texto en claro, el estado tras cada ronda y el texto cifrado.»

> «Si invierto un solo bit del texto en claro, la diferencia se propaga. Después de la primera ronda ya cambian varias palabras, y en pocas rondas la mitad de los 64 bits ha cambiado, que es lo esperable en un buen cifrador. Esto es la caja MA y la mezcla de operaciones en acción.»

- Pulsar «Invertir 1 bit» varias veces: cada pulsación prueba otro bit (secuencia fija, repetible).

### 18. Conclusión del bloque 2 · 0,4 min

> «Recapitulando: 64 bits de bloque, 128 de clave, 52 subclaves y 8 rondas y media, con la caja MA como núcleo de cada ronda. Mi compañero ahora hará el cálculo completo con un ejemplo publicado y explicará cómo se descifra.»

## Bloque 3 · Ejemplo práctico y descifrado (8,3 min)

### 19. Ejemplo práctico y descifrado · 0,3 min

> «Mi compañero mostró cómo está construido IDEA. Yo voy a hacer el cálculo completo con un ejemplo publicado, para que cualquiera pueda comprobar los números, y después explicaré cómo se descifra.»

### 20. Datos del ejemplo y preparación · 1,0 min · fuentes [3] [5]

> «Elegimos un ejemplo verificable: el vector de prueba que publicó Xuejia Lai en su tesis de 1992. La clave son las palabras 1 a 8 y el texto en claro, las palabras 0 a 3. Según la publicación, el resultado debe ser 11FB ED2B 0198 6DE5.»

> «La preparación tiene dos partes. Primero se divide el bloque: X1 = 0000, X2 = 0001, X3 = 0002, X4 = 0003. Después se generan las 52 subclaves con el método que explicó mi compañero. Las de la ronda 1, resaltadas, son las propias palabras de la clave: 0001 a 0006. Las demás salen de las rotaciones; por ejemplo, la ronda 2 empieza con 0007 y 0008 y sigue con 0400, 0600, etc.»

- Este ejemplo es real, con tamaños completos; no es una versión reducida.

- Las subclaves de la tabla se calculan al cargar la diapositiva; no están escritas a mano.

### 21. Ronda 1, operación por operación · 1,6 min · fuentes [3]

> «Hagamos la primera ronda a mano. Paso 1: X1 ⊙ Z1 = 0000 ⊙ 0001. Aquí aparece el cero: la palabra 0000 vale 65 536, y 65 536 · 1 = 65 536, que vuelve a escribirse como 0000. Paso 2: 0001 ⊞ 0002 = 0003. Paso 3: 0002 ⊞ 0003 = 0005. Paso 4: 0003 ⊙ 0004 = 12, es decir, 000C.»

> «Pasos 5 y 6, entradas de la caja MA: 0000 ⊕ 0005 = 0005, y 0003 ⊕ 000C = 000F. Caja MA: 0005 ⊙ 0005 = 0019; 000F ⊞ 0019 = 0028; 0028 ⊙ 0006 = 00F0; y 0019 ⊞ 00F0 = 0109.»

> «Por último, la mezcla: 0000 ⊕ 00F0 = 00F0, 0005 ⊕ 00F0 = 00F5, 0003 ⊕ 0109 = 010A y 000C ⊕ 0109 = 0105. La salida de la ronda 1 es 00F0 00F5 010A 0105. La comprobación definitiva llegará al final: si el texto cifrado coincide con el publicado, toda la cadena de operaciones es correcta.»

- Usar «Paso ▶» o la tecla **.**. Detenerse en el paso 1 (cero) y en el 9 (caja MA).

### 22. Rondas 2 a 8 y transformación final · 0,9 min · fuentes [3]

> «Las rondas 2 a 8 repiten exactamente las mismas 14 operaciones, cada una con sus seis subclaves. La tabla muestra el estado del bloque al final de cada ronda.»

> «Tras la ronda 8, que no cruza los bloques centrales, viene la transformación de salida: X1 ⊙ Z49, X2 ⊞ Z50, X3 ⊞ Z51 y X4 ⊙ Z52. El resultado es 11FB ED2B 0198 6DE5. Coincide con el valor publicado, así que podemos afirmar que nuestra implementación reproduce el vector de prueba.»

- Además del vector de Lai, la implementación se validó con 100 vectores independientes generados con OpenSSL (ver README).

### 23. Descifrar: el mismo circuito, otras subclaves · 1,0 min · fuentes [1] [4]

> «¿Cómo se descifra? Una de las ventajas de IDEA es que se usa exactamente el mismo algoritmo y solo cambian las subclaves.»

> «Hay que deshacer dos cosas. La primera, las operaciones con subclave. Si se multiplicó por Z49, ahora se multiplica por su inverso módulo 65 537. Si se sumó Z50, ahora se suma su opuesto módulo 2 a la 16. Por eso usamos inversos multiplicativos y aditivos.»

> «La segunda, la caja MA. Aquí hay un detalle elegante. La caja recibe p, el XOR de las palabras 1 y 3, y q, el XOR de las palabras 2 y 4. Después de la mezcla, ambas palabras quedan combinadas con el mismo t, y al hacer de nuevo su XOR, t se cancela. Es decir, p y q se pueden recalcular a partir de la salida, la caja MA produce los mismos t y u, y un segundo XOR los elimina. La mezcla es su propia inversa: una involución. Por eso Z5 y Z6 se reutilizan sin invertir.»

### 24. Inversión y reordenamiento de las subclaves · 1,3 min · fuentes [4] [3]

> «Esta es la receta general. La ronda r de descifrado usa las subclaves de la ronda espejo del cifrado, la 10 − r, en orden inverso. Las multiplicativas se invierten módulo 65 537 y las aditivas se cambian de signo módulo 2 a la 16. Las de la caja MA se copian tal cual, porque la caja no se invierte, como acabamos de ver.»

> «Un detalle: en las rondas intermedias las subclaves aditivas U2 y U3 se intercambian. Es para compensar el cruce de los bloques centrales. En la primera y en la última no se intercambian, porque allí no hay cruce.»

> «Con nuestra clave: la primera subclave de descifrado es el inverso de Z49 = 0080. La tabla da FE01, y la comprobación 0080 ⊙ FE01 = 0001 confirma que es su inverso. Y la segunda es −Z50: 0000 menos 00C0, FF40.»

- Recorrer R1 → R2 → ½ con los botones (o con **.**) para mostrar el intercambio y la copia de Z5/Z6.

- Inverso del cero: 0000 representa 2¹⁶ ≡ −1, y (−1)(−1) = 1, así que 0⁻¹ = 0.

### 25. Laboratorio de cifrado y descifrado · 1,8 min · fuentes [3]

> «Para terminar, el laboratorio. Arriba se escriben la clave de 128 bits y el bloque de 64 bits en hexadecimal, o se elige un ejemplo. Dejo el vector de Lai.»

> «Avanzo paso a paso: a la izquierda, el estado del bloque tras cada ronda; en el centro, las 14 operaciones de la ronda actual con sus operandos; a la derecha, las subclaves. Con “Ejecutar todo” llego al final: 11FB ED2B 0198 6DE5, y el laboratorio confirma que coincide con el valor publicado.»

> «Ahora pulso “Descifrar el resultado”. El modo cambia a descifrado y las subclaves son ahora U: cada una indica de qué Z procede, si se invierte o si cambia de signo. Al ejecutar todo recuperamos 0000 0001 0002 0003, igual que el original.»

- Si sobra tiempo: elegir «Aleatorio» y repetir la ida y vuelta para mostrar que funciona con cualquier clave.

- «⟲ Reiniciar» vuelve al cifrado con los datos actuales.

### 26. Conclusión del bloque 3 · 0,4 min

> «Hemos comprobado con números reales que el cifrado da el resultado publicado y que el descifrado recupera el original. La pregunta que queda es si es seguro. Eso lo responde mi compañero.»

## Bloque 4 · Criptoanálisis y seguridad (7,9 min)

### 27. Criptoanálisis y seguridad · 0,3 min

> «Ya sabemos cómo funciona IDEA y que nuestra implementación es correcta. Mi parte responde a la pregunta natural: ¿es seguro? La respuesta tiene matices, y conviene separar el algoritmo de cómo se usa.»

### 28. Espacio de claves: 2¹²⁸ · 0,9 min · fuentes [8] [19]

> «Empecemos por el ataque más simple: probar todas las claves. IDEA tiene 2 elevado a 128 claves, unos 3,4 por 10 a la 38.»

> «Con estos controles supongo un atacante muy poderoso: un billón de claves por segundo en cada equipo y un millón de equipos. DES cae en menos de un minuto. IDEA requeriría del orden de 10 a la 13 años, cientos de veces la edad del universo. Si subo los dos controles al máximo, mil billones de claves por segundo en mil millones de equipos, algo muy lejos de cualquier tecnología actual, aún harían falta unos diez millones de años.»

> «La tercera barra es el mejor ataque publicado contra IDEA completo. Reduce el trabajo a unas 2 a la 126 operaciones: es cuatro veces menos, pero sigue siendo igual de inalcanzable.»

- Mover los deslizadores en directo. Con los valores por defecto: 10¹² claves/s × 10⁶ equipos.

### 29. Seguridad teórica y seguridad práctica · 0,8 min · fuentes [21] [19]

> «Hay que distinguir capas. La seguridad teórica del algoritmo pregunta si existe un ataque mejor que la fuerza bruta. La seguridad práctica pregunta si un sistema real que usa IDEA está protegido.»

> «En el diseño, IDEA completo no tiene ataques prácticos. Pero un sistema puede fallar por otras razones: una implementación que filtre información por tiempos, el modo de operación o una mala gestión de claves. En IDEA destaca el bloque de 64 bits: tras unos 2 a la 32 bloques cifrados con la misma clave, unos 32 GiB, aparecen colisiones por la paradoja del cumpleaños. Eso se explotó en 2016 contra 3DES y Blowfish con el ataque Sweet32. No es un fallo de IDEA en sí, sino de cualquier cifrador de bloque de 64 bits mal usado.»

- Recorrer las cinco capas con un clic o con **.**.

### 30. Claves débiles · 0,9 min · fuentes [11] [12] [13] [14]

> «Una debilidad conocida son las claves débiles. Como la planificación solo copia bits de la clave, una clave con muchos ceros produce subclaves 0000 o 0001. Multiplicar por 1 no hace nada, y multiplicar por 0000, que vale −1, solo cambia el signo. Así ⊙ pierde su no linealidad.»

> «Aquí lo vemos: con una clave aleatoria, ninguna de las 34 subclaves multiplicativas es trivial. Con una clave casi toda a cero, casi todas lo son. En 1993, Daemen, Govaerts y Vandewalle encontraron 2 a la 51 claves débiles; después se encontraron clases mayores, de hasta 2 a la 64.»

> «¿Es grave? Si la clave se genera al azar, la probabilidad de caer en una de esas clases es como mucho de 1 entre 2 a la 64. Es despreciable. Aun así, muestra un punto débil de la planificación de claves, y se propuso corregirlo combinando las subclaves con una constante.»

- Los botones solo ilustran el mecanismo: no afirman que una clave pertenezca a una clase concreta publicada.

### 31. Ataques publicados: rondas reducidas e IDEA completo · 1,2 min · fuentes [15] [16] [17] [18] [19]

> «Esta gráfica resume tres décadas de criptoanálisis. En la vista “¿Cuántas rondas?”, cada barra indica hasta qué ronda llega un ataque; la línea final marca las 8,5 rondas reales. Durante años, los mejores ataques solo alcanzaban versiones recortadas: 4,5 rondas en 1999, 5 en 2006 y 6 en 2009 y 2011.»

> «En 2011–2012 aparecieron los primeros ataques contra IDEA completo: el de Biham, Dunkelman, Keller y Shamir, y el de bicliques de Khovratovich, Leurent y Rechberger. Pero ahora miremos “¿Cuánto cuesta?”: 2 a la 126,06 frente a 2 a la 128. Es un ataque formalmente mejor que la fuerza bruta, pero sigue completamente fuera de alcance, y además necesita 2 a la 52 textos elegidos.»

> «Entonces, ¿qué significa “romper” IDEA? Que su margen de seguridad teórico se ha reducido un poco. No que alguien pueda descifrar un mensaje real. Para comparar: un ataque similar contra AES-128 cuesta 2 a la 126,1, y nadie considera roto AES.»

- Cifras tomadas de las fuentes de la bibliografía. El ataque de 1999 se muestra sin coste porque no se verificaron sus cifras exactas.

- **.** cambia a la vista de coste; luego recorre los ataques.

### 32. Fuerza bruta frente a ataques que explotan la estructura · 0,8 min · fuentes [18] [19]

> «¿Cómo pueden ser mejores que la fuerza bruta? La fuerza bruta no usa ningún conocimiento del algoritmo. Los ataques estructurales sí: aprovechan propiedades matemáticas.»

> «En IDEA la propiedad clave es la planificación de claves: cada subclave es una copia literal de 16 bits de la clave. Esta cuadrícula muestra los 128 bits de la clave y, en amarillo, los que usa la ronda seleccionada. Cada ronda completa depende de 96 bits; la transformación de salida, de solo 64; y la ronda 8 junto con la salida, de 103. Quien adivine esos bits puede calcular esa parte del cifrado sin conocer el resto. Con dos rondas completas ya se usan los 128 bits, y por eso los ataques trabajan con fragmentos de ronda y con los bits que comparten. Los ataques de encuentro a medio camino calculan desde el texto en claro y desde el cifrado y comparan en el centro. Los de bicliques optimizan esa idea.»

> «La ganancia existe, pero es pequeña: en IDEA completo, un factor de cuatro sobre 2 a la 128.»

### 33. Ventajas y desventajas técnicas · 0,8 min · fuentes [1] [21] [11]

> «Haciendo balance. A favor: más de treinta años de análisis sin un ataque práctico, un diseño compacto sin tablas, operaciones simples de 16 bits y el mismo circuito para cifrar y descifrar.»

> «En contra: el bloque de 64 bits, hoy demasiado pequeño para grandes volúmenes de datos; una planificación de claves que solo selecciona bits, la causa de las claves débiles y de los ataques de encuentro a medio camino; una multiplicación costosa y delicada de implementar sin filtrar tiempos; y, como veremos, las patentes.»

### 34. Patentes, licencias y la transición hacia AES · 0,8 min · fuentes [22] [23] [24] [25] [26] [27] [28]

> «IDEA estuvo patentado. La solicitud original es suiza, de 1990; la patente estadounidense se concedió en 1993 y la europea en 1994. El uso no comercial era gratuito, pero el comercial requería una licencia. Eso frenó su adopción: el software libre, como GnuPG, no lo incluyó durante años.»

> «Mientras tanto, en 1997 el NIST convocó un concurso abierto para sustituir a DES, con la condición de que el ganador fuera libre de regalías. En 2000 ganó Rijndael y en 2001 se publicó como AES, con bloques de 128 bits. Las patentes de IDEA expiraron en 2011 y 2012, y entonces GnuPG lo incorporó, pero para entonces AES ya era el estándar. En 2024, la especificación actual de OpenPGP prohíbe generar mensajes nuevos con IDEA y solo permite leerlos por compatibilidad.»

- En OpenPGP, el RFC 4880 (2007) ya dejaba IDEA como algoritmo opcional, solo para compatibilidad con PGP 2.x.

- Fechas exactas: EP y JP expiraron el 16-05-2011; US el 07-01-2012; GnuPG 1.4.13 se publicó el 21-12-2012.

### 35. DES, IDEA y AES: comparación conceptual · 0,8 min · fuentes [6] [26] [20] [19]

> «Comparemos los tres. En tamaños: DES e IDEA comparten el bloque de 64 bits, pero IDEA tiene una clave de 128 bits frente a los 56 de DES. AES duplica el bloque a 128 bits y admite claves de hasta 256.»

> «En diseño, cada uno representa una escuela: la red de Feistel de DES, la mezcla de grupos de Lai y Massey en IDEA y la red de sustitución-permutación de AES.»

> «Y en seguridad hoy: DES está roto en la práctica por su clave corta. IDEA y AES tienen ataques teóricos de un coste parecido, alrededor de 2 a la 126, sin impacto práctico. La diferencia real está en el bloque de 64 bits y en el soporte de los estándares.»

- Recorrer las pestañas con un clic o con **.**.

### 36. ¿Es relevante IDEA hoy? · 0,6 min · fuentes [19] [28] [21]

> «Para cerrar: IDEA no está roto. Más de treinta años después, ningún ataque contra la versión completa es practicable. Pero no lo usaríamos en un sistema nuevo, y no porque sea viejo: su bloque de 64 bits es pequeño para los volúmenes de datos actuales y los estándares han adoptado AES, con mejor soporte y aceleración por hardware.»

> «Su valor hoy es triple: leer datos antiguos cifrados con PGP, servir como caso de estudio de un diseño original basado en la mezcla de grupos algebraicos, e inspirar diseños posteriores de sus propios autores y de otros. Muchas gracias; quedamos atentos a sus preguntas.»

- Si preguntan por sucesores: la empresa MediaCrypt publicó en 2005 IDEA NXT (antes llamado FOX).

## Bibliografía

1. X. Lai, J. L. Massey. "A Proposal for a New Block Encryption Standard". Advances in Cryptology — EUROCRYPT ’90, LNCS 473, pp. 389–404. Springer, 1991. <https://doi.org/10.1007/3-540-46877-3_35>
2. X. Lai, J. L. Massey, S. Murphy. "Markov Ciphers and Differential Cryptanalysis". Advances in Cryptology — EUROCRYPT ’91, LNCS 547, pp. 17–38. Springer, 1991. <https://doi.org/10.1007/3-540-46416-6_2>
3. X. Lai. "On the Design and Security of Block Ciphers". ETH Series in Information Processing, vol. 1. Hartung-Gorre, Konstanz, 1992. Tesis doctoral, Diss. ETH n.º 9752 (director: J. L. Massey). <https://doi.org/10.3929/ethz-a-000646711>
4. A. J. Menezes, P. C. van Oorschot, S. A. Vanstone. Handbook of Applied Cryptography, cap. 7, §7.6 (IDEA). CRC Press, 1996. <https://cacr.uwaterloo.ca/hac/about/chap7.pdf>
5. B. Schneier. Applied Cryptography: Protocols, Algorithms, and Source Code in C, 2.ª ed., cap. 13 (IDEA). John Wiley & Sons, 1996. <https://www.schneier.com/books/applied-cryptography-2preface/>
6. National Bureau of Standards. FIPS PUB 46: Data Encryption Standard. 15 de enero de 1977. Versión FIPS 46-3 retirada por el NIST el 19 de mayo de 2005. <https://csrc.nist.gov/pubs/fips/46-3/final>
7. E. Biham, A. Shamir. "Differential Cryptanalysis of DES-like Cryptosystems". Journal of Cryptology 4(1):3–72, 1991. <https://doi.org/10.1007/BF00630563>
8. Electronic Frontier Foundation. Cracking DES: Secrets of Encryption Research, Wiretap Politics & Chip Design. O’Reilly, 1998. <https://www.eff.org/press/releases/eff-des-cracker-machine-brings-honesty-crypto-debate>
9. S. Garfinkel. PGP: Pretty Good Privacy. O’Reilly & Associates, 1994. <https://www.oreilly.com/library/view/pgp-pretty-good/9781565920989/>
10. D. Atkins, W. Stallings, P. Zimmermann. RFC 1991: PGP Message Exchange Formats. IETF, agosto de 1996. <https://www.rfc-editor.org/rfc/rfc1991>
11. J. Daemen, R. Govaerts, J. Vandewalle. "Weak Keys for IDEA". Advances in Cryptology — CRYPTO ’93, LNCS 773, pp. 224–231. Springer, 1994. <https://doi.org/10.1007/3-540-48329-2_20>
12. P. Hawkes. "Differential-Linear Weak Key Classes of IDEA". Advances in Cryptology — EUROCRYPT ’98, LNCS 1403, pp. 112–126. Springer, 1998. <https://doi.org/10.1007/BFb0054121>
13. A. Biryukov, J. Nakahara Jr., B. Preneel, J. Vandewalle. "New Weak-Key Classes of IDEA". ICICS 2002, LNCS 2513, pp. 315–326. Springer, 2002. <https://doi.org/10.1007/3-540-36159-6_27>
14. J. Nakahara Jr., B. Preneel, J. Vandewalle. "A Note on Weak Keys of PES, IDEA and Some Extended Variants". Informe técnico, COSIC, KU Leuven, 2002. <https://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.20.1681>
15. E. Biham, A. Biryukov, A. Shamir. "Miss in the Middle Attacks on IDEA and Khufu". Fast Software Encryption — FSE ’99, LNCS 1636, pp. 124–138. Springer, 1999. <https://doi.org/10.1007/3-540-48519-8_10>
16. E. Biham, O. Dunkelman, N. Keller. "New Cryptanalytic Results on IDEA". ASIACRYPT 2006, LNCS 4284, pp. 412–427. Springer, 2006. <https://doi.org/10.1007/11935230_27>
17. X. Sun, X. Lai. "The Key-Dependent Attack on Block Ciphers". ASIACRYPT 2009, LNCS 5912, pp. 19–36. Springer, 2009. <https://doi.org/10.1007/978-3-642-10366-7_2>
18. E. Biham, O. Dunkelman, N. Keller, A. Shamir. "New Attacks on IDEA with at Least 6 Rounds". Journal of Cryptology 28(2):209–239, 2015 (en línea 2013). Versión ampliada: IACR ePrint 2011/417. <https://eprint.iacr.org/2011/417>
19. D. Khovratovich, G. Leurent, C. Rechberger. "Narrow-Bicliques: Cryptanalysis of Full IDEA". Advances in Cryptology — EUROCRYPT 2012, LNCS 7237, pp. 392–410. Springer, 2012. <https://doi.org/10.1007/978-3-642-29011-4_24>
20. A. Bogdanov, D. Khovratovich, C. Rechberger. "Biclique Cryptanalysis of the Full AES". ASIACRYPT 2011, LNCS 7073. Versión completa: IACR ePrint 2011/449. <https://eprint.iacr.org/2011/449>
21. K. Bhargavan, G. Leurent. "On the Practical (In-)Security of 64-bit Block Ciphers: Collision Attacks on HTTP over TLS and OpenVPN". ACM CCS 2016, pp. 456–467. <https://sweet32.info/>
22. J. L. Massey, X. Lai. "Device for the conversion of a digital block and use of same". Patente de EE. UU. 5,214,703, concedida el 25 de mayo de 1993. <https://patents.google.com/patent/US5214703A/en>
23. Patente europea EP 0 482 154 B1, "Vorrichtung für das Umwandeln eines Digitalblockes und Verwendung derselben", solicitada el 16 de mayo de 1991. <https://patents.google.com/patent/EP0482154B1/de>
24. W. Koch. "[Announce] GnuPG 1.4.13 released". Lista gnupg-users, 21 de diciembre de 2012. <https://lists.gnupg.org/pipermail/gnupg-users/2012-December/045844.html>
25. J. Nechvatal, E. Barker, L. Bassham, W. Burr, M. Dworkin, J. Foti, E. Roback. "Report on the Development of the Advanced Encryption Standard (AES)". Journal of Research of NIST 106(3):511–577, 2001. <https://doi.org/10.6028/jres.106.023>
26. NIST. FIPS PUB 197: Advanced Encryption Standard (AES). 26 de noviembre de 2001 (actualizado en 2023). <https://doi.org/10.6028/NIST.FIPS.197-upd1>
27. J. Callas, L. Donnerhacke, H. Finney, D. Shaw, R. Thayer. RFC 4880: OpenPGP Message Format. IETF, noviembre de 2007. <https://www.rfc-editor.org/rfc/rfc4880>
28. P. Wouters, D. Huigens, J. Winter, Y. Niibe. RFC 9580: OpenPGP. IETF, julio de 2024. <https://www.rfc-editor.org/rfc/rfc9580>
