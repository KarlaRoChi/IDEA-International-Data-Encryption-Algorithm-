/*
 * protocol.js — Protocolo del control remoto (lógica pura, sin DOM).
 *
 * Modelo: el ordenador del PRESENTADOR es la única fuente de verdad.
 *   - Los controles remotos envían comandos (CMD).
 *   - El presentador los valida, los aplica a la presentación y publica el
 *     estado resultante (STATE) con una versión creciente.
 *   - Los remotos nunca publican estado: solo muestran el último STATE válido.
 * Así no hay bucles de eco, el orden lo decide un único punto y una
 * reconexión no puede devolver la presentación a una diapositiva anterior.
 *
 * Funciona como script clásico (window.RemoteProtocol) y en Node (tests).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RemoteProtocol = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PROTOCOL = 1;
  const NAV = ['NEXT', 'PREVIOUS', 'GOTO_SLIDE', 'GO_TO_START', 'GO_TO_END'];
  const DEMO = ['DEMO_NEXT', 'DEMO_PREV', 'DEMO_RESET', 'DEMO_ALL'];
  // DEMO_ACTION: ejecutar cualquier control de la demostración que la
  // presentadora publica en su estado (botón, pestaña, ejemplo, deslizador…)
  const COMMANDS = new Set([...NAV, ...DEMO, 'DEMO_ACTION']);
  const RELATIVE = new Set(['NEXT', 'PREVIOUS', ...DEMO, 'DEMO_ACTION']);
  const MAX_ACTIONS = 80;
  const MAX_TEXT = 200;
  const CMD_KEYS = new Set(['t', 'v', 'id', 'from', 'cmd', 'base', 'slide', 'act', 'label', 'value']);
  // Sin caracteres de control (tabulador, saltos de línea, nulos…)
  const CTRL_RE = /[\u0000-\u001f\u007f]/;
  const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;

  // Alfabeto sin caracteres ambiguos (sin 0/O, 1/I/L) para códigos legibles
  const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  const isInt = (n) => Number.isInteger(n);

  /** Genera un identificador aleatorio (usa crypto si está disponible). */
  function randomId(bytes = 16) {
    const a = new Uint8Array(bytes);
    const c = (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto : require('node:crypto').webcrypto;
    c.getRandomValues(a);
    return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  /** Código corto de sala (8 caracteres ≈ 39,6 bits), sin sesgo de módulo. */
  function randomCode(len = 8) {
    const c = (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto : require('node:crypto').webcrypto;
    let out = '';
    const buf = new Uint8Array(1);
    while (out.length < len) {
      c.getRandomValues(buf);
      if (buf[0] < 248) out += CODE_ALPHABET[buf[0] % 31]; // 248 = 8·31
    }
    return out;
  }

  /** Normaliza lo que escribe un usuario: mayúsculas, sin espacios ni guiones. */
  function normalizeCode(s) {
    return String(s || '').toUpperCase().replace(/[\s-]/g, '');
  }
  function isValidCode(s) {
    return typeof s === 'string' && s.length === 8 && [...s].every((ch) => CODE_ALPHABET.includes(ch));
  }

  /* ------------------------------------------------------------------ */
  /* Validación de mensajes                                              */
  /* ------------------------------------------------------------------ */

  /** Valida la FORMA de un comando. Devuelve null si es válido o el motivo. */
  function validateCommand(m) {
    if (!m || typeof m !== 'object') return 'formato';
    if (m.t !== 'CMD' || m.v !== PROTOCOL) return 'formato';
    if (typeof m.id !== 'string' || !ID_RE.test(m.id)) return 'id';
    if (typeof m.from !== 'string' || !ID_RE.test(m.from)) return 'origen';
    if (!COMMANDS.has(m.cmd)) return 'comando';
    if (!isInt(m.base) || m.base < 0) return 'version';
    if (m.cmd === 'GOTO_SLIDE' && !isInt(m.slide)) return 'diapositiva';
    if (m.cmd !== 'GOTO_SLIDE' && m.slide !== undefined) return 'diapositiva';
    if (m.cmd === 'DEMO_ACTION') {
      if (!isInt(m.act) || m.act < 0 || m.act >= MAX_ACTIONS) return 'accion';
      if (typeof m.label !== 'string' || m.label.length > 80) return 'accion';
      // value: nuevo valor de un deslizador o de un campo de texto
      if (m.value !== undefined && (typeof m.value !== 'string' || m.value.length > MAX_TEXT)) return 'valor';
    } else if (m.act !== undefined || m.label !== undefined || m.value !== undefined) return 'accion';
    const keys = Object.keys(m);
    if (keys.length > 9 || keys.some((k) => !CMD_KEYS.has(k))) return 'formato';
    return null;
  }

  /** Valida un STATE recibido por un control remoto. */
  function validateState(s) {
    if (!s || typeof s !== 'object' || s.t !== 'STATE' || s.v !== PROTOCOL) return false;
    if (typeof s.epoch !== 'string' || !ID_RE.test(s.epoch)) return false;
    if (!isInt(s.version) || s.version < 0) return false;
    if (!isInt(s.total) || s.total < 1 || s.total > 500) return false;
    if (!isInt(s.slide) || s.slide < 0 || s.slide >= s.total) return false;
    if (typeof s.title !== 'string' || s.title.length > 200) return false;
    if (s.dseq !== undefined && (!isInt(s.dseq) || s.dseq < 0)) return false;
    if (s.actions !== undefined && s.actions !== null) {
      if (!Array.isArray(s.actions) || s.actions.length > MAX_ACTIONS) return false;
      for (const a of s.actions) if (!a || typeof a.l !== 'string' || a.l.length > 80) return false;
    }
    if (s.status !== undefined && (typeof s.status !== 'string' || s.status.length > 80)) return false;
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* Lado del presentador                                                */
  /* ------------------------------------------------------------------ */

  /**
   * Decide qué hacer con cada comando. No toca la presentación: devuelve una
   * decisión que el adaptador aplica (así se puede probar sin navegador).
   *
   * Reglas:
   *  - Comandos mal formados, duplicados (mismo id) o de sesión cerrada: rechazo.
   *  - Límite de frecuencia por dispositivo (cubeta de fichas: 4 ráfaga, 4/s).
   *  - Comandos RELATIVOS (siguiente/anterior/pasos de demo) con una versión
   *    base anterior a la actual se rechazan como «obsoletos»: si dos personas
   *    pulsan «Siguiente» a la vez sobre la misma diapositiva, solo avanza una.
   *  - Comandos ABSOLUTOS (ir a N, inicio, fin) se aplican siempre que el
   *    destino exista: el último en llegar gana.
   *  - Pausa mínima global entre cambios de diapositiva remotos (150 ms).
   */
  class RemoteHost {
    constructor(opts = {}) {
      this.total = opts.total || 1;
      this.epoch = opts.epoch || randomId(8);
      this.version = opts.version || 0;
      this.index = opts.index || 0;
      this.allowDemo = !!opts.allowDemo;
      this.closed = false;
      this.seen = new Map();             // id -> instante (deduplicación)
      this.buckets = new Map();          // from -> {tokens, t}
      this.lastNavAt = -Infinity;
      this.rate = { burst: 4, perSec: 4 };
      this.minNavGapMs = 150;
    }

    /** La presentación cambió (por teclado local o por un comando remoto). */
    localChange(index) {
      if (index === this.index) return false;
      this.index = index;
      this.version += 1;
      return true;
    }

    /** Cambio de estado que no es de diapositiva (p. ej., permitir demos). */
    touch() { this.version += 1; }

    /**
     * La demostración cambió (paso, pestaña, ejemplo…). No sube la versión
     * de navegación, para no invalidar los comandos de diapositiva en curso;
     * usa un contador propio que los remotos comparan en segundo lugar.
     */
    demoChange() { this.dseq = (this.dseq || 0) + 1; }

    state(meta = {}) {
      return {
        t: 'STATE', v: PROTOCOL, epoch: this.epoch, version: this.version,
        slide: this.index, total: this.total, ts: Date.now(),
        title: meta.title || '', block: meta.block || 0, pos: meta.pos || '',
        demo: !!(meta.demo && this.allowDemo),
        caps: meta.demo && this.allowDemo ? { reset: !!(meta.caps && meta.caps.reset), all: !!(meta.caps && meta.caps.all) } : null,
        dseq: this.dseq || 0,
        actions: this.allowDemo && Array.isArray(meta.actions) ? meta.actions.slice(0, MAX_ACTIONS) : null,
        status: this.allowDemo && meta.status ? String(meta.status).slice(0, 80) : '',
      };
    }

    _rateOk(from, now) {
      let b = this.buckets.get(from);
      if (!b) { b = { tokens: this.rate.burst, t: now }; this.buckets.set(from, b); }
      b.tokens = Math.min(this.rate.burst, b.tokens + ((now - b.t) / 1000) * this.rate.perSec);
      b.t = now;
      if (b.tokens < 1) return false;
      b.tokens -= 1;
      return true;
    }

    _remember(id, now) {
      this.seen.set(id, now);
      if (this.seen.size > 500) {
        // Map conserva el orden de inserción: se descartan los 100 más antiguos
        let n = 0;
        for (const k of this.seen.keys()) { this.seen.delete(k); if (++n >= 100) break; }
      }
    }

    /**
     * @returns {{ok:boolean, reason?:string, action?:{type:'goto', index:number}|{type:'demo', dir:1|-1}}}
     */
    handle(m, now = Date.now(), ctx = {}) {
      if (this.closed) return { ok: false, reason: 'cerrada' };
      const bad = validateCommand(m);
      if (bad) return { ok: false, reason: bad };
      if (this.seen.has(m.id)) return { ok: false, reason: 'duplicado' };
      this._remember(m.id, now);
      if (!this._rateOk(m.from, now)) return { ok: false, reason: 'frecuencia' };

      if (RELATIVE.has(m.cmd) && m.base < this.version) return { ok: false, reason: 'obsoleto' };

      if (m.cmd === 'DEMO_ACTION') {
        if (!this.allowDemo) return { ok: false, reason: 'demo-desactivada' };
        const list = Array.isArray(ctx.actions) ? ctx.actions : [];
        const a = list[m.act];
        // La etiqueta debe coincidir: evita ejecutar otro control si la lista cambió
        if (!a || a.l !== m.label) return { ok: false, reason: 'accion-desconocida' };
        if (a.d) return { ok: false, reason: 'accion-desactivada' };
        if (a.k === 'r' || a.k === 't') {
          if (typeof m.value !== 'string') return { ok: false, reason: 'valor' };
          if (a.k === 'r') {
            const v = Number(m.value);
            if (!Number.isFinite(v) || v < a.min || v > a.max) return { ok: false, reason: 'valor' };
          } else if (m.value.length > (a.max || MAX_TEXT) || CTRL_RE.test(m.value)) {
            return { ok: false, reason: 'valor' };
          }
          return { ok: true, action: { type: 'demo-action', index: m.act, value: m.value } };
        }
        if (m.value !== undefined) return { ok: false, reason: 'valor' };
        return { ok: true, action: { type: 'demo-action', index: m.act } };
      }

      if (DEMO.includes(m.cmd)) {
        if (!this.allowDemo) return { ok: false, reason: 'demo-desactivada' };
        if (!ctx.hasDemo) return { ok: false, reason: 'sin-demo' };
        const op = { DEMO_NEXT: 'next', DEMO_PREV: 'prev', DEMO_RESET: 'reset', DEMO_ALL: 'all' }[m.cmd];
        // ⟲ y ⏩ solo si la demostración de esta diapositiva los ofrece
        if ((op === 'reset' || op === 'all') && !(ctx.caps && ctx.caps[op])) return { ok: false, reason: 'sin-accion' };
        return { ok: true, action: { type: 'demo', op } };
      }

      let target;
      switch (m.cmd) {
        case 'NEXT': target = this.index + 1; break;
        case 'PREVIOUS': target = this.index - 1; break;
        case 'GO_TO_START': target = 0; break;
        case 'GO_TO_END': target = this.total - 1; break;
        case 'GOTO_SLIDE': target = m.slide; break;
        default: return { ok: false, reason: 'comando' };
      }
      if (target < 0 || target >= this.total) {
        // Siguiente en la última / anterior en la primera: no es un error grave
        return { ok: false, reason: RELATIVE.has(m.cmd) ? 'limite' : 'fuera-de-rango' };
      }
      if (target === this.index) return { ok: true, action: null };
      if (now - this.lastNavAt < this.minNavGapMs) return { ok: false, reason: 'frecuencia' };
      this.lastNavAt = now;
      return { ok: true, action: { type: 'goto', index: target } };
    }
  }

  /* ------------------------------------------------------------------ */
  /* Lado del control remoto                                             */
  /* ------------------------------------------------------------------ */

  /** Acepta solo estados más recientes; tolera mensajes fuera de orden. */
  class StateTracker {
    constructor() { this.epoch = null; this.version = -1; this.dseq = -1; this.ts = 0; this.state = null; }
    accept(s) {
      if (!validateState(s)) return false;
      const dseq = s.dseq || 0;
      if (s.epoch === this.epoch) {
        // Orden: primero la versión de navegación, luego la de la demostración
        if (s.version < this.version || (s.version === this.version && dseq <= this.dseq)) return false;
      } else if (this.epoch !== null && s.ts < this.ts) {
        return false;                                           // de una sesión anterior
      }
      this.epoch = s.epoch; this.version = s.version; this.dseq = dseq; this.ts = s.ts; this.state = s;
      return true;
    }
  }

  /** Construye un comando con id único y la versión que el remoto ha visto. */
  function makeCommand(from, cmd, base, slide, action) {
    const m = { t: 'CMD', v: PROTOCOL, id: randomId(9), from, cmd, base: base < 0 ? 0 : base };
    if (cmd === 'GOTO_SLIDE') m.slide = slide;
    if (cmd === 'DEMO_ACTION' && action) {
      m.act = action.act; m.label = action.label;
      if (action.value !== undefined) m.value = String(action.value);
    }
    return m;
  }

  return {
    PROTOCOL, NAV, DEMO, CODE_ALPHABET, MAX_ACTIONS, MAX_TEXT,
    randomId, randomCode, normalizeCode, isValidCode,
    validateCommand, validateState, makeCommand,
    RemoteHost, StateTracker,
  };
});
