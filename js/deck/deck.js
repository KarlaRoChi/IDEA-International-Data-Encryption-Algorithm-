/*
 * deck.js — Motor de la presentación.
 *
 * Responsabilidades: renderizar diapositivas, escalar el escenario 16:9,
 * navegación (botones, teclado, índice, saltos por sección, URL #n),
 * pantalla completa, progreso, notas y vista del presentador, cronómetro.
 *
 * Separación de controles:
 *   - Presentación:  ← → PgUp PgDn Inicio Fin 1-4 M F N P T
 *   - Demostraciones: sus propios botones, y las teclas "." y "," que se
 *     envían al controlador de la demo activa (nunca cambian de diapositiva).
 */
(function () {
  'use strict';

  const cfg = window.DECK_CONFIG;
  const slides = window.SLIDES;
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const app = $('app');

  const presenters = cfg.presenters;
  const personOf = (s) => presenters.find((p) => p.id === s.person);

  // Índices por persona para el progreso de cada sección
  const bySection = {};
  slides.forEach((s, i) => {
    s.index = i;
    const k = s.person || 0;
    (bySection[k] = bySection[k] || []).push(i);
  });
  slides.forEach((s) => {
    const list = bySection[s.person || 0];
    s.posInSection = list.indexOf(s.index) + 1;
    s.sectionSize = list.length;
  });

  let current = -1;
  let controller = null;       // controlador de la demo de la diapositiva activa
  let presenterWin = null;

  /* ------------------------------------------------------------------ */
  /* Escalado del escenario                                              */
  /* ------------------------------------------------------------------ */
  function fit() {
    const vp = $('viewport').getBoundingClientRect();
    const margin = app.classList.contains('is-fullscreen') ? 0 : 24;
    const s = Math.min((vp.width - margin) / 1600, (vp.height - margin) / 900);
    stage.style.transform = `translate(-50%, -50%) scale(${Math.max(s, 0.1)})`;
  }
  window.addEventListener('resize', fit);

  /* ------------------------------------------------------------------ */
  /* Construcción de una diapositiva                                     */
  /* ------------------------------------------------------------------ */
  function refsHtml(s) {
    if (!s.refs || !s.refs.length || !window.REFS) return '';
    const refs = s.refs.map((id) => window.REFS.byId[id] || (console.warn('Referencia desconocida:', id), null)).filter(Boolean);
    const esc = (t) => t.replace(/"/g, '&quot;');
    const MAX = 3;
    const items = refs.slice(0, MAX).map((r) => `<a href="${r.url}" target="_blank" rel="noopener" title="${esc(r.full)}">[${r.n}] ${r.short}</a>`);
    // Si hay muchas fuentes, el pie muestra solo los números de las demás
    const rest = refs.slice(MAX).map((r) => `<a href="${r.url}" target="_blank" rel="noopener" title="${esc(r.full)}">[${r.n}]</a>`);
    return `<div class="refs">${items.join(' · ')}${rest.length ? ' · ' + rest.join(' ') : ''}</div>`;
  }

  function footHtml(s) {
    const p = personOf(s);
    const who = p
      ? `<div class="who"><span class="badge">${p.id}</span>${p.name} · ${p.block}</div>
         <div class="pips">${Array.from({ length: s.sectionSize }, (_, i) => `<i class="${i < s.posInSection ? 'on' : ''}"></i>`).join('')}</div>`
      : `<div class="who">${cfg.title} · ${cfg.subtitle}</div>`;
    return `<footer class="slide-foot">${who}${refsHtml(s)}<span class="num">${s.index + 1}/${slides.length}</span></footer>`;
  }

  function coverHtml(s) {
    const p = personOf(s);
    return `
      <div class="block-num">Bloque ${p.id} de ${presenters.length}</div>
      <h1>${p.block}</h1>
      <div class="presenter">Expone: <strong>${p.name}</strong></div>
      <div class="agenda">${(s.agenda || []).map((a) => `<span>${a}</span>`).join('')}</div>
      <div class="duration">≈ ${blockMinutes(p.id).toFixed(1).replace('.', ',')} min · ${bySection[p.id].length} diapositivas</div>`;
  }

  function handoffHtml(s) {
    const next = presenters.find((p) => p.id === s.next);
    const nextBox = next
      ? `<div class="next" style="--nc:${next.color}">
           <div class="label">A continuación · Bloque ${next.id}</div>
           <div class="name">${next.name}</div>
           <div>${next.block}</div>
           ${s.teaser ? `<p class="small" style="margin-top:16px">${s.teaser}</p>` : ''}
         </div>`
      : `<div class="next" style="--nc:var(--text-2)">
           <div class="label">A continuación</div>
           <div class="name">${s.nextLabel || 'Preguntas'}</div>
           ${s.teaser ? `<p class="small" style="margin-top:16px">${s.teaser}</p>` : ''}
         </div>`;
    return `<div class="handoff"><div>${s.html}</div>${nextBox}</div>`;
  }

  function build(s) {
    const el = document.createElement('section');
    const p = personOf(s);
    el.className = `slide ${s.type === 'cover' ? 'cover' : ''} ${s.className || ''}`;
    el.style.setProperty('--pc', p ? p.color : 'var(--text-2)');
    el.setAttribute('aria-label', s.title);
    let inner;
    if (s.type === 'cover') inner = coverHtml(s);
    else if (s.type === 'raw') inner = s.html;
    else {
      const kicker = s.kicker || (p ? `${p.name} · ${p.block}` : '');
      const body = s.type === 'handoff' ? handoffHtml(s) : s.html;
      inner = `${kicker ? `<div class="kicker">${kicker}</div>` : ''}<h1>${s.title}</h1><div class="body">${body}</div>`;
    }
    el.innerHTML = inner + footHtml(s);
    return el;
  }

  function renderMath(root) {
    if (typeof window.renderMathInElement !== 'function') return;
    window.renderMathInElement(root, {
      delimiters: [
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false,
    });
  }
  window.DECK_renderMath = renderMath;

  /* ------------------------------------------------------------------ */
  /* Navegación                                                          */
  /* ------------------------------------------------------------------ */
  function go(i, opts = {}) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === current && !opts.force) return;
    const dir = i < current ? 'back' : 'fwd';
    if (controller && controller.destroy) { try { controller.destroy(); } catch (e) { console.error(e); } }
    controller = null;

    const s = slides[i];
    const el = build(s);
    if (current !== -1) el.classList.add('entering');
    if (dir === 'back') el.classList.add('back');
    stage.replaceChildren(el);
    renderMath(el);
    if (typeof s.mount === 'function') {
      try { controller = s.mount(el.querySelector('.body') || el) || null; } catch (e) { console.error('Error al montar la demo', e); }
    }
    current = i;
    if (!opts.noHash) history.replaceState(null, '', `#${i + 1}`);
    updateChrome();
  }
  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  function blockMinutes(pid) {
    return (bySection[pid] || []).reduce((a, i) => a + (slides[i].minutes || 0), 0);
  }

  function updateChrome() {
    const s = slides[current];
    const p = personOf(s);
    $('section-indicator').innerHTML = p
      ? `<span class="dot" style="background:${p.color}"></span><b>${p.name}</b><span>· ${p.block}</span><span class="muted">· ${s.posInSection}/${s.sectionSize}</span>`
      : `<span class="dot" style="background:var(--text-2)"></span><b>${cfg.title}</b><span>· ${s.title}</span>`;
    $('slide-counter').textContent = `${current + 1} / ${slides.length}`;
    $('btn-prev').disabled = current === 0;
    $('btn-next').disabled = current === slides.length - 1;

    document.querySelectorAll('#section-jump button').forEach((b) => b.classList.toggle('active', +b.dataset.p === s.person));
    // Progreso por segmentos de sección
    document.querySelectorAll('#progress .seg').forEach((seg) => {
      const list = bySection[seg.dataset.k];
      const done = list.filter((idx) => idx <= current).length;
      seg.querySelector('span').style.width = `${(100 * done) / list.length}%`;
    });
    document.querySelectorAll('#menu-grid li button').forEach((b) => b.classList.toggle('current', +b.dataset.i === current));
    updateNotes();
  }

  /* ------------------------------------------------------------------ */
  /* Barra superior, progreso e índice                                   */
  /* ------------------------------------------------------------------ */
  function buildChrome() {
    const jump = $('section-jump');
    presenters.forEach((p) => {
      const b = document.createElement('button');
      b.dataset.p = p.id;
      b.style.setProperty('--c', p.color);
      b.title = `${p.name}: ${p.block} (tecla ${p.id})`;
      b.innerHTML = `<i style="background:${p.color}"></i>${p.id}<span class="lbl"> · ${p.block.split(' ')[0]}</span>`;
      b.addEventListener('click', () => goSection(p.id));
      jump.appendChild(b);
    });

    const prog = $('progress');
    // Un segmento por grupo contiguo (apertura, 4 bloques, cierre)
    const groups = [];
    slides.forEach((s, i) => {
      const k = s.person || 0;
      const last = groups[groups.length - 1];
      if (last && last.k === k) last.list.push(i); else groups.push({ k, list: [i] });
    });
    groups.forEach((g, gi) => {
      const key = `g${gi}`;
      bySection[key] = g.list;
      const seg = document.createElement('div');
      seg.className = 'seg';
      seg.dataset.k = key;
      seg.style.flex = g.list.length;
      const p = presenters.find((x) => x.id === g.k);
      seg.style.setProperty('--c', p ? p.color : 'var(--text-2)');
      seg.innerHTML = '<span></span>';
      prog.appendChild(seg);
    });

    const grid = $('menu-grid');
    const sections = [{ id: 0, name: 'Apertura y cierre', block: 'Compartidas', color: 'var(--text-2)' }, ...presenters];
    sections.forEach((p) => {
      const list = bySection[p.id];
      if (!list) return;
      const sec = document.createElement('section');
      sec.className = 'menu-section';
      sec.style.setProperty('--c', p.color);
      const mins = list.reduce((a, i) => a + (slides[i].minutes || 0), 0);
      sec.innerHTML = `<header><b>${p.id ? 'Bloque ' + p.id : 'General'}</b><span>${mins.toFixed(1).replace('.', ',')} min</span></header>
        <div class="block-name">${p.id ? p.name + ' · ' + p.block : p.name}</div>
        <ol>${list.map((i) => `<li><button data-i="${i}"><span class="n">${i + 1}</span>${slides[i].menuTitle || slides[i].title}<span class="m">${(slides[i].minutes || 0).toFixed(1).replace('.', ',')}′</span></button></li>`).join('')}</ol>`;
      grid.appendChild(sec);
    });
    grid.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (b) { go(+b.dataset.i); closeOverlays(); }
    });
  }

  function goSection(pid) {
    const list = bySection[pid];
    if (list) go(list[0]);
  }

  /* ------------------------------------------------------------------ */
  /* Paneles y pantalla completa                                         */
  /* ------------------------------------------------------------------ */
  function toggleOverlay(id) {
    const el = $(id);
    const open = el.hidden;
    closeOverlays();
    el.hidden = !open;
    if (open) { const f = el.querySelector('.current') || el.querySelector('button'); if (f) f.focus(); }
  }
  function closeOverlays() { $('menu').hidden = true; $('help').hidden = true; }
  ['menu', 'help'].forEach((id) => $(id).addEventListener('click', (e) => { if (e.target.id === id) closeOverlays(); }));

  function toggleNotes() {
    const panel = $('notes-panel');
    panel.hidden = !panel.hidden;
    $('btn-notes').classList.toggle('on', !panel.hidden);
    updateNotes();
  }
  function notesMeta(s) {
    const p = personOf(s);
    return `${p ? p.name : 'General'} · ${(s.minutes || 0).toFixed(1).replace('.', ',')} min`;
  }
  function updateNotes() {
    const s = slides[current];
    if (!$('notes-panel').hidden) {
      $('notes-meta').textContent = notesMeta(s);
      $('notes-body').innerHTML = s.notes || '<p class="muted">Sin notas.</p>';
      renderMath($('notes-body'));
    }
    updatePresenter();
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (e) { console.warn('Pantalla completa no disponible', e); }
  }
  let hideTimer = null;
  function pokeChrome() {
    app.classList.remove('chrome-hidden');
    clearTimeout(hideTimer);
    if (app.classList.contains('is-fullscreen')) hideTimer = setTimeout(() => app.classList.add('chrome-hidden'), 2200);
  }
  document.addEventListener('fullscreenchange', () => {
    const fs = !!document.fullscreenElement;
    app.classList.toggle('is-fullscreen', fs);
    $('btn-fullscreen').classList.toggle('on', fs);
    pokeChrome();
    requestAnimationFrame(fit);
  });
  document.addEventListener('mousemove', pokeChrome);

  /* ------------------------------------------------------------------ */
  /* Cronómetro                                                          */
  /* ------------------------------------------------------------------ */
  const timer = { running: false, start: 0, acc: 0, slideStart: Date.now() };
  const elapsed = () => timer.acc + (timer.running ? Date.now() - timer.start : 0);
  const mmss = (ms) => { const t = Math.floor(ms / 1000); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
  function toggleTimer() {
    if (timer.running) { timer.acc += Date.now() - timer.start; timer.running = false; }
    else { timer.start = Date.now(); timer.running = true; }
    $('clock').classList.toggle('running', timer.running);
  }
  setInterval(() => { $('clock').textContent = mmss(elapsed()); updatePresenterClock(); }, 500);

  /* ------------------------------------------------------------------ */
  /* Vista del presentador (ventana aparte, para un segundo monitor)     */
  /* ------------------------------------------------------------------ */
  function openPresenter() {
    if (presenterWin && !presenterWin.closed) { presenterWin.focus(); return; }
    presenterWin = window.open('', 'idea-presenter', 'width=1100,height=760');
    if (!presenterWin) { alert('El navegador bloqueó la ventana emergente. Permite ventanas emergentes para este sitio o usa la tecla N.'); return; }
    const d = presenterWin.document;
    d.open();
    d.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Presentador · IDEA</title>
      <link rel="stylesheet" href="${new URL('vendor/katex/katex.min.css', location.href)}">
      <style>
        body{margin:0;background:#070d1a;color:#e8eef9;font:16px/1.55 Inter,Segoe UI,system-ui,sans-serif;display:grid;grid-template-rows:auto 1fr auto;height:100vh}
        header{display:flex;gap:18px;align-items:center;padding:14px 20px;border-bottom:1px solid #22314f}
        header .who{display:flex;gap:10px;align-items:center;font-weight:600}
        header .dot{width:12px;height:12px;border-radius:50%}
        .clocks{margin-left:auto;display:flex;gap:18px;font-family:JetBrains Mono,Consolas,monospace}
        .clocks div{display:flex;flex-direction:column;align-items:flex-end}
        .clocks small{color:#7f90ae;font-size:11px;font-family:Inter,sans-serif;text-transform:uppercase;letter-spacing:.08em}
        .clocks b{font-size:22px}
        .over{color:#f87171}
        main{overflow:auto;padding:18px 24px}
        h1{font-size:26px;margin:0 0 4px} .meta{color:#7f90ae;margin-bottom:14px}
        .notes{font-size:19px;line-height:1.6;color:#d6dff0;max-width:900px}
        .notes .script{border-left:3px solid #22314f;padding-left:14px;font-style:italic;color:#fff}
        footer{display:flex;gap:12px;align-items:center;padding:12px 20px;border-top:1px solid #22314f;color:#b6c3da}
        button{background:#14213b;color:#e8eef9;border:1px solid #22314f;border-radius:8px;padding:8px 16px;font:inherit;cursor:pointer}
        .next{margin-left:auto}
      </style></head><body>
      <header><div class="who"><span class="dot" id="dot"></span><span id="who"></span></div>
        <div class="clocks"><div><small>Diapositiva</small><b id="c-slide">00:00</b></div><div><small>Bloque / objetivo</small><b id="c-block">–</b></div><div><small>Total</small><b id="c-total">00:00</b></div></div></header>
      <main><h1 id="title"></h1><div class="meta" id="meta"></div><div class="notes" id="notes"></div></main>
      <footer><button id="b-prev">← Anterior</button><button id="b-next">Siguiente →</button><button id="b-timer">Iniciar/pausar cronómetro</button><span class="next" id="next"></span></footer>
      </body></html>`);
    d.close();
    d.getElementById('b-prev').onclick = prev;
    d.getElementById('b-next').onclick = next;
    d.getElementById('b-timer').onclick = toggleTimer;
    presenterWin.addEventListener('keydown', onKey);
    updatePresenter();
  }

  const blockStart = {};
  function updatePresenter() {
    timer.slideStart = Date.now();
    const s = slides[current];
    if (s.person && blockStart[s.person] == null) blockStart[s.person] = elapsed();
    if (!presenterWin || presenterWin.closed) return;
    const d = presenterWin.document;
    const p = personOf(s);
    d.getElementById('dot').style.background = p ? getComputedStyle(document.documentElement).getPropertyValue(`--p${p.id}`) : '#b6c3da';
    d.getElementById('who').textContent = p ? `${p.name} · ${p.block} (${s.posInSection}/${s.sectionSize})` : 'General';
    d.getElementById('title').textContent = `${current + 1}. ${s.title}`;
    d.getElementById('meta').textContent = `Tiempo previsto: ${(s.minutes || 0).toFixed(1).replace('.', ',')} min`;
    d.getElementById('notes').innerHTML = s.notes || '<p>Sin notas.</p>';
    renderMath(d.getElementById('notes'));
    const n = slides[current + 1];
    d.getElementById('next').textContent = n ? `Siguiente: ${n.title}` : 'Última diapositiva';
    updatePresenterClock();
  }
  function updatePresenterClock() {
    if (!presenterWin || presenterWin.closed) return;
    const d = presenterWin.document;
    const s = slides[current];
    d.getElementById('c-total').textContent = mmss(elapsed());
    d.getElementById('c-slide').textContent = mmss(Date.now() - timer.slideStart);
    const cb = d.getElementById('c-block');
    if (s.person) {
      const used = elapsed() - (blockStart[s.person] || 0);
      const budget = blockMinutes(s.person) * 60000;
      cb.textContent = `${mmss(used)} / ${mmss(budget)}`;
      cb.classList.toggle('over', used > budget);
    } else cb.textContent = '–';
  }

  /* ------------------------------------------------------------------ */
  /* Teclado                                                             */
  /* ------------------------------------------------------------------ */
  function isTyping(e) {
    const t = e.target;
    return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  }
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTyping(e)) { if (e.key === 'Escape') e.target.blur(); return; }
    const k = e.key;
    const overlayOpen = !$('menu').hidden || !$('help').hidden;
    if (k === 'Escape') { if (overlayOpen) { closeOverlays(); e.preventDefault(); } return; }
    if (overlayOpen && k !== 'm' && k !== 'M' && k !== '?') return;

    switch (k) {
      case 'ArrowRight': case 'PageDown': next(); break;
      case 'ArrowLeft': case 'PageUp': prev(); break;
      case 'Home': go(0); break;
      case 'End': go(slides.length - 1); break;
      case '1': case '2': case '3': case '4': goSection(+k); break;
      case 'm': case 'M': toggleOverlay('menu'); break;
      case '?': toggleOverlay('help'); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'n': case 'N': toggleNotes(); break;
      case 'p': case 'P': openPresenter(); break;
      case 't': case 'T': toggleTimer(); break;
      // Teclas exclusivas de las demostraciones
      case '.': if (controller && controller.next) controller.next(); break;
      case ',': if (controller && controller.prev) controller.prev(); break;
      default: return;
    }
    e.preventDefault();
  }
  document.addEventListener('keydown', onKey);

  /* ------------------------------------------------------------------ */
  /* Botones                                                             */
  /* ------------------------------------------------------------------ */
  $('btn-prev').addEventListener('click', prev);
  $('btn-next').addEventListener('click', next);
  $('btn-menu').addEventListener('click', () => toggleOverlay('menu'));
  $('btn-menu-close').addEventListener('click', closeOverlays);
  $('btn-help').addEventListener('click', () => toggleOverlay('help'));
  $('btn-help-close').addEventListener('click', closeOverlays);
  $('btn-notes').addEventListener('click', toggleNotes);
  $('btn-notes-close').addEventListener('click', toggleNotes);
  $('btn-presenter').addEventListener('click', openPresenter);
  $('btn-fullscreen').addEventListener('click', toggleFullscreen);
  $('clock').addEventListener('click', toggleTimer);
  // Evita que un clic deje el foco en botones de navegación (el espacio/Enter no deben repetirlos)
  document.querySelectorAll('.nav-btn, .topbar .icon-btn').forEach((b) => b.addEventListener('mouseup', () => b.blur()));

  window.addEventListener('hashchange', () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (!Number.isNaN(n)) go(n - 1, { noHash: true });
  });

  /* ------------------------------------------------------------------ */
  /* Inicio                                                              */
  /* ------------------------------------------------------------------ */
  // Aviso visible si algún bloque no se cargó (p. ej., un archivo .js falló por la red)
  const missing = presenters.filter((p) => !bySection[p.id]);
  if (missing.length) {
    const warn = document.createElement('div');
    warn.className = 'load-warning';
    warn.textContent = `No se cargaron las diapositivas de: ${missing.map((p) => p.name).join(', ')}. Recarga la página (Ctrl+F5).`;
    document.body.appendChild(warn);
    console.error(warn.textContent);
  }

  buildChrome();
  fit();
  const start = parseInt(location.hash.slice(1), 10);
  go(Number.isNaN(start) ? 0 : start - 1, { force: true });

  // API mínima para depuración y pruebas automáticas
  window.DECK = { go, next, prev, goSection, get current() { return current; }, slides, blockMinutes, get controller() { return controller; } };
})();
