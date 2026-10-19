/*
 * Configuración PÚBLICA del control remoto.
 *
 * La URL del proyecto y la clave «anon / publishable» de Supabase están
 * pensadas para el navegador: son públicas. La seguridad la dan las políticas
 * de supabase/setup.sql (canales privados + RLS) y el código de cada sala.
 * NUNCA pongas aquí la clave «service_role» ni ninguna otra clave secreta.
 *
 * Si se dejan vacías, el control remoto funciona igualmente por internet con
 * un servidor MQTT público y cifrado de extremo a extremo (sin cuentas).
 * Supabase es opcional: añade control de acceso en el servidor.
 * Instrucciones completas: docs/CONTROL-REMOTO.md
 */
window.REMOTE_CONFIG = {
  supabaseUrl: '',        // p. ej. 'https://abcdefghijklmnop.supabase.co'
  supabaseAnonKey: '',    // clave pública «anon» (o «publishable») del proyecto
  libraryPath: 'vendor/supabase/supabase.min.js',
  roomMinutes: 180,       // duración máxima de una sala (el servidor la limita a 10–360)

  // Modo sin configuración: servidores MQTT públicos por WebSocket seguro (se
  // prueba el siguiente si uno no responde). Los mensajes van cifrados con
  // AES-GCM y una clave derivada del código de la sala.
  mqttBrokers: [
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://broker.emqx.io:8084/mqtt',
  ],
  mqttLibraryPath: 'vendor/mqtt/mqtt.min.js',
};
