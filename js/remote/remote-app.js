/*
 * remote-app.js — Interfaz del control remoto (celular o computadora).
 * Envía comandos y muestra el estado que publica el presentador.
 * Nunca publica estado propio: así no hay bucles ni conflictos.
 */
(function () {
  'use strict';
  const RP = window.RemoteProtocol;
  const RT = window.RemoteTransport;
  const $ = (id) => document.getElementById(id);

  const me = sessionStorage.getItem('idea-remote-id') || RP.randomId(8);
  sessionStorage.setItem('idea-remote-id', me);

  const escapeHtml = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tracker = new RP.StateTracker();
  let transport = null;
  let slides = [], blocks = [];
  let waiting = false, waitTimer = null;
  let currentCode = null;
  let lastStateAt = 0;

  const params = new URLSearchParams(location.hash.slice(1));
  const mode = RT.modeFromCode(params.get('m'));
  $('mode-hint').textContent = mode === 'local'
    ? 'Modo ensayo: solo funciona en otra pestaña del mismo navegador que la presentación.'
    : '';

  function setConn(s) { $('conn').dataset.s = s; $('conn').textContent = s; }
  function show(view) { ['join', 'main', 'ended'].forEach((v) => { $(v).hidden = v !== view; }); }

  /* ------------------------------ Conexión ------------------------------ */
  async function connect(code) {
    $('join-error').textContent = '';
    setConn('conectando');
    try {
      transport = RT.createTransport('remote', mode);
      transport.onStatus((s, detail) => {
        setConn(s);
        if (s === 'conectado') hello();
        if (s === 'error') $('join-error').textContent = detail || 'Error de conexión.';
      });
      transport.on('reconnected', hello);
      transport.on('state', onState);
      transport.on('closed', () => end());
      await transport.join(code);
      currentCode = code;
      lastStateAt = Date.now();
      sessionStorage.setItem('idea-remote-code', code);
      history.replaceState(null, '', location.pathname + location.search + `#c=${code}&m=${RT.MODE_CODES[mode]}`);
      show('main');
      hello();
    } catch (err) {
      console.error(err);
      setConn('desconectado');
      $('join-error').textContent = err.message || String(err);
      show('join');
      transport = null;
    }
  }
  // Pide el estado actual (al entrar, al reconectar y al volver a la pestaña)
  function hello() { if (transport) transport.send('hello', { t: 'HELLO', v: RP.PROTOCOL, from: me }); }

  async function end(byUser) {
    if (transport) { const t = transport; transport = null; await t.close().catch(() => {}); }
    currentCode = null;
    sessionStorage.removeItem('idea-remote-code');
    setConn('desconectado');
    show(byUser ? 'join' : 'ended');
  }

  /* ------------------------------- Estado ------------------------------- */
  function onState(s) {
    lastStateAt = Date.now();                      // también cuenta el latido repetido
    if ($('conn').dataset.s === 'sin presentador') setConn('conectado');
    if (!tracker.accept(s)) return;
    const digit = (n) => (Number.isInteger(n) && n >= 0 && n <= 9 ? n : 0);
    if (Array.isArray(s.slides)) {
      slides = s.slides.slice(0, 500).filter((x) => x && Number.isInteger(x.i) && x.i >= 0 && x.i < s.total)
        .map((x) => ({ i: x.i, t: String(x.t || '').slice(0, 120), b: digit(x.b) }));
      renderList();
    }
    if (Array.isArray(s.blocks)) blocks = s.blocks.slice(0, 10).map((x) => ({ id: digit(x && x.id), title: String((x && x.title) || '').slice(0, 80) }));
    s.block = digit(s.block);
    setWaiting(false);
    render();
  }

  function blockName(b) { const x = blocks.find((k) => k.id === b); return x ? x.title : ''; }

  function render() {
    const s = tracker.state;
    if (!s) return;
    $('num').textContent = s.slide + 1;
    $('total').textContent = ` / ${s.total}`;
    $('title').textContent = s.title || '';
    const bl = $('block');
    document.querySelector('.rm-now').style.setProperty('--c', s.block ? `var(--p${s.block})` : 'var(--text-2)');
    bl.innerHTML = s.block ? `<i>${s.block}</i>${escapeHtml(blockName(s.block))}${s.pos ? ` <span>· ${escapeHtml(s.pos)}</span>` : ''}` : '<i>·</i>Apertura y cierre';
    renderDemo(s);
    // Barra de progreso por bloques
    if (slides.length) {
      $('progress').innerHTML = slides.map((x) => `<span class="${x.i < s.slide ? 'done' : x.i === s.slide ? 'cur' : ''}" style="--c:${x.b ? `var(--p${x.b})` : 'var(--text-2)'}"></span>`).join('');
    }
    document.querySelectorAll('#slides button').forEach((b) => b.classList.toggle('cur', +b.dataset.i === s.slide));
    document.querySelectorAll('[data-c="PREVIOUS"],[data-c="GO_TO_START"]').forEach((b) => { b.disabled = s.slide === 0; });
    document.querySelectorAll('[data-c="NEXT"],[data-c="GO_TO_END"]').forEach((b) => { b.disabled = s.slide === s.total - 1; });
  }

  // Todos los controles de la demostración actual, tal como los publica la
  // presentación: misma etiqueta, agrupados y con su estado (activo/desactivado).
  function renderDemo(s) {
    const actions = Array.isArray(s.actions) ? s.actions : [];
    $('demo').hidden = !s.demo || actions.length === 0;
    $('demo-status').textContent = typeof s.status === 'string' ? s.status : '';
    const groups = [];
    actions.forEach((a, i) => {
      const g = String(a.g || 'Opciones').slice(0, 60);
      let grp = groups.find((x) => x.g === g);
      if (!grp) { grp = { g, items: [] }; groups.push(grp); }
      // «Ejemplos: Todo ceros» dentro del grupo «Ejemplos» se muestra como «Todo ceros»
      let l = String(a.l || '').slice(0, 80);
      if (l.startsWith(g + ': ')) l = l.slice(g.length + 2);
      grp.items.push({ i, l, d: !!a.d, on: !!a.on });
    });
    // Si solo cambió el estado de los botones, se actualizan en su sitio: rehacerlos
    // durante la reproducción automática podría «perder» un toque en el celular.
    const shape = JSON.stringify(groups.map((g) => [g.g, g.items.map((x) => x.l)]));
    const box = $('demo-actions');
    if (box.dataset.shape === shape) {
      groups.forEach((g) => g.items.forEach((a) => {
        const b = box.querySelector(`[data-act="${a.i}"]`);
        if (b) { b.disabled = a.d; b.classList.toggle('on', a.on); }
      }));
      return;
    }
    box.dataset.shape = shape;
    box.innerHTML = groups.map((g) => `
      <div class="rm-dgroup"><div class="rm-dgroup-h">${escapeHtml(g.g)}</div><div class="rm-dgroup-b">
        ${g.items.map((a) => `<button class="rm-btn small${a.on ? ' on' : ''}" data-act="${a.i}" ${a.d ? 'disabled' : ''}>${escapeHtml(a.l)}</button>`).join('')}
      </div></div>`).join('');
  }

  function renderList() {
    const groups = [];
    slides.forEach((x) => {
      const g = groups[groups.length - 1];
      if (g && g.b === x.b) g.items.push(x); else groups.push({ b: x.b, items: [x] });
    });
    $('slides').innerHTML = groups.map((g) => `
      <div class="rm-group" style="--c:${g.b ? `var(--p${g.b})` : 'var(--text-2)'}">
        <div class="rm-group-h">${g.b ? `Bloque ${g.b}` : 'General'}</div>
        ${g.items.map((x) => `<button data-i="${x.i}"><span>${x.i + 1}</span>${escapeHtml(x.t)}</button>`).join('')}
      </div>`).join('');
  }

  /* ------------------------------ Comandos ------------------------------ */
  // Tras enviar un comando de navegación se esperan ≤ 700 ms al nuevo estado:
  // evita pulsaciones dobles accidentales y comandos sobre un estado viejo.
  function setWaiting(on) {
    waiting = on;
    document.body.classList.toggle('rm-waiting', on);
    clearTimeout(waitTimer);
    if (on) waitTimer = setTimeout(() => setWaiting(false), 700);
  }

  function send(cmd, slide, action) {
    if (!transport) return;
    const isDemo = cmd.startsWith('DEMO');
    if (waiting && !isDemo) return;
    const base = tracker.version < 0 ? 0 : tracker.version;
    transport.send('cmd', RP.makeCommand(me, cmd, base, slide, action));
    if (!isDemo) setWaiting(true);
    if (navigator.vibrate) navigator.vibrate(12);
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-c]');
    if (b && !b.disabled) { send(b.dataset.c); return; }
    const d = e.target.closest('[data-act]');
    if (d && !d.disabled) {
      const a = tracker.state && Array.isArray(tracker.state.actions) ? tracker.state.actions[+d.dataset.act] : null;
      if (a) send('DEMO_ACTION', undefined, { act: +d.dataset.act, label: a.l });
      return;
    }
    const s = e.target.closest('#slides button');
    if (s) { send('GOTO_SLIDE', +s.dataset.i); $('list').open = false; }
  });
  $('leave').addEventListener('click', () => end(true));
  $('again').addEventListener('click', () => show('join'));
  $('join-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = RP.normalizeCode($('code').value);
    if (!RP.isValidCode(code)) { $('join-error').textContent = 'El código tiene 8 caracteres (letras y números, sin 0, 1, I, L ni O).'; return; }
    connect(code);
  });
  $('code').addEventListener('input', (e) => {
    const v = RP.normalizeCode(e.target.value).slice(0, 8);
    e.target.value = v.length > 4 ? `${v.slice(0, 4)} ${v.slice(4)}` : v;
  });
  // Teclado (si se usa desde una computadora): flechas = diapositivas
  document.addEventListener('keydown', (e) => {
    if (!transport || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') send('NEXT');
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') send('PREVIOUS');
  });
  // Si el presentador deja de enviar su latido (cada 10 s), avisar
  setInterval(() => {
    if (transport && $('conn').dataset.s === 'conectado' && Date.now() - lastStateAt > 25000) { setConn('sin presentador'); hello(); }
  }, 5000);
  // Si se abre otro enlace en la misma pestaña (cambia solo el #), cambiar de sala
  window.addEventListener('hashchange', async () => {
    const p = new URLSearchParams(location.hash.slice(1));
    const c = RP.normalizeCode(p.get('c') || '');
    if (RP.isValidCode(c) && c !== currentCode) { await end(true); location.reload(); }
  });
  // Al cerrar o recargar la página, avisar para que el contador sea exacto
  window.addEventListener('pagehide', () => { if (transport) transport.close().catch(() => {}); });
  // Al volver a la pestaña (p. ej., el teléfono se bloqueó), pedir el estado
  document.addEventListener('visibilitychange', () => { if (!document.hidden) hello(); });

  /* ------------------------------- Inicio ------------------------------- */
  const code = RP.normalizeCode(params.get('c') || sessionStorage.getItem('idea-remote-code') || '');
  if (RP.isValidCode(code)) { $('code').value = `${code.slice(0, 4)} ${code.slice(4)}`; connect(code); }
  else show('join');

  window.REMOTE_APP = { send, get state() { return tracker.state; }, get connected() { return !!transport; } };
})();
