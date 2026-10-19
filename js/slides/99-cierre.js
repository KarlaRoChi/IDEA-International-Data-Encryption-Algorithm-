/*
 * Cierre (compartido): preguntas y bibliografía completa con enlaces.
 */
(function () {
  window.SLIDES.push({
    id: 'bibliografia',
    person: 0,
    title: 'Preguntas · Bibliografía',
    kicker: 'Gracias',
    minutes: 0.5,
    html: '<div class="biblio"></div>',
    mount: (root) => {
      const list = window.REFS.list;
      root.querySelector('.biblio').innerHTML = `<ol>${list.map((r) =>
        `<li value="${r.n}"><span>${r.full}</span> <a href="${r.url}" target="_blank" rel="noopener">${r.url.replace(/^https?:\/\//, '')}</a></li>`).join('')}</ol>`;
      return {};
    },
    notes: String.raw`
      <p>Diapositiva compartida para el turno de preguntas. Cada bloque responde las preguntas de su tema.</p>
      <ul><li>La lista se puede desplazar con la rueda del ratón.</li>
      <li>Cada cita del pie de las diapositivas usa el mismo número que esta lista.</li></ul>`,
  });
})();
