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
          ${C.presenters.map((p) => `<div class="tt" style="--c:${p.color}"><b>${p.id}</b><span>${p.block}</span></div>`).join('')}
        </div>
      </div>`,
    mount: (root) => {
      // Columnas de palabras hexadecimales que caen despacio (decorativo, al fondo)
      let s = 0x1D3A;
      const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s; };
      const rain = document.createElement('div');
      rain.className = 'hex-rain';
      rain.setAttribute('aria-hidden', 'true');
      for (let c = 0; c < 22; c++) {
        const col = document.createElement('span');
        col.textContent = Array.from({ length: 14 }, () => (rnd() & 0xffff).toString(16).toUpperCase().padStart(4, '0')).join(' ');
        col.style.left = `${4 + c * 4.5}%`;
        col.style.animationDuration = `${18 + (rnd() % 14)}s`;
        col.style.animationDelay = `-${rnd() % 18}s`;
        rain.appendChild(col);
      }
      root.prepend(rain);
      return {};
    },
    notes: String.raw`
      <p><b>Quién:</b> la abre quien expone el bloque 1 (≈ 30 s). No se explica contenido técnico aquí.</p>
      <p class="script">«Buenos días. Vamos a presentar IDEA, el International Data Encryption Algorithm. La exposición tiene cuatro bloques: primero el contexto y los fundamentos matemáticos; después la arquitectura y el cifrado; luego un ejemplo numérico completo y el descifrado; y por último el criptoanálisis y la seguridad. Las demostraciones son interactivas y todos los valores se calculan en vivo.»</p>
      <ul><li>Los tres símbolos de la portada son las tres operaciones de IDEA: ⊙ (violeta), ⊞ (verde) y ⊕ (cian). Se usan esos colores en toda la presentación.</li>
      <li>Antes de empezar: pulsa <b>T</b> para iniciar el cronómetro y <b>F</b> para pantalla completa.</li></ul>`,
  });
})();
