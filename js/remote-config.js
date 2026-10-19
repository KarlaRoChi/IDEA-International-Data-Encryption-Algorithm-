/*
 * Configuración PÚBLICA del control remoto.
 *
 * La URL del proyecto y la clave «anon / publishable» de Supabase están
 * pensadas para el navegador: son públicas. La seguridad la dan las políticas
 * de supabase/setup.sql (canales privados + RLS) y el código de cada sala.
 * NUNCA pongas aquí la clave «service_role» ni ninguna otra clave secreta.
 *
 * Si se dejan vacías, el control remoto funciona en «modo ensayo»: solo entre
 * pestañas del mismo navegador (útil para practicar, no para la exposición).
 * Instrucciones completas: docs/CONTROL-REMOTO.md
 */
window.REMOTE_CONFIG = {
  supabaseUrl: '',        // p. ej. 'https://abcdefghijklmnop.supabase.co'
  supabaseAnonKey: '',    // clave pública «anon» (o «publishable») del proyecto
  libraryPath: 'vendor/supabase/supabase.min.js',
  roomMinutes: 180,       // duración máxima de una sala (el servidor la limita a 10–360)
};
