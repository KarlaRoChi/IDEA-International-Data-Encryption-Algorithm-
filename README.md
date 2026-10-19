# IDEA · International Data Encryption Algorithm

**▶ Ver la presentación: <https://karlarochi.github.io/IDEA-International-Data-Encryption-Algorithm-/>**
· Guion y tiempos: <https://karlarochi.github.io/IDEA-International-Data-Encryption-Algorithm-/guion.html>

Presentación web interactiva, en formato de diapositivas 16:9, sobre el cifrador por bloques **IDEA** (Xuejia Lai y James L. Massey, ETH Zúrich, 1990–1992). Está pensada para una exposición universitaria de 15–20 minutos dividida en **cuatro bloques**.

- **29 diapositivas · 18 min previstos** (≈ 4,5 min por bloque). Ver el [mapa y el guion](docs/GUION.md).
- Implementación **real** de IDEA (bloque de 64 bits, clave de 128 bits, 8,5 rondas), validada con el vector de prueba publicado por Lai (1992) y con **100 vectores independientes generados con OpenSSL**.
- Sitio **100 % estático**: HTML, CSS y JavaScript sin compilación, sin servidor propio y sin claves privadas. Funciona en GitHub Pages bajo la ruta del proyecto e incluso abriendo `index.html` con doble clic.

## Reparto (orden fijo)

| Bloque | Contenido | Interacciones |
|---|---|---|
| 1 · Contexto y fundamentos | Qué es IDEA, historia (PES → IPES → IDEA), limitaciones de DES, PGP, los tres grupos algebraicos y el tratamiento del 0 | Línea de tiempo, laboratorio de ⊕ ⊞ ⊙ sobre bits, comprobador de leyes algebraicas |
| 2 · Arquitectura y cifrado | 64/128 bits, división en X1…X4, 52 subclaves y rotación de 25 bits, organización de la ronda, caja MA, 8 + ½ rondas | División del bloque, planificación de claves animada, diagrama de ronda, **visualizador de cifrado ronda a ronda** |
| 3 · Ejemplo práctico y descifrado | Vector de Lai paso a paso, rondas 2–8, transformación final, descifrado, subclaves inversas y reordenadas | Ronda 1 operación a operación, resumen de rondas, tabla de subclaves de descifrado, **laboratorio de cifrado y descifrado** |
| 4 · Criptoanálisis y seguridad | Espacio de claves, seguridad teórica vs práctica, claves débiles, ataques publicados, ventajas y desventajas, patentes, transición a AES, relevancia actual | Calculadora del espacio de claves, capas de seguridad, detector de subclaves triviales, gráfico de ataques (rondas y coste), comparación DES/IDEA/AES |

Para no repetir contenido, el bloque 2 usa su propio ejemplo (texto «IDEA1991», clave «XuejiaLai&Massey») y explica la **estructura**. El bloque 3 hace el **cálculo numérico completo** con el vector publicado y explica el **descifrado**.

## Control remoto colaborativo

Los compañeros pueden pasar las diapositivas desde su celular o computadora mientras la presentadora comparte pantalla: botón **Control remoto** (tecla `R`) → **«Iniciar sesión de presentación»** → QR, enlace o código de 8 caracteres. Funciona por internet con **Supabase Realtime** (configuración única, sin servidor propio). Sin configurar, queda en *modo ensayo* (pestañas del mismo navegador). Arquitectura, configuración, seguridad y pruebas: [docs/CONTROL-REMOTO.md](docs/CONTROL-REMOTO.md).

## Ejecutar en local

No hay que instalar nada. Hay dos opciones:

1. **Doble clic** en `index.html`. Todos los scripts son clásicos y KaTeX está incluido en `vendor/`, así que funciona sin conexión (comprobado con Edge en `file://`).
2. Con un servidor local, más parecido a GitHub Pages:

```bash
python -m http.server 8000
```

Después abre <http://localhost:8000/>.

Las tipografías Inter y JetBrains Mono se cargan desde Google Fonts. Sin conexión se usan las fuentes del sistema y la presentación sigue funcionando.

## Pruebas

Requiere Node.js 18 o superior y ninguna dependencia:

```bash
npm test
```

Equivale a `node --test tests/idea.test.js tests/content.test.js`. El detalle de las pruebas y sus resultados está en [docs/PRUEBAS.md](docs/PRUEBAS.md).

Para regenerar los vectores de OpenSSL (requiere OpenSSL 3 con el proveedor `legacy`):

```bash
sh tools/gen-openssl-vectors.sh 100 > tests/openssl-vectors.json
```

Para regenerar el guion en Markdown tras cambiar notas o tiempos:

```bash
node tools/export-guion.js
```

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a la rama `main` del repositorio `KarlaRoChi/IDEA-International-Data-Encryption-Algorithm-`.
2. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. El sitio quedará en `https://karlarochi.github.io/IDEA-International-Data-Encryption-Algorithm-/`.

Todas las rutas son relativas, así que funciona bajo la subruta del proyecto. El archivo `.nojekyll` desactiva Jekyll. El flujo `.github/workflows/test.yml` ejecuta las pruebas en cada `push`.

## Controles

| Presentación | | Demostraciones | |
|---|---|---|---|
| `→` `PgDn` / `←` `PgUp` | diapositiva siguiente / anterior | `.` / `,` | paso siguiente / anterior de la demo activa |
| `Inicio` / `Fin` | primera / última | botones propios | cada demo tiene sus controles |
| `1`–`4` | saltar a cada bloque | | |
| `M` | índice de diapositivas | | |
| `F` | pantalla completa (la interfaz se oculta sola) | | |
| `N` | panel de notas | | |
| `P` | vista del presentador en otra ventana (notas, cronómetros, siguiente diapositiva) | | |
| `T` | iniciar o pausar el cronómetro | | |

Las flechas nunca avanzan una demo y los controles de una demo nunca cambian de diapositiva. Mientras se escribe en un campo, el teclado no mueve la presentación. Un mando de presentaciones (que envía `PgDn`/`PgUp`) solo cambia de diapositiva.

Los títulos y colores de los bloques están en `js/config.js`; las portadas, el pie, el índice y el guion se actualizan solos.

## Estructura

```
index.html                 Estructura de la aplicación (barra, escenario 16:9, índice, notas)
guion.html                 Guion imprimible y tiempos, generado de las diapositivas
css/theme.css              Variables de diseño (colores de operaciones y bloques)
css/deck.css               Sistema de diapositivas y estilos por diapositiva
css/widgets.css            Componentes interactivos
js/config.js               Título y bloques (editable)
js/idea/idea.js            Implementación de IDEA con traza (navegador y Node)
js/data/references.js      Bibliografía verificable (citada por número en cada diapositiva)
js/deck/deck.js            Motor: navegación, escalado, índice, notas, presentador, cronómetro
js/remote/*.js             Control remoto: protocolo, transportes, modo presentador y app del remoto
js/remote-config.js        Configuración PÚBLICA de Supabase (vacía = modo ensayo)
remote.html                Interfaz del control remoto (celular o computadora)
supabase/setup.sql         Tablas, funciones y políticas RLS del control remoto
js/widgets/*.js            Componentes interactivos (uno o dos por archivo)
js/slides/0X-*.js          Contenido y notas: un archivo por bloque
tests/                     Pruebas del algoritmo y del contenido + vectores OpenSSL
tools/                     Generación de vectores y exportación del guion
docs/GUION.md              Guion y tiempos (generado)
docs/PRUEBAS.md            Pruebas realizadas y resultados
vendor/katex/              KaTeX 0.16.11 (licencia MIT), incluido para uso sin conexión
vendor/supabase/, qrcode/  supabase-js 2.49.4 y qrcode-generator 1.4.4 (MIT)
```

## Nota sobre la implementación

`js/idea/idea.js` es una implementación **educativa**: traza cada operación para poder visualizarla, no es de tiempo constante y no implementa modos de operación. No debe usarse para proteger datos reales.

## Fuentes

La bibliografía completa, con enlaces DOI/RFC verificados, está en la última diapositiva y en [docs/GUION.md](docs/GUION.md#bibliografía). Las cifras de los ataques salen de las publicaciones de los autores; donde no se pudo verificar una cifra en la fuente, se omite (por ejemplo, el coste del ataque de 4,5 rondas de 1999).
