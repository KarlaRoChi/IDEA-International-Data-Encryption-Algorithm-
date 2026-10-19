# Pruebas realizadas y resultados

Fecha: 18 de octubre de 2026 · Node.js 24.21.0 · OpenSSL 3.5.9 · Windows 11.

## 1. Pruebas automáticas (`npm test`)

**Resultado: 16 de 16 superadas.**

### Algoritmo (`tests/idea.test.js`)

| Prueba | Resultado |
|---|---|
| Vector de Lai (1992): K = 0001…0008, P = 0000 0001 0002 0003 → C = 11FB ED2B 0198 6DE5, y descifrado de vuelta | ✔ |
| Subclaves Z1…Z52 del vector: Z1–Z8 = clave, Z9–Z16 = 0400 0600 0800 0A00 0C00 0E00 1000 0200, Z49–Z52 tras 6 rotaciones | ✔ |
| 100 vectores independientes de OpenSSL (`idea-ecb`), cifrado y descifrado; incluye clave y bloque todo-ceros y todo-unos | ✔ |
| Tratamiento del cero en ⊙: 0⊙0 = 1, 0⊙1 = 0, 0⊙2 = FFFF, 8000⊙2 = 0, FFFF⊙FFFF = 4 | ✔ |
| Inversos para las 65 536 palabras: x ⊙ x⁻¹ = 1 y x ⊞ (−x) = 0; 0⁻¹ = 0 | ✔ |
| Ida y vuelta con 500 pares clave/bloque pseudoaleatorios | ✔ |
| La traza es coherente: cada uno de los pasos registrados recalcula su resultado; la salida coincide | ✔ |
| Validación de entradas hexadecimales (longitud, caracteres, separadores) | ✔ |

### Contenido y reparto (`tests/content.test.js`)

| Prueba | Resultado |
|---|---|
| `index.html` carga los archivos de diapositivas en el orden acordado | ✔ |
| Orden estricto de los bloques: portada → 1 → 2 → 3 → 4 → cierre, sin intercalar | ✔ |
| Cada bloque empieza con portada (identifica el bloque), termina con conclusión y transición al siguiente y tiene al menos una interacción | ✔ |
| Duración total entre 30 y 40 min y cada bloque entre 7 y 9 min | ✔ (33,5 min; 8,2 / 8,1 / 8,3 / 7,9) |
| Todas las diapositivas tienen título, tiempo y notas | ✔ |
| Todas las citas existen, todas las referencias se citan y todas tienen URL https | ✔ |
| Identificadores únicos | ✔ |
| Reparto de temas: patentes, bicliques, claves débiles y Sweet32 solo en el bloque 4; el cifrado publicado y los inversos solo en el 3; la rotación de 25 bits solo en el 2 | ✔ |

## 2. Verificaciones independientes

| Verificación | Resultado |
|---|---|
| Ejemplo de el bloque 2 (P = 4944 4541 3139 3931, K = 5875…6579) cifrado con OpenSSL | `D135 E4D6 C1FE 336D`, igual al visualizador |
| Mapa de bits de clave por ronda (bloque 4) frente a la planificación real de claves (200 claves aleatorias) | 0 discrepancias |
| Cifras del bloque 4: 2¹²⁸ / 2¹²⁶·⁰⁶ ≈ 3,8; con 10¹⁸ claves/s, 2¹²⁸ → ≈ 1,1·10¹³ años (≈ 781 × edad del universo); al máximo de los deslizadores (10²⁴ claves/s) → ≈ 1,1·10⁷ años | Comprobado numéricamente; las notas se corrigieron para reflejarlo |
| DOI de la bibliografía (Crossref) y metadatos de los RFC (rfc-editor.org) | Todos resuelven, con título y páginas coincidentes |

## 3. Pruebas en navegador

Servidas desde una **subruta** (`http://localhost:8765/IDEA-International-Data-Encryption-Algorithm-/`), como en GitHub Pages.

| Prueba | Resultado |
|---|---|
| Carga de las 37 diapositivas, CSS, JS y KaTeX | ✔ |
| Errores de consola al montar todas las diapositivas y avanzar 200 pasos en cada demo | 0 errores |
| Fórmulas KaTeX (`.katex-error`) | 0 errores |
| Contenido desbordado del escenario 16:9 | Ninguno visible (solo los nodos MathML ocultos de KaTeX) |
| Teclado: `.`/`,` avanzan y retroceden la demo sin cambiar de diapositiva | ✔ |
| Teclado: `→` dentro de un campo de texto no cambia de diapositiva; `.` dentro de un campo no avanza la demo | ✔ |
| Teclado: `M` / `Esc` (índice), `1`–`4` (bloques), `Inicio` / `Fin`, `N` (notas) | ✔ |
| URL con `#n` abre la diapositiva n y se actualiza al navegar | ✔ |
| Laboratorio: cifrado del vector de Lai → 11FB ED2B 0198 6DE5 «coincide con el publicado»; «Descifrar el resultado» → 0000 0001 0002 0003 «igual al original» | ✔ |
| Visualizador: 134 posiciones, rondas 1–8 con cruce (la 8 sin él) y transformación final | ✔ |
| `guion.html` genera el resumen, el mapa y las notas sin errores | ✔ |
| Vista del presentador (redirigida a un `iframe`, porque el navegador de pruebas bloquea ventanas emergentes): título, notas, siguiente diapositiva, tiempo del bloque (00:00 / 08:18) y botones que controlan la presentación | ✔ |
| Cronómetro (`T` / clic): cuenta el tiempo | ✔ |
| Apertura directa con `file://` (Edge sin interfaz): diapositivas, demos y KaTeX | ✔ |
| Resolución 1920×1080 (Edge sin interfaz), diapositivas 8, 14, 15, 30 y 37 | ✔ Legibles y sin solapamientos tras ajustar la etiqueta «caja MA» |

## 4. Limitaciones conocidas

- La **pantalla completa** y la **apertura real de la ventana del presentador** exigen un gesto del usuario y permiso de ventanas emergentes. El navegador de pruebas no las permite: se verificó la lógica, pero no la ventana real. Conviene probar `F` y `P` una vez en el equipo de la exposición y, si el navegador bloquea la ventana, permitir las ventanas emergentes del sitio.
- En una de las capturas automáticas a 1920×1080, el servidor de pruebas local (`python -m http.server`) no entregó un archivo y faltó un bloque. No se reprodujo en 8 cargas posteriores. Por si ocurre el día de la exposición, la presentación muestra un aviso visible cuando falta algún bloque.
- No hay un vector oficial del NESSIE en las pruebas: el servidor de KU Leuven no respondió. La validación se apoya en el vector de Lai y en OpenSSL, dos fuentes independientes entre sí.
- Algunos datos se tomaron de fuentes secundarias fiables (Wikipedia, resúmenes de artículos) cuando el texto completo no estaba accesible: las fechas de expiración de las patentes y la clase de 2⁵¹ claves débiles (confirmada por los autores de 2002 que la citan). Están marcados en `js/data/references.js` (campo `note`).
