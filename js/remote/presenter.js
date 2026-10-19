/*
 * presenter.js — Modo presentador del control remoto.
 *
 * Añade a la presentación:
 *   - Un botón «Control remoto» en la barra superior y un indicador discreto.
 *   - Un panel para «Iniciar sesión de presentación»: código, enlace, QR,
 *     estado de la conexión, dispositivos conectados y «Cerrar sesión».
 *   - La lógica de anfitrión: valida comandos (RemoteProtocol.RemoteHost),
 *     los aplica con DECK.go / controlador de la demo y publica el estado.
 *
 * No modifica las diapositivas ni sus demostraciones: solo usa la API pública
 * del motor (window.DECK) y el evento 'deck:change'.
 */
(function () {
  'use strict';
  const RP = window.RemoteProtocol;
  const RT = window.RemoteTransport;
  const DECK = window.DECK;
  if (!RP || !RT || !DECK) return;

  const cfg = window.REMOTE_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  let transport = null;
  let host = null;
  let heartbeat = null;
  let demoPoll = null;
  let session = null;      // { code, url, expiresAt, mode }
  let status = 'inactivo';
  let remotes = 0;

  /* ------------------------------------------------------------------ */
  /* Interfaz                                                            */
  /* ------------------------------------------------------------------ */
  const btn = document.createElement('button');
  btn.className = 'icon-btn remote-btn';
  btn.id = 'btn-remote';
  btn.title = 'Control remoto (R)';
  btn.setAttribute('aria-label', 'Control remoto');
  btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 6.5h3M12 17.5h.01"/><path d="M3.5 8.5a6 6 0 0 1 0 7M20.5 8.5a6 6 0 0 0 0 7"/></svg>`;
  const right = $('.topbar-right');
  right.insertBefore(btn, right.firstChild);

  const badge = document.createElement('div');
  badge.className = 'remote-badge';
  badge.hidden = true;
  badge.title = 'Control remoto activo';
  document.body.appendChild(badge);

  const panel = document.createElement('div');
  panel.className = 'overlay';
  panel.id = 'remote-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="menu-card remote-card" role="dialog" aria-modal="true" aria-label="Control remoto">
      <div class="menu-head"><h2>Control remoto</h2><button class="icon-btn" data-a="close-panel" aria-label="Cerrar panel">✕</button></div>
      <div class="rp-body"></div>
    </div>`;
  document.body.appendChild(panel);

  let chosenMode = RT.defaultMode();
  const MODE_LABEL = {
    supabase: '<span class="rp-mode net">Internet · Supabase Realtime</span>',
    mqtt: '<span class="rp-mode net">Internet · canal cifrado de extremo a extremo</span>',
    local: '<span class="rp-mode local">Modo ensayo · solo este navegador</span>',
  };
  function modeLabel() { return MODE_LABEL[session ? session.mode : chosenMode]; }

  function renderIdle(error) {
    $('.rp-body', panel).innerHTML = `
      <p class="rp-lead">Tus compañeros podrán cambiar de diapositiva desde su celular o computadora mientras compartes esta pantalla.</p>
      <div class="rp-row">${modeLabel()}</div>
      <p class="rp-note">${chosenMode === 'local'
        ? 'Solo funciona en otras pestañas de este navegador. Sirve para ensayar sin internet.'
        : chosenMode === 'mqtt'
          ? 'Funciona desde cualquier red (datos móviles o Wi-Fi). Los mensajes viajan cifrados con una clave que solo conocen quienes tienen el código.'
          : 'Usa el proyecto de Supabase configurado, con control de acceso en el servidor.'}</p>
      <label class="rp-check"><input type="checkbox" id="rp-local" ${chosenMode === 'local' ? 'checked' : ''}> Modo ensayo (sin internet, solo este navegador)</label>
      <label class="rp-check"><input type="checkbox" id="rp-demo"> Permitir que los controles avancen los pasos de las demostraciones</label>
      ${error ? `<p class="rp-error">${error}</p>` : ''}
      <button class="btn primary rp-start" data-a="start">Iniciar sesión de presentación</button>`;
  }

  function qrSvg(text) {
    if (typeof window.qrcode !== 'function') return '';
    const qr = window.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }

  function renderActive() {
    const code = session.code;
    const exp = session.expiresAt ? new Date(session.expiresAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : null;
    $('.rp-body', panel).innerHTML = `
      <div class="rp-grid">
        <div class="rp-qr" aria-label="Código QR del control remoto">${qrSvg(session.url)}</div>
        <div class="rp-info">
          <div class="rp-row">${modeLabel()} <span class="rp-status" data-s="${status}">${status}</span></div>
          <div class="rp-label">Código de la sala</div>
          <div class="rp-code mono">${code.slice(0, 4)} ${code.slice(4)}</div>
          <div class="rp-label">Enlace para el control remoto</div>
          <div class="rp-link"><input readonly value="${session.url}" aria-label="Enlace del control remoto"><button class="btn" data-a="copy">Copiar</button></div>
          <div class="rp-row rp-stats"><b class="rp-count">${remotes}</b> <span>dispositivo${remotes === 1 ? '' : 's'} conectado${remotes === 1 ? '' : 's'}</span>${exp ? `<span class="muted">· caduca a las ${exp}</span>` : ''}</div>
          <label class="rp-check"><input type="checkbox" id="rp-demo" ${host.allowDemo ? 'checked' : ''}> Permitir pasos de las demostraciones</label>
          <button class="btn rp-stop" data-a="stop">Cerrar sesión</button>
        </div>
      </div>`;
  }

  function updateBadge() {
    badge.hidden = !session;
    btn.classList.toggle('on', !!session);
    if (!session) return;
    badge.dataset.s = status;
    badge.innerHTML = `<i></i>Remoto · ${remotes}`;
    const st = $('.rp-status', panel);
    if (st) { st.dataset.s = status; st.textContent = status; }
    const ct = $('.rp-count', panel);
    if (ct) ct.textContent = remotes;
  }

  /* ------------------------------------------------------------------ */
  /* Controles de la demostración actual, detectados automáticamente     */
  /* Cada botón, pestaña, ejemplo (select) o deslizador de la diapositiva */
  /* se publica con su etiqueta real; el remoto puede usar todos.        */
  /* ------------------------------------------------------------------ */
  const clean = (t) => String(t || '').replace(/\s+/g, ' ').trim();
  // Texto visible con espacios entre elementos («1977 DES…», no «1977DES…»)
  function textOf(el) {
    const parts = [];
    const walk = (n) => n.childNodes.forEach((c) => {
      if (c.nodeType === 3) parts.push(c.textContent);
      else if (c.nodeType === 1 && !c.classList.contains('katex-mathml')) walk(c);
    });
    walk(el);
    return clean(parts.join(' ')).replace(/\s+([,.;:)])/g, '$1');
  }
  function labelOf(el) {
    const text = textOf(el);
    const hint = clean(el.getAttribute('title') || el.getAttribute('aria-label')).replace(/\s*\(.*\)$/, '');
    // Botones de solo un símbolo (⟲, ✕…): se añade su descripción
    const label = text.length <= 2 && hint ? `${text} ${hint}`.trim() : text || hint || '·';
    return label.slice(0, 60);
  }
  function fieldLabel(el) {
    const f = el.closest('label, .field, .slider');
    const span = f && f.querySelector('span');
    return clean(span ? span.textContent : '').slice(0, 40);
  }
  function groupOf(el) {
    if (el.closest('.demo-controls, .ks-buttons, .traj-controls')) return 'Pasos';
    if (el.classList.contains('rail-btn')) return 'Ir a';
    if (el.classList.contains('tab')) return 'Vista';
    if (el.classList.contains('chip')) return 'Ejemplos';
    if (el.classList.contains('tl-ev')) return 'Línea de tiempo';
    if (el.classList.contains('layer')) return 'Capas';
    if (el.classList.contains('att-row')) return 'Ataques';
    if (el.closest('.rviz-top, .lab-top, .bs-controls, .laws-head, .weak-top')) return 'Datos';
    return 'Opciones';
  }
  const isOn = (el) => ['active', 'sel', 'cur', 'on'].some((c) => el.classList.contains(c));
  function demoControls() {
    const slide = document.querySelector('#stage .slide');
    if (!slide) return [];
    const root = slide.querySelector('.body') || slide;
    const out = [];
    root.querySelectorAll('button, select, input[type=range]').forEach((el) => {
      if (el.closest('.slide-foot') || el.getClientRects().length === 0) return;   // oculto
      if (el.tagName === 'BUTTON') {
        out.push({ el, kind: 'b', l: labelOf(el), g: groupOf(el), d: el.disabled, on: isOn(el) });
      } else if (el.tagName === 'SELECT') {
        const g = fieldLabel(el) || 'Opciones';
        [...el.options].forEach((o) => {
          if (o.hidden || o.disabled) return;
          out.push({ el, kind: 'o', value: o.value, l: `${g}: ${clean(o.text)}`.slice(0, 60), g, on: o.selected && el.value === o.value });
        });
      } else {
        // Grupo = nombre del deslizador y su valor actual; botones − y +
        const shown = el.parentElement && el.parentElement.querySelector('b');
        // 10<sup>12</sup> -> «10^12»
        const val = shown ? clean(shown.innerHTML.replace(/<sup>/g, '^').replace(/<[^>]+>/g, '')) : '';
        const g = `${fieldLabel(el) || 'Ajuste'}${val ? ` · ${val}` : ''}`.slice(0, 60);
        out.push({ el, kind: 'r-', l: '− menos', g, d: +el.value <= +el.min });
        out.push({ el, kind: 'r+', l: '+ más', g, d: +el.value >= +el.max });
      }
    });
    return out.slice(0, RP.MAX_ACTIONS);
  }
  const publicActions = (list) => list.map((a) => ({ l: a.l, g: a.g, d: !!a.d, on: !!a.on }));
  function demoStatus() {
    const slide = document.querySelector('#stage .slide');
    const c = slide && slide.querySelector('.body .pos-counter');
    return c ? clean(c.textContent).slice(0, 80) : '';
  }
  function runControl(a) {
    const el = a.el;
    if (a.kind === 'b') el.click();
    else if (a.kind === 'o') { el.value = a.value; el.dispatchEvent(new Event('change', { bubbles: true })); }
    else {
      const step = +el.step || 1;
      const v = Math.min(+el.max, Math.max(+el.min, +el.value + (a.kind === 'r+' ? step : -step)));
      el.value = String(v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Estado publicado                                                    */
  /* ------------------------------------------------------------------ */
  let lastDemoSig = '';
  function meta(withIndex) {
    const s = DECK.slides[DECK.current];
    const blocks = DECK.config.presenters.map((p) => ({ id: p.id, title: p.block }));
    const actions = publicActions(demoControls());
    const status = demoStatus();
    lastDemoSig = JSON.stringify([DECK.current, actions, status]);
    const out = {
      title: (s.menuTitle || s.title || '').slice(0, 200),
      block: s.person || 0,
      pos: s.person ? `${s.posInSection}/${s.sectionSize}` : '',
      demo: actions.length > 0 || !!(DECK.controller && typeof DECK.controller.next === 'function'),
      caps: { reset: !!(DECK.controller && DECK.controller.reset), all: !!(DECK.controller && DECK.controller.all) },
      actions,
      status,
    };
    const st = host.state(out);
    if (withIndex) {
      st.slides = DECK.slides.map((x, i) => ({ i, t: (x.menuTitle || x.title || '').slice(0, 120), b: x.person || 0 }));
      st.blocks = blocks;
    }
    return st;
  }
  const publish = (withIndex = false) => { if (transport && host && !host.closed) transport.send('state', meta(withIndex)); };

  window.addEventListener('deck:change', (e) => {
    if (!host) return;
    host.localChange(e.detail.index);
    publish(false);
  });

  // La demostración cambió (clic local o remoto, ejemplo, reproducción automática…):
  // se publica un estado nuevo solo si cambió algo visible para los remotos.
  function checkDemo() {
    if (!host || host.closed || !host.allowDemo) return;
    const sig = JSON.stringify([DECK.current, publicActions(demoControls()), demoStatus()]);
    if (sig === lastDemoSig) return;
    host.demoChange();
    publish(false);
  }
  let demoTimer = null;
  const soonCheck = () => { clearTimeout(demoTimer); demoTimer = setTimeout(checkDemo, 90); };
  ['click', 'change', 'input', 'keyup'].forEach((ev) => document.getElementById('stage').addEventListener(ev, soonCheck, true));
  document.addEventListener('keydown', soonCheck, true);

  /* ------------------------------------------------------------------ */
  /* Ciclo de vida de la sesión                                          */
  /* ------------------------------------------------------------------ */
  async function start() {
    const allowDemo = !!($('#rp-demo', panel) || {}).checked;
    $('.rp-start', panel).disabled = true;
    $('.rp-start', panel).textContent = 'Creando sala…';
    try {
      transport = RT.createTransport('presenter', chosenMode);
      transport.onStatus((s, detail) => { status = s; updateBadge(); if (s === 'error' && detail) console.warn('Control remoto:', detail); });
      transport.onPresence((n) => { remotes = n; updateBadge(); });
      transport.on('hello', () => publish(true));
      transport.on('reconnected', () => publish(true));
      transport.on('cmd', onCommand);
      host = new RP.RemoteHost({ total: DECK.slides.length, index: DECK.current, allowDemo });
      const r = await transport.host({ ttlMinutes: cfg.roomMinutes || 180 });
      const base = new URL('remote.html', location.href);
      base.hash = `c=${r.code}&m=${RT.MODE_CODES[transport.kind]}`;
      session = { code: r.code, url: base.href, expiresAt: r.expiresAt, mode: transport.kind };
      heartbeat = setInterval(() => publish(true), 10000);
      demoPoll = setInterval(checkDemo, 700);   // reproducción automática y otros cambios sin clic
      publish(true);
      renderActive();
      updateBadge();
    } catch (err) {
      console.error(err);
      await stop(true);
      renderIdle(err.message || String(err));
    }
  }

  async function stop(silent) {
    clearInterval(heartbeat);
    clearInterval(demoPoll);
    if (host) host.closed = true;
    if (transport) {
      try { if (!silent) transport.send('closed', { t: 'CLOSED', v: RP.PROTOCOL }); } catch (e) { /* sin conexión */ }
      await transport.close().catch(() => {});
    }
    transport = null; host = null; session = null; remotes = 0; status = 'inactivo';
    updateBadge();
    renderIdle();
  }

  function onCommand(m) {
    if (!host) return;
    const s = DECK.slides[DECK.current];
    const c0 = DECK.controller;
    const controls = m && m.cmd === 'DEMO_ACTION' ? demoControls() : null;
    const r = host.handle(m, Date.now(), {
      hasDemo: !!(c0 && c0.next), caps: { reset: !!(c0 && c0.reset), all: !!(c0 && c0.all) }, slide: s,
      actions: controls ? publicActions(controls) : null,
    });
    if (!r.ok) { if (r.reason !== 'obsoleto' && r.reason !== 'limite') console.info('Comando remoto rechazado:', r.reason, m && m.cmd); return; }
    if (!r.action) { publish(false); return; }
    if (r.action.type === 'goto') DECK.go(r.action.index, { source: 'remote' });   // dispara deck:change -> publish
    else if (r.action.type === 'demo') {
      const c = DECK.controller;
      if (c && typeof c[r.action.op] === 'function') c[r.action.op]();
      soonCheck();
    } else if (r.action.type === 'demo-action') {
      runControl(controls[r.action.index]);
      soonCheck();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Eventos                                                             */
  /* ------------------------------------------------------------------ */
  function openPanel() { panel.hidden = false; if (!session) renderIdle(); else renderActive(); }
  btn.addEventListener('click', openPanel);
  badge.addEventListener('click', openPanel);
  panel.addEventListener('click', async (e) => {
    if (e.target === panel) { panel.hidden = true; return; }
    const b = e.target.closest('[data-a]');
    if (!b) return;
    if (b.dataset.a === 'close-panel') panel.hidden = true;
    if (b.dataset.a === 'start') start();
    if (b.dataset.a === 'stop') stop(false);
    if (b.dataset.a === 'copy') {
      try { await navigator.clipboard.writeText(session.url); b.textContent = 'Copiado'; }
      catch (err) { $('.rp-link input', panel).select(); }
    }
  });
  panel.addEventListener('change', (e) => {
    if (e.target.id === 'rp-demo' && host) { host.allowDemo = e.target.checked; host.touch(); publish(false); }
    if (e.target.id === 'rp-local' && !session) {
      chosenMode = e.target.checked ? 'local' : RT.defaultMode();
      const demo = !!($('#rp-demo', panel) || {}).checked;
      renderIdle();
      $('#rp-demo', panel).checked = demo;
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; return; }
    const t = e.target;
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) { panel.hidden ? openPanel() : (panel.hidden = true); }
  });

  // API para depuración y pruebas
  window.REMOTE_HOST = { start, stop, get session() { return session; }, get host() { return host; }, get status() { return status; }, get remotes() { return remotes; } };
})();
