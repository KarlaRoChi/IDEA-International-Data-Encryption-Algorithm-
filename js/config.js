/*
 * Configuración general de la presentación.
 * Cada bloque tiene número, título y color; las portadas, el pie, el índice
 * y el guion se generan a partir de aquí.
 */
window.DECK_CONFIG = {
  title: 'IDEA',
  subtitle: 'International Data Encryption Algorithm',
  course: 'Criptografía · Exposición grupal',
  // Duración objetivo de la exposición, en minutos (sin preguntas): 15–20 min.
  targetMinutes: 18,

  // Integrantes del equipo: se muestran SOLO en la portada.
  // Formato: { name: 'Nombre Apellido', block: 1 }  (block = bloque que expone; opcional)
  team: [],

  // Orden fijo de los cuatro bloques acordado por el equipo. No reordenar.
  presenters: [
    { id: 1, name: 'Bloque 1', block: 'Contexto y fundamentos',        color: 'var(--p1)' },
    { id: 2, name: 'Bloque 2', block: 'Arquitectura y cifrado',        color: 'var(--p2)' },
    { id: 3, name: 'Bloque 3', block: 'Ejemplo práctico y descifrado', color: 'var(--p3)' },
    { id: 4, name: 'Bloque 4', block: 'Criptoanálisis y seguridad',    color: 'var(--p4)' },
  ],
};

// Registro global en el que cada archivo de contenido añade sus diapositivas.
window.SLIDES = [];
