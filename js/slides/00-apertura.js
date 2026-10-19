/*
 * Apertura (compartida). No contiene contenido técnico: solo título y reparto.
 */
(function () {
  const C = window.DECK_CONFIG;
  window.SLIDES.push({
    id: 'portada',
    person: 0,
    type: 'raw',
    title: 'Portada',
    minutes: 0.5,
    className: 'title-slide',
    html: String.raw`
      <div class="title-wrap">
        <div class="title-mark" aria-hidden="true">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="44" fill="none" stroke="var(--mul)" stroke-width="6"/><circle cx="60" cy="60" r="12" fill="var(--mul)"/></svg>
          <svg viewBox="0 0 120 120"><rect x="16" y="16" width="88" height="88" rx="10" fill="none" stroke="var(--add)" stroke-width="6"/><path d="M60 34V86M34 60H86" stroke="var(--add)" stroke-width="6"/></svg>
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="44" fill="none" stroke="var(--xor)" stroke-width="6"/><path d="M60 16V104M16 60H104" stroke="var(--xor)" stroke-width="6"/></svg>
        </div>
        <div class="kicker" style="color:var(--muted)">${C.course}</div>
        <h1 class="title-main">IDEA</h1>
        <p class="title-sub">${C.subtitle}</p>
        <p class="title-desc">Un cifrador por bloques construido mezclando tres operaciones algebraicas incompatibles</p>
        <div class="title-team">
          ${C.presenters.map((p) => `<div class="tt" style="--c:${p.color}"><b>${p.id}</b><span>${p.name}</span><small>${p.block}</small></div>`).join('')}
        </div>
      </div>`,
    notes: String.raw`
      <p><b>Quién:</b> abre la Persona 1 (≈ 30 s). No se explica contenido técnico aquí.</p>
      <p class="script">«Buenos días. Vamos a presentar IDEA, el International Data Encryption Algorithm. La exposición tiene cuatro bloques: primero el contexto y los fundamentos matemáticos; después la arquitectura y el cifrado; luego un ejemplo numérico completo y el descifrado; y por último el criptoanálisis y la seguridad. Las demostraciones son interactivas y todos los valores se calculan en vivo.»</p>
      <ul><li>Los tres símbolos de la portada son las tres operaciones de IDEA: ⊙ (violeta), ⊞ (verde) y ⊕ (cian). Se usan esos colores en toda la presentación.</li>
      <li>Antes de empezar: pulsa <b>T</b> para iniciar el cronómetro y <b>F</b> para pantalla completa.</li></ul>`,
  });
})();
