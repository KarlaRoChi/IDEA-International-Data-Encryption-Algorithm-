# Guion y distribución de tiempos

> Archivo generado con `node tools/export-guion.js` a partir de `js/slides/*.js`. No editar a mano.

**29 diapositivas · 18,0 min previstos** (sin preguntas). Objetivo: 30–40 min, ≈ 8 min por bloque.

| Bloque | Diapositivas | Minutos |
|---|--:|--:|
| Portada y cierre (compartidas) | 2 | 0,6 |
| Bloque 1 · Contexto y fundamentos | 6 | 4,3 |
| Bloque 2 · Arquitectura y cifrado | 6 | 4,4 |
| Bloque 3 · Ejemplo práctico y descifrado | 7 | 4,4 |
| Bloque 4 · Criptoanálisis y seguridad | 8 | 4,3 |
| **Total** | **29** | **18,0** |

## Mapa de diapositivas

| # | Diapositiva | Bloque | Min | Acumulado | Interactiva |
|--:|---|---|--:|--:|:-:|
| 1 | Portada | — | 0,3 | 0,3 | ● |
| 2 | Contexto y fundamentos | 1 | 0,2 | 0,5 |  |
| 3 | ¿Qué es IDEA? Origen en el ETH Zúrich | 1 | 1,0 | 1,5 | ● |
| 4 | Por qué nació y dónde se usó: DES y PGP | 1 | 0,9 | 2,4 |  |
| 5 | Tres operaciones sobre palabras de 16 bits | 1 | 1,3 | 3,7 | ● |
| 6 | ¿Por qué mezclar operaciones incompatibles? | 1 | 0,6 | 4,3 | ● |
| 7 | Conclusión del bloque 1 | 1 | 0,3 | 4,6 |  |
| 8 | Arquitectura y cifrado | 2 | 0,2 | 4,8 |  |
| 9 | Estructura general | 2 | 0,8 | 5,6 | ● |
| 10 | 52 subclaves por rotaciones de 25 bits | 2 | 0,9 | 6,5 | ● |
| 11 | Una ronda y su caja MA | 2 | 1,0 | 7,5 | ● |
| 12 | Cifrado ronda por ronda | 2 | 1,2 | 8,7 | ● |
| 13 | Conclusión del bloque 2 | 2 | 0,3 | 9,0 |  |
| 14 | Ejemplo práctico y descifrado | 3 | 0,2 | 9,2 |  |
| 15 | Datos del ejemplo y preparación | 3 | 0,5 | 9,7 | ● |
| 16 | Ronda 1, operación por operación | 3 | 1,0 | 10,7 | ● |
| 17 | Rondas 2 a 8 y transformación final | 3 | 0,5 | 11,2 | ● |
| 18 | Descifrado: mismo circuito, subclaves inversas | 3 | 1,0 | 12,2 | ● |
| 19 | Laboratorio de cifrado y descifrado | 3 | 0,9 | 13,1 | ● |
| 20 | Conclusión del bloque 3 | 3 | 0,3 | 13,4 |  |
| 21 | Criptoanálisis y seguridad | 4 | 0,2 | 13,6 |  |
| 22 | Espacio de claves: 2¹²⁸ | 4 | 0,6 | 14,2 | ● |
| 23 | Seguridad teórica y seguridad práctica | 4 | 0,5 | 14,7 | ● |
| 24 | Claves débiles | 4 | 0,5 | 15,2 | ● |
| 25 | Ataques publicados: rondas reducidas e IDEA completo | 4 | 0,9 | 16,1 | ● |
| 26 | Patentes, licencias y la transición hacia AES | 4 | 0,5 | 16,6 |  |
| 27 | DES, IDEA y AES: comparación conceptual | 4 | 0,5 | 17,1 | ● |
| 28 | ¿Es relevante IDEA hoy? | 4 | 0,6 | 17,7 |  |
| 29 | Preguntas · Bibliografía | — | 0,3 | 18,0 | ● |

## Bloque 1 · Contexto y fundamentos (4,3 min)

### 2. Contexto y fundamentos · 0,2 min

> «En este bloque vemos qué es IDEA, por qué se creó y en qué matemáticas se apoya.»

### 3. ¿Qué es IDEA? Origen en el ETH Zúrich · 1,0 min · fuentes [1] [2] [3]

> «IDEA es un cifrador simétrico por bloques: emisor y receptor comparten la misma clave. En lugar de tablas de sustitución, como DES, mezcla tres operaciones aritméticas de grupos algebraicos distintos.»

> «Nació en el ETH de Zúrich. Xuejia Lai y James Massey presentaron un primer diseño, PES, en 1990. Ese mismo año apareció el criptoanálisis diferencial, y en 1991 lo reforzaron frente a él con el nombre IPES. En 1992, la tesis de Lai lo presenta ya como IDEA.»

- Recorrer la línea de tiempo con **.** sin cambiar de diapositiva. No dar aquí los tamaños de bloque ni de clave (bloque 2).

### 4. Por qué nació y dónde se usó: DES y PGP · 0,9 min · fuentes [6] [7] [8] [9] [10]

> «¿Por qué hacía falta? DES tenía una clave de solo 56 bits: en 1998 la EFF construyó una máquina que encontraba una clave en días. Además, estaba pensado para hardware y en 1990 el ataque diferencial cambió las reglas del diseño. IDEA respondió con una clave mucho más larga y operaciones naturales para un procesador de 16 bits.»

> «Se hizo famoso con PGP. En la versión 2.0, de 1992, Phil Zimmermann sustituyó su cifrador BassOmatic por IDEA. PGP usa un esquema híbrido: IDEA cifra el mensaje con una clave de sesión aleatoria y RSA cifra solo esa clave.»

- Las patentes y licencias las trata el bloque 4.

### 5. Tres operaciones sobre palabras de 16 bits · 1,3 min · fuentes [1] [4]

> «IDEA trabaja con palabras de 16 bits y solo tres operaciones, cada una de un grupo distinto: el XOR, la suma módulo 2 a la 16 y la multiplicación módulo 2 a la 16 más 1, es decir, módulo 65 537.»

> «65 537 es primo, así que los valores del 1 al 65 536 forman un grupo y todos tienen inverso. Como 65 536 no cabe en 16 bits, la palabra 0000 representa 2 a la 16. Por ejemplo, con a = 0, 0 ⊙ 3 = 65 536 · 3 mód 65 537 = 65 534, FFFE. Con los mismos dos números, cada operación da un resultado muy distinto.»

- Secuencia: Ejemplo → Con acarreo → a = 0 → b = 1.

### 6. ¿Por qué mezclar operaciones incompatibles? · 0,6 min · fuentes [1]

> «¿Por qué tres operaciones distintas? Porque son incompatibles. Si pruebo 100 000 ternas al azar, la distributividad o la asociatividad entre ellas casi nunca se cumplen. Así, ninguna operación es lineal vista desde las otras, y un atacante no puede simplificar el cifrador a ecuaciones fáciles.»

### 7. Conclusión del bloque 1 · 0,3 min

> «En resumen: alternativa a DES, difundido con PGP y basado en mezclar tres grupos incompatibles. Ahora veremos cómo se organizan dentro del algoritmo.»

## Bloque 2 · Arquitectura y cifrado (4,4 min)

### 8. Arquitectura y cifrado · 0,2 min

> «Ya conocemos las operaciones. Ahora veremos cómo se organizan: tamaños, subclaves, rondas y la caja MA.»

### 9. Estructura general · 0,8 min · fuentes [3] [4]

> «IDEA cifra bloques de 64 bits con una clave de 128 bits, de la que salen 52 subclaves de 16 bits. El bloque pasa por 8 rondas idénticas y una media ronda final: “8,5 rondas”. Lo primero es dividir el bloque en cuatro palabras de 16 bits, X1 a X4; aquí, el texto “IDEA1991”.»

- Pulsar «Dividir en 4 palabras» (o **.**). 8 rondas × 6 subclaves + 4 = 52.

### 10. 52 subclaves por rotaciones de 25 bits · 0,9 min · fuentes [3] [4]

> «La clave de 128 bits se parte en 8 palabras: Z1 a Z8. Luego se rota 25 bits a la izquierda y se vuelve a partir: Z9 a Z16. Cada celda conserva el color de su posición original, así que se ve el desplazamiento. Tras 6 rotaciones hay 56 palabras y se usan 52: seis por ronda y cuatro para la salida.»

### 11. Una ronda y su caja MA · 1,0 min · fuentes [1] [5]

> «Cada ronda usa seis subclaves y catorce operaciones en cuatro fases. Primero, cada palabra se combina con una subclave. Después, dos XOR producen p y q, que entran en la caja MA.»

> «La caja MA es el corazón de la ronda: alterna multiplicaciones y sumas con Z5 y Z6, de modo que cada bit de sus salidas t y u depende de todos los bits de entrada. Es la difusión completa. Por último, t y u se combinan con las cuatro palabras y las dos centrales se cruzan, excepto en la ronda 8.»

- Avanzar con **.**; en los pasos 7–10 el diagrama enfoca la caja MA.

### 12. Cifrado ronda por ronda · 1,2 min · fuentes [3]

> «Así se transforma el bloque de entrada en el cifrado, con valores reales. Avanzo unos pasos de la ronda 1: cada operación muestra sus operandos, su resultado y la subclave que usa.»

> «Con “Ronda ⏭” llego a la octava, que no cruza los bloques centrales, y después a la transformación de salida: cuatro operaciones con Z49 a Z52. Su resultado es el bloque cifrado.»

- Guion: Paso ▶ ×4 → Ronda ⏭ hasta R8 → Ronda ⏭ (½) → Paso ▶ hasta el final.

### 13. Conclusión del bloque 2 · 0,3 min

> «Resumiendo: 64 bits de bloque, 128 de clave, 52 subclaves y 8 rondas y media con la caja MA como núcleo. Ahora veremos un ejemplo completo y cómo se descifra.»

## Bloque 3 · Ejemplo práctico y descifrado (4,4 min)

### 14. Ejemplo práctico y descifrado · 0,2 min

> «Ahora hacemos el cálculo completo con un ejemplo publicado, para que los números se puedan comprobar, y después vemos cómo se descifra.»

### 15. Datos del ejemplo y preparación · 0,5 min · fuentes [3] [5]

> «Usamos el vector de prueba que publicó Lai en 1992: clave 0001 a 0008 y texto 0000 a 0003. El resultado debe ser 11FB ED2B 0198 6DE5. Preparar los datos es dividir el bloque en X1 a X4 y generar las 52 subclaves; las de la ronda 1 son 0001 a 0006.»

### 16. Ronda 1, operación por operación · 1,0 min · fuentes [3]

> «Paso 1: 0000 ⊙ 0001. Aquí aparece el cero: 0000 vale 65 536, y 65 536 · 1 vuelve a escribirse como 0000. Pasos 2 a 4: 0003, 0005 y 000C. Entradas de la caja MA: 0005 y 000F. La caja MA da 00F0 y 0109.»

> «Tras la mezcla, la salida de la ronda 1 es 00F0 00F5 010A 0105.»

- Detenerse en el paso 1 (cero) y en el 9 (caja MA); luego «Toda la ronda ⏩».

### 17. Rondas 2 a 8 y transformación final · 0,5 min · fuentes [3]

> «Las rondas 2 a 8 repiten las mismas operaciones con sus subclaves. Tras la transformación de salida obtenemos 11FB ED2B 0198 6DE5: coincide con el valor publicado.»

- Pulsar «Hasta el final ⏩». La implementación también se validó con 100 vectores de OpenSSL.

### 18. Descifrado: mismo circuito, subclaves inversas · 1,0 min · fuentes [4] [1]

> «Para descifrar se usa el mismo algoritmo; solo cambian las subclaves, en orden inverso. Lo que se multiplicó se deshace con el inverso módulo 65 537, y lo que se sumó, con el opuesto módulo 2 a la 16.»

> «La caja MA no se invierte: sus entradas p y q no cambian al aplicar la mezcla, porque el XOR con t se cancela entre dos palabras. Por eso Z5 y Z6 se reutilizan tal cual. Por ejemplo, U1 es el inverso de Z49 = 0080: FE01, y 0080 ⊙ FE01 = 0001.»

### 19. Laboratorio de cifrado y descifrado · 0,9 min · fuentes [3]

> «En el laboratorio se puede cifrar cualquier clave y bloque. Con “Ejecutar todo” obtengo 11FB ED2B 0198 6DE5. Al pulsar “Descifrar el resultado”, las subclaves pasan a ser U, y al terminar recuperamos 0000 0001 0002 0003, igual que el original.»

- Si sobra tiempo, elegir «Aleatorio» y repetir la ida y vuelta.

### 20. Conclusión del bloque 3 · 0,3 min

> «El cifrado da el resultado publicado y el descifrado recupera el original. Queda una pregunta: ¿es seguro?»

## Bloque 4 · Criptoanálisis y seguridad (4,3 min)

### 21. Criptoanálisis y seguridad · 0,2 min

> «La pregunta natural: ¿es seguro IDEA? La respuesta tiene matices, y hay que separar el algoritmo de cómo se usa.»

### 22. Espacio de claves: 2¹²⁸ · 0,6 min · fuentes [8] [19]

> «Con un billón de claves por segundo en un millón de equipos, DES cae en milisegundos; IDEA necesitaría unos 10 a la 13 años, cientos de veces la edad del universo. La tercera barra es el mejor ataque que explota la estructura de IDEA: 2 a la 126 operaciones. Es cuatro veces mejor que la fuerza bruta, pero igual de inalcanzable.»

- Mover los deslizadores en directo.

### 23. Seguridad teórica y seguridad práctica · 0,5 min · fuentes [21] [19]

> «La seguridad teórica pregunta si hay un ataque mejor que la fuerza bruta; la práctica, si un sistema real está protegido. En el diseño, IDEA completo no tiene ataques prácticos. Pero el bloque de 64 bits limita cuántos datos se pueden cifrar con una clave: tras unos 32 GiB aparecen colisiones, como mostró Sweet32 en 2016. Eso afecta a cualquier cifrador de 64 bits mal usado.»

### 24. Claves débiles · 0,5 min · fuentes [11] [12] [13] [14]

> «Una clave con muchos ceros produce subclaves 0000 o 0001, y entonces la multiplicación solo copia o cambia de signo: pierde su no linealidad. Con una clave aleatoria ninguna subclave es trivial; con una casi toda a cero, casi todas. Las clases conocidas tienen hasta 2 a la 64 claves: la probabilidad de caer en una al azar es despreciable.»

- Los botones ilustran el mecanismo; no afirman que una clave pertenezca a una clase publicada.

### 25. Ataques publicados: rondas reducidas e IDEA completo · 0,9 min · fuentes [15] [16] [17] [18] [19] [20]

> «Durante años, los ataques solo alcanzaban versiones recortadas: 4,5 rondas en 1999, 5 en 2006 y 6 en 2009. En 2011–2012 llegaron los primeros contra las 8,5 rondas completas, con bicliques y encuentro a medio camino.»

> «A diferencia de la fuerza bruta, estos ataques explotan la estructura: cada subclave es una copia literal de bits de la clave. Aun así cuestan 2 a la 126, frente a 2 a la 128, y no permiten descifrar mensajes reales. Un ataque equivalente contra AES-128 cuesta 2 a la 126,1, y nadie considera roto AES.»

- **.** cambia a la vista de coste.

### 26. Patentes, licencias y la transición hacia AES · 0,5 min · fuentes [22] [23] [24] [25] [26] [27] [28]

> «IDEA estuvo patentado en EE. UU. y Europa. El uso comercial requería licencia, lo que frenó su adopción en el software libre. Mientras tanto, el NIST eligió en un concurso abierto y libre de regalías el AES, publicado en 2001. Cuando las patentes expiraron, en 2011 y 2012, AES ya era el estándar; hoy OpenPGP solo permite leer mensajes antiguos con IDEA.»

- EP y JP expiraron el 16-05-2011; US el 07-01-2012. El RFC 4880 (2007) ya dejaba IDEA como opcional.

### 27. DES, IDEA y AES: comparación conceptual · 0,5 min · fuentes [6] [26] [20] [19]

> «DES e IDEA comparten el bloque de 64 bits, pero IDEA tiene 128 bits de clave frente a 56. AES duplica el bloque. Cada uno representa una escuela: Feistel, mezcla de grupos y sustitución-permutación. Hoy DES está roto en la práctica; IDEA y AES tienen ataques teóricos de coste parecido, sin impacto práctico.»

### 28. ¿Es relevante IDEA hoy? · 0,6 min · fuentes [19] [28] [21]

> «A favor: treinta años sin ataques prácticos, un diseño compacto y el mismo circuito para cifrar y descifrar. En contra: el bloque de 64 bits, una planificación de claves que solo copia bits y las patentes.»

> «Conclusión: IDEA no está roto, pero no lo usaríamos en un sistema nuevo; no por viejo, sino por su bloque y por el soporte de los estándares. Sigue siendo útil para leer datos antiguos y como ejemplo de diseño. Muchas gracias.»

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
