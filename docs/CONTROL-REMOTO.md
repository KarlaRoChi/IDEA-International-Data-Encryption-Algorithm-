# Control remoto colaborativo

Permite que los compañeros manejen la presentación desde su celular o computadora mientras la presentadora comparte su pantalla (Meet, Zoom, Teams…).

- **Presentación:** <https://karlarochi.github.io/IDEA-International-Data-Encryption-Algorithm-/>
- **Control remoto:** <https://karlarochi.github.io/IDEA-International-Data-Encryption-Algorithm-/remote.html> (se abre normalmente con el QR o el enlace de la sala)

**Funciona por internet sin configurar nada:** botón **Control remoto** (tecla `R`) → **«Iniciar sesión de presentación»** → los compañeros escanean el QR o escriben el código.

## Tres modos de conexión

| Modo | Cuándo se usa | Requisitos | Control de acceso |
|---|---|---|---|
| **Internet · canal cifrado** (por defecto) | Siempre que no haya Supabase configurado | Ninguno | El **código** de la sala es la clave: todo viaja cifrado de extremo a extremo |
| **Internet · Supabase Realtime** (opcional) | Si `js/remote-config.js` tiene URL y clave | Proyecto de Supabase (unos 10 min) | Además, el servidor exige el código, limita intentos y cierra la sala (RLS) |
| **Modo ensayo** | Casilla «Modo ensayo» en el panel | Ninguno, sin internet | Solo pestañas del mismo navegador |

### Modo por defecto: MQTT público con cifrado de extremo a extremo

```
 Celular / PC                 broker MQTT público (wss)                PC de la presentadora
 remote.html  ── AES-GCM ──►  tema idea-remote/v1/<hash>  ── AES-GCM ──►  index.html
              ◄─────────────  (solo ve bytes cifrados)    ◄─────────────
```

- Los mensajes viajan por WebSocket seguro (`wss://`) a un servidor MQTT público: HiveMQ y, si no responde, EMQX. Funciona con datos móviles, con cualquier Wi-Fi y detrás de redes corporativas que permitan HTTPS.
- **El servidor no puede leer ni falsificar nada.** Del código de la sala se derivan con PBKDF2-SHA256 (300 000 iteraciones) una clave AES-GCM de 256 bits y el nombre del tema. Cada mensaje se cifra y autentica con esa clave (`js/remote/securechannel.js`). Un mensaje alterado, falso o cifrado con otra clave se descarta.
- El nombre del tema no revela el código. Las 300 000 iteraciones hacen impracticable probar códigos por fuerza bruta durante una exposición.
- No requiere cuentas, claves ni configuración. La dependencia es un servicio público y gratuito sin garantía de disponibilidad: si ninguno responde, el panel lo indica. Para ese caso existen el modo Supabase y el control local con teclado.

### Modo Supabase (opcional)

```
 Celular / PC (remote.html)          Supabase Realtime               PC de la presentadora (index.html)
 ─────────────────────────           (canal privado room:<uuid>)     ───────────────────────────────────
  botón «Siguiente» ── cmd ──────────────►  RLS: ¿es miembro?  ──────►  RemoteHost valida y decide
                                                                         DECK.go(n)  →  evento deck:change
  pantalla del remoto ◄──── state ───────  RLS: ¿es presentador? ◄────  publica estado (versión + 1)
```

- **Por qué Supabase como opción reforzada:** funciona desde un sitio estático (GitHub Pages) solo con la clave pública *anon*, sin servidor propio. Ofrece *Broadcast* (mensajes de baja latencia), *Presence* (cuántos dispositivos hay) y **canales privados autorizados con políticas RLS**, que permiten restringir de verdad quién lee y escribe en cada sala. Firebase Realtime Database también serviría, pero obligaría a modelar los comandos como escrituras en una base de datos y sus reglas no son SQL versionable junto al código.
- **Una sola fuente de verdad:** la computadora de la presentadora. Los remotos solo envían *comandos*. La presentadora los valida, los aplica y publica el *estado* con una versión creciente. Los remotos nunca publican estado, así que no hay bucles de eco.
- **El motor de diapositivas no cambia:** el control remoto usa la API existente (`DECK.go`, `DECK.controller`) y un evento nuevo, `deck:change`. Las diapositivas, animaciones y demostraciones son las mismas. Teclado, ratón y botones locales siguen funcionando igual.

### Protocolo (`js/remote/protocol.js`)

| Mensaje | Quién lo envía | Contenido |
|---|---|---|
| `cmd` | remoto | `{ t:'CMD', v:1, id, from, cmd, base, slide? }`, donde `cmd` ∈ `NEXT`, `PREVIOUS`, `GOTO_SLIDE`, `GO_TO_START`, `GO_TO_END`, `DEMO_NEXT`, `DEMO_PREV`, `DEMO_RESET`, `DEMO_ALL` |
| `hello` | remoto | pide el estado actual (al entrar, al reconectar y al volver a la pestaña) |
| `state` | presentadora | `{ epoch, version, slide, total, title, block, pos, demo, slides?, blocks? }` |
| `closed` | presentadora | la sesión terminó |

Reglas de la presentadora (`RemoteHost`):

| Situación | Comportamiento |
|---|---|
| Comando mal formado o desconocido, diapositiva inexistente | Se rechaza |
| Mismo `id` repetido | Se aplica una sola vez |
| Pulsaciones demasiado rápidas | Límite de 4 comandos por segundo por dispositivo (con ráfaga de 4) y una pausa mínima global de 150 ms entre saltos remotos |
| Dos personas pulsan «Siguiente» a la vez | Los comandos **relativos** llevan la versión que vio el remoto. Si la presentación ya cambió, el segundo se rechaza como obsoleto y solo se avanza una diapositiva |
| Dos personas eligen diapositivas distintas en la lista | Los comandos **absolutos** se aplican en orden de llegada: gana el último |
| Mensajes fuera de orden, repetidos o reconexión | El remoto solo acepta estados con una versión mayor (`StateTracker`), así que un estado viejo nunca hace retroceder lo que muestra. La presentadora es la única que cambia la diapositiva |
| Desconexión | El remoto reintenta (Supabase reconecta solo), pide el estado con `hello` y avisa «sin presentador» si no recibe nada en 25 s (hay un latido cada 10 s) |
| Sesión cerrada | La presentadora deja de aceptar comandos, avisa con `closed` y cierra la sala en el servidor |

**Pasos de las demostraciones:** son opcionales. La presentadora los activa en el panel («Permitir pasos de las demostraciones»). Entonces, en las diapositivas con demo, el remoto muestra «⟲ · ◀ Paso · Paso ▶ · Toda la ronda ⏩» (⟲ y ⏩ se activan solo si la demo los admite). Esos botones ejecutan los mismos `next/prev` que las teclas `.` y `,` y **nunca cambian de diapositiva**.

## Configurar Supabase (opcional, una vez, unos 10 minutos)

No es necesario para usar el control remoto: solo añade control de acceso en el servidor.

1. Crea una cuenta y un proyecto gratuito en <https://supabase.com>. Esto lo debe hacer la dueña del proyecto; no se puede automatizar desde aquí.
2. **Authentication → Sign In / Providers →** activa **«Allow anonymous sign-ins»**. Cada dispositivo obtiene una identidad anónima, sin cuentas ni contraseñas.
3. **SQL Editor → New query →** pega el contenido de [`supabase/setup.sql`](../supabase/setup.sql) y ejecútalo.
4. **Realtime → Settings →** desactiva **«Allow public access»**. Así solo funcionan los canales privados, protegidos por las políticas del paso 3.
5. **Project Settings → API:** copia la **Project URL** y la clave **anon / publishable**.
6. Pégalas en [`js/remote-config.js`](../js/remote-config.js):

   ```js
   window.REMOTE_CONFIG = {
     supabaseUrl: 'https://TU-PROYECTO.supabase.co',
     supabaseAnonKey: 'TU-CLAVE-ANON-PUBLICA',
     libraryPath: 'vendor/supabase/supabase.min.js',
     roomMinutes: 180,
   };
   ```

7. Sube el cambio a `main` (GitHub Pages lo publica solo).

**Variables necesarias:** solo esas dos, y ambas son públicas por diseño. **Nunca** pongas la clave `service_role` ni ninguna otra secreta en el código. Si `js/remote-config.js` queda vacío, el control remoto usa el modo por defecto (internet con canal cifrado).

## Usarlo durante la exposición

1. La presentadora abre la presentación y pulsa el botón **Control remoto** (icono de teléfono, arriba a la derecha) o la tecla **R**.
2. Pulsa **«Iniciar sesión de presentación»**. Aparecen el **código QR**, el **enlace**, el **código de 8 caracteres**, el estado de la conexión y el número de dispositivos conectados.
3. Cada compañero escanea el QR, abre el enlace o entra en `remote.html` y escribe el código.
4. Cuando termina la exposición: **«Cerrar sesión»**. Los remotos ven «Sesión terminada» y la sala queda cerrada en el servidor.

Abajo a la derecha, la presentación muestra un indicador pequeño («Remoto · 3») que no tapa las diapositivas. Si se recarga la presentación, hay que iniciar una sesión nueva.

## Seguridad: qué protege y qué no

Protecciones implementadas:

- Sala con UUID aleatorio, código de 8 caracteres (≈ 40 bits) del que solo se guarda el hash SHA-256, y caducidad (por defecto 3 h, máximo 6 h).
- Para entrar hace falta el código: `join_remote_room` registra los intentos fallidos y bloquea 10 minutos tras 8 fallos. Máximo 12 dispositivos por sala y 3 salas abiertas por usuario.
- Las tablas no son accesibles desde el cliente (RLS sin políticas y permisos revocados). Todo pasa por funciones con comprobaciones explícitas.
- Las políticas de `realtime.messages` solo permiten leer y escribir en `room:<uuid>` a los miembros de una sala abierta y no caducada. Solo la presentadora puede emitir `state` y `closed`, y los remotos solo `cmd` y `hello`.
- Además, la presentadora valida cada comando (forma, rango, duplicados y frecuencia). El enlace lleva el código en el fragmento `#`, que el navegador no envía al servidor de GitHub Pages.

Límites honestos:

- Quien tenga el enlace o el código puede controlar la presentación hasta que se cierre la sesión: no lo publiques en el chat general de la clase.
- Las sesiones anónimas se pueden recrear, así que el límite de intentos es por sesión anónima, no por persona. Supabase limita además la creación de sesiones anónimas por IP.
- El SQL y las políticas se probaron en PostgreSQL real con una simulación mínima de Supabase (`tools/test-supabase-sql.mjs`, 27 de 27 pruebas). **No se han probado contra un proyecto Supabase real**: confirma que funcionan siguiendo los pasos de prueba de [docs/PRUEBAS.md](PRUEBAS.md#5-control-remoto).
