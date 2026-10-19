# Pruebas realizadas y resultados

Fecha: 18 de octubre de 2026 · Node.js 24.21.0 · OpenSSL 3.5.9 · Windows 11.

## 1. Pruebas automáticas (`npm test`)

**Resultado: 36 de 36 superadas** (16 de algoritmo y contenido, 16 de protocolo y 4 de cifrado del canal).

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
| Duración total entre 15 y 20 min y cada bloque entre 3,5 y 5,5 min | ✔ (18,0 min; 4,3 / 4,4 / 4,4 / 4,3) |
| Todas las diapositivas tienen título, tiempo y notas | ✔ |
| Todas las citas existen, todas las referencias se citan y todas tienen URL https | ✔ |
| Identificadores únicos | ✔ |
| Reparto de temas: patentes, bicliques, claves débiles y Sweet32 solo en el bloque 4; el cifrado publicado y los inversos solo en el 3; la rotación de 25 bits solo en el 2 | ✔ |

## 2. Verificaciones independientes

| Verificación | Resultado |
|---|---|
| Ejemplo de el bloque 2 (P = 4944 4541 3139 3931, K = 5875…6579) cifrado con OpenSSL | `D135 E4D6 C1FE 336D`, igual al visualizador |
| Cifras del bloque 4: 2¹²⁸ / 2¹²⁶·⁰⁶ ≈ 3,8; con 10¹⁸ claves/s, 2¹²⁸ → ≈ 1,1·10¹³ años (≈ 781 × edad del universo); al máximo de los deslizadores (10²⁴ claves/s) → ≈ 1,1·10⁷ años | Comprobado numéricamente; las notas se corrigieron para reflejarlo |
| DOI de la bibliografía (Crossref) y metadatos de los RFC (rfc-editor.org) | Todos resuelven, con título y páginas coincidentes |

## 3. Pruebas en navegador

Servidas desde una **subruta** (`http://localhost:8765/IDEA-International-Data-Encryption-Algorithm-/`), como en GitHub Pages.

| Prueba | Resultado |
|---|---|
| Carga de las 29 diapositivas, CSS, JS y KaTeX | ✔ |
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
| Resolución 1920×1080 (Edge sin interfaz), diapositivas condensadas de los cuatro bloques | ✔ Legibles y sin solapamientos |

## 4. Limitaciones conocidas

- La **pantalla completa** y la **apertura real de la ventana del presentador** exigen un gesto del usuario y permiso de ventanas emergentes. El navegador de pruebas no las permite: se verificó la lógica, pero no la ventana real. Conviene probar `F` y `P` una vez en el equipo de la exposición y, si el navegador bloquea la ventana, permitir las ventanas emergentes del sitio.
- En una de las capturas automáticas a 1920×1080, el servidor de pruebas local (`python -m http.server`) no entregó un archivo y faltó un bloque. No se reprodujo en 8 cargas posteriores. Por si ocurre el día de la exposición, la presentación muestra un aviso visible cuando falta algún bloque.
- No hay un vector oficial del NESSIE en las pruebas: el servidor de KU Leuven no respondió. La validación se apoya en el vector de Lai y en OpenSSL, dos fuentes independientes entre sí.
- Algunos datos se tomaron de fuentes secundarias fiables (Wikipedia, resúmenes de artículos) cuando el texto completo no estaba accesible: las fechas de expiración de las patentes y la clase de 2⁵¹ claves débiles (confirmada por los autores de 2002 que la citan). Están marcados en `js/data/references.js` (campo `note`).

## 5. Control remoto

### Pruebas automáticas

- `tests/remote.test.js` (incluidas en `npm test`): **13 de 13 superadas.** Cubren las acciones de cada comando, comandos inválidos, saltos fuera de rango, duplicados, ráfagas, pulsaciones simultáneas, órdenes absolutas, permisos de las demos, sesión cerrada, estados fuera de orden, reconexión y códigos de sala.
- `tools/test-supabase-sql.mjs`: **27 de 27 superadas** ejecutando `supabase/setup.sql` en PostgreSQL real (PGlite 0.2.17), con una simulación mínima de `auth.uid()`, `realtime.messages` y `realtime.topic()`.

### Casos pedidos

Los casos marcados «ensayo» se probaron en el navegador con el transporte local: presentación y remotos en pestañas distintas del mismo navegador. El protocolo, la validación y la interfaz son los mismos que por internet; solo cambia el canal.

| # | Caso | Estado |
|---|---|---|
| 1 | La presentación funciona sin activar el control remoto | ✔ 29 diapositivas, 0 errores de consola al recorrerlas y avanzar sus demos |
| 2 | El presentador crea una sala y obtiene un enlace válido | ✔ ensayo: código, enlace, QR y estado «conectado» |
| 3 | Un celular entra mediante el enlace o el código QR | ✔ ensayo: con el enlace y escribiendo el código (en minúsculas). Diseño verificado a 375×812. ⏳ **Pendiente con un celular real** (necesita Supabase configurado) |
| 4 | «Siguiente» en el remoto cambia la diapositiva del presentador | ✔ ensayo, con un clic real en el botón |
| 5 | «Anterior» produce el resultado esperado | ✔ prueba unitaria y ensayo |
| 6 | Los cambios locales del presentador se reflejan en los remotos | ✔ ensayo |
| 7 | Un segundo dispositivo también puede enviar comandos | ✔ ensayo: dos remotos, contador «2», «ir a la diapositiva 11» desde el segundo |
| 8 | Una reconexión recupera el estado actual | ✔ ensayo: al recargar el remoto se reconecta y recibe la diapositiva actual; un estado antiguo no la hace retroceder (unitaria) |
| 9 | Los comandos inválidos se rechazan | ✔ ensayo (inyectados en el canal: diapositiva 999, comando desconocido, basura, duplicado, ráfaga de 15) y unitaria |
| 10 | Las animaciones y demostraciones siguen funcionando | ✔ controles locales sin cambios; «Paso ▶» remoto avanzó la demo de 1 a 4 sin cambiar de diapositiva |
| 11 | Despliegue correcto en GitHub Pages | ✔ `index.html` y `remote.html` publicados (ver el commit) |
| 12 | Credenciales y reglas de autorización | ✔ sin secretos en el repositorio; reglas probadas en PostgreSQL real. ⏳ **Pendiente contra un proyecto Supabase real** |

Además: con dos «Siguiente» simultáneos solo se avanza una diapositiva (ensayo y unitaria). Tras «Cerrar sesión», los remotos muestran «Sesión terminada» y un comando posterior se ignora.

### Pendiente (requiere el proyecto de Supabase)

Después de configurar `js/remote-config.js`:

1. Abre la presentación publicada y pulsa **Control remoto → Iniciar sesión**. El panel debe decir «Internet · Supabase Realtime» y «conectado».
2. Escanea el QR con un celular **con datos móviles** (otra red) y pulsa «Siguiente»: la presentación debe avanzar.
3. Entra desde otra computadora escribiendo el código. El contador debe marcar 2.
4. Activa y desactiva el modo avión del celular: al volver debe mostrar la diapositiva actual.
5. Abre `remote.html` en una ventana privada y escribe un código inventado 9 veces. Debe aparecer «Demasiados intentos».
6. Pulsa «Cerrar sesión». Los celulares deben mostrar «Sesión terminada» y no poder enviar más comandos.

### Modo internet sin configuración (MQTT público cifrado)

Probado el 19 de octubre de 2026 con el servidor público `broker.hivemq.com` (conexión real por internet, no `BroadcastChannel`):

| Caso | Resultado |
|---|---|
| El presentador crea la sala | ✔ «Internet · canal cifrado de extremo a extremo», estado «conectado» y enlace `remote.html#c=…&m=mq` |
| El remoto entra con el enlace y recibe el estado y la lista de 29 diapositivas | ✔ |
| Clic real en «Siguiente» en el remoto | ✔ La presentación cambia en < 0,5 s y el contador marca 1 dispositivo |
| **Proceso independiente** (un remoto en Node.js, fuera del navegador) conectado al mismo servidor | ✔ Recibe el estado, envía «ir a la diapositiva 11» y la presentación cambia. El otro remoto, en el navegador, también ve la diapositiva 11 |
| Mensaje sin cifrar inyectado en el tema | ✔ Ignorado: la presentación no se movió |
| «Cerrar sesión» | ✔ El remoto muestra «Sesión terminada» |
| Casilla «Modo ensayo» | ✔ Crea una sala local (`m=local`) |
| `tests/securechannel.test.js` | ✔ 4 de 4: tema determinista que no revela el código, ida y vuelta, IV aleatorio, rechazo de mensajes alterados, falsos o con otra clave |

Pendiente: probar con **celulares reales** en otra red (datos móviles) el día del ensayo. El canal es el mismo que en la prueba anterior, pero no se ha ejecutado desde un teléfono.

### Controles completos de las demostraciones en el remoto

| Prueba | Resultado |
|---|---|
| Recorrido de las 29 diapositivas: controles que recibe el remoto | ✔ 16 diapositivas con controles: línea de tiempo (6), operaciones (5 ejemplos), leyes (2), división del bloque (2), subclaves (3), ronda (2), visualizador (16: Aleatorio, R1…R8, ½, Reiniciar, Ronda ⏮/⏭, Paso, Auto), ronda 1 (4), resumen (3), subclaves inversas (9), laboratorio (10: 4 ejemplos y 6 pasos), espacio de claves (2 deslizadores × −/+), capas (5), claves débiles (4), ataques (2 vistas y 9 filas), comparación (4 pestañas) |
| Clic real en «Ronda ⏭» desde el remoto | ✔ Presentación en la ronda 2 (17 / 134). El remoto resalta R2 y muestra «17 / 134» |
| «▷ Auto» desde el remoto | ✔ El remoto sigue la reproducción (33 → 38 en 3 s) y el botón cambia a «❚❚ Pausa». Un clic en «Pausa» la detiene |
| Toques durante la reproducción automática | ✔ Los botones se actualizan en su sitio (el mismo elemento), así que un toque no se pierde |
| Laboratorio desde el remoto: ejemplo «Todo ceros» → Ejecutar todo → Descifrar el resultado → Ejecutar todo | ✔ `0001 0001 0000 0000` (igual que OpenSSL) y «✓ Igual al original». «Descifrar» aparece desactivado cuando no aplica |
| Deslizador «+ más» desde el remoto | ✔ 10^12 → 10^12.5 |
| Pestaña «Historia» de la comparación | ✔ Cambia en la presentación y queda resaltada en el remoto |
| Pruebas unitarias nuevas | ✔ Etiqueta que no coincide, control desactivado, índice fuera de rango, control de una diapositiva anterior y estados de demo que no invalidan la navegación |
| Errores de consola con la sesión abierta, recorriendo todas las demos | 0 |
