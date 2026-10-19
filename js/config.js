/*
 * Configuración general de la presentación.
 * Para personalizar, cambia aquí los nombres de los expositores; el resto
 * de la presentación (portadas de bloque, pie, índice, guion) se actualiza solo.
 */
window.DECK_CONFIG = {
  title: 'IDEA',
  subtitle: 'International Data Encryption Algorithm',
  course: 'Criptografía · Exposición grupal',
  // Duración objetivo de la exposición, en minutos (sin preguntas).
  targetMinutes: 34,

  // Orden fijo acordado por el equipo. No reordenar.
  presenters: [
    { id: 1, name: 'Persona 1', block: 'Contexto y fundamentos',        color: 'var(--p1)' },
    { id: 2, name: 'Persona 2', block: 'Arquitectura y cifrado',        color: 'var(--p2)' },
    { id: 3, name: 'Persona 3', block: 'Ejemplo práctico y descifrado', color: 'var(--p3)' },
    { id: 4, name: 'Persona 4', block: 'Criptoanálisis y seguridad',    color: 'var(--p4)' },
  ],
};

// Registro global en el que cada archivo de contenido añade sus diapositivas.
window.SLIDES = [];
