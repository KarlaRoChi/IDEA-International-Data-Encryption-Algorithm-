/*
 * transport.js — Canal de comunicación del control remoto.
 *
 * Dos implementaciones con la misma interfaz:
 *   - SupabaseTransport: internet (Supabase Realtime, canales PRIVADOS con RLS).
 *   - LocalTransport:   BroadcastChannel; solo pestañas del MISMO navegador.
 *                       Sirve para ensayar y para probar sin cuenta.
 *
 * Interfaz común:
 *   await t.host({ ttlMinutes })  -> { code, expiresAt }   (presentador)
 *   await t.join(code)            -> { expiresAt }          (control remoto)
 *   t.send(event, payload)         event: 'cmd' | 'state' | 'hello' | 'closed'
 *   t.on(event, fn)                fn(payload)
 *   t.onPresence(fn)               fn(numeroDeControlesRemotos)
 *   t.onStatus(fn)                 fn('conectando'|'conectado'|'reconectando'|'desconectado'|'error', detalle)
 *   await t.close()                presentador: cierra la sala; remoto: se desconecta
 */
(function () {
  'use strict';
  const RP = window.RemoteProtocol;

  class Emitter {
    constructor() { this.h = {}; }
    on(ev, fn) { (this.h[ev] = this.h[ev] || []).push(fn); }
    emit(ev, ...a) { (this.h[ev] || []).forEach((fn) => { try { fn(...a); } catch (e) { console.error(e); } }); }
  }

  /* ------------------------------------------------------------------ */
  /* Transporte local (mismo navegador)                                  */
  /* ------------------------------------------------------------------ */
  class LocalTransport extends Emitter {
    constructor(role) {
      super();
      this.kind = 'local';
      this.role = role;
      this.me = RP.randomId(8);
      this.peers = new Map();
    }
    _open(code) {
      if (typeof BroadcastChannel === 'undefined') throw new Error('Este navegador no admite BroadcastChannel.');
      this.code = code;
      this.bc = new BroadcastChannel('idea-remote-' + code);
      this.bc.onmessage = (e) => {
        const { ev, payload, from, role } = e.data || {};
        if (ev === '_ping') { this.peers.set(from, { role, t: Date.now() }); this._presence(); return; }
        if (ev === '_bye') { this.peers.delete(from); this._presence(); return; }
        if (typeof ev === 'string') this.emit(ev, payload);
      };
      const ping = () => this.bc && this.bc.postMessage({ ev: '_ping', from: this.me, role: this.role });
      ping();
      this.pingTimer = setInterval(() => { ping(); this._presence(); }, 3000);
      this.emit('status', 'conectado');
    }
    _presence() {
      const now = Date.now();
      for (const [k, v] of this.peers) if (now - v.t > 9000) this.peers.delete(k);
      this.emit('presence', [...this.peers.values()].filter((p) => p.role === 'remote').length);
    }
    async host() {
      const code = RP.randomCode();
      this._open(code);
      return { code, expiresAt: null };
    }
    async join(code) {
      if (!RP.isValidCode(code)) throw new Error('Código no válido.');
      this._open(code);
      return { expiresAt: null };
    }
    send(ev, payload) { if (this.bc) this.bc.postMessage({ ev, payload, from: this.me, role: this.role }); }
    onPresence(fn) { this.on('presence', fn); }
    onStatus(fn) { this.on('status', fn); }
    async close() {
      clearInterval(this.pingTimer);
      if (this.bc) { this.bc.postMessage({ ev: '_bye', from: this.me }); this.bc.close(); this.bc = null; }
      this.emit('status', 'desconectado');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Transporte Supabase Realtime (internet)                             */
  /* ------------------------------------------------------------------ */
  let supabaseLoading = null;
  function loadSupabase(src) {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    if (!supabaseLoading) {
      supabaseLoading = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => res();
        s.onerror = () => rej(new Error('No se pudo cargar la biblioteca de Supabase.'));
        document.head.appendChild(s);
      });
    }
    return supabaseLoading;
  }

  class SupabaseTransport extends Emitter {
    constructor(role, cfg) {
      super();
      this.kind = 'supabase';
      this.role = role;
      this.cfg = cfg;
      this.me = RP.randomId(8);
    }
    async _client() {
      await loadSupabase(this.cfg.libraryPath);
      if (!this.sb) {
        this.sb = window.supabase.createClient(this.cfg.supabaseUrl, this.cfg.supabaseAnonKey, {
          auth: { persistSession: true, autoRefreshToken: true, storageKey: 'idea-remote-auth-' + this.role },
        });
      }
      // Sesión anónima: identidad propia por dispositivo, sin cuentas ni contraseñas
      let { data: { session } } = await this.sb.auth.getSession();
      if (!session) {
        const { data, error } = await this.sb.auth.signInAnonymously();
        if (error) throw new Error('No se pudo iniciar la sesión anónima: ' + error.message);
        session = data.session;
      }
      await this.sb.realtime.setAuth(session.access_token);
      return this.sb;
    }
    async _subscribe(roomId) {
      const sb = this.sb;
      this.emit('status', 'conectando');
      const ch = sb.channel('room:' + roomId, {
        config: { private: true, broadcast: { self: false, ack: false }, presence: { key: this.me } },
      });
      for (const ev of ['cmd', 'state', 'hello', 'closed']) {
        ch.on('broadcast', { event: ev }, ({ payload }) => this.emit(ev, payload));
      }
      ch.on('presence', { event: 'sync' }, () => {
        const st = ch.presenceState();
        const n = Object.values(st).flat().filter((p) => p.role === 'remote').length;
        this.emit('presence', n);
      });
      let wasUp = false;
      ch.subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') {
          this.emit('status', 'conectado');
          await ch.track({ role: this.role });
          if (wasUp) this.emit('reconnected');
          wasUp = true;
        } else if (status === 'CHANNEL_ERROR') {
          this.emit('status', 'error', err ? String(err.message || err) : 'Acceso denegado o canal no disponible.');
        } else if (status === 'TIMED_OUT') {
          this.emit('status', 'reconectando');
        } else if (status === 'CLOSED') {
          this.emit('status', 'desconectado');
        }
      });
      this.ch = ch;
    }
    async host({ ttlMinutes = 180 } = {}) {
      const sb = await this._client();
      const { data, error } = await sb.rpc('create_remote_room', { p_ttl_minutes: ttlMinutes });
      if (error) throw new Error('No se pudo crear la sala: ' + error.message);
      const row = Array.isArray(data) ? data[0] : data;
      this.roomId = row.room_id;
      await this._subscribe(this.roomId);
      return { code: row.code, expiresAt: row.expires_at };
    }
    async join(code) {
      if (!RP.isValidCode(code)) throw new Error('Código no válido.');
      const sb = await this._client();
      const { data, error } = await sb.rpc('join_remote_room', { p_code: code });
      if (error) throw new Error('No se pudo entrar en la sala: ' + error.message);
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || row.status !== 'ok') {
        const why = { invalid: 'Código incorrecto o sala cerrada.', limit: 'Demasiados intentos. Espera unos minutos.', full: 'La sala está llena.' };
        throw new Error(why[row && row.status] || 'No se pudo entrar en la sala.');
      }
      this.roomId = row.room_id;
      await this._subscribe(this.roomId);
      return { expiresAt: row.expires_at };
    }
    send(ev, payload) {
      if (this.ch) this.ch.send({ type: 'broadcast', event: ev, payload });
    }
    onPresence(fn) { this.on('presence', fn); }
    onStatus(fn) { this.on('status', fn); }
    async close() {
      try {
        if (this.role === 'presenter' && this.roomId) await this.sb.rpc('close_remote_room', { p_room: this.roomId });
      } catch (e) { console.warn(e); }
      if (this.ch) { await this.ch.untrack().catch(() => {}); await this.sb.removeChannel(this.ch); this.ch = null; }
      this.emit('status', 'desconectado');
    }
  }

  /** Elige el transporte según la configuración pública. */
  function createTransport(role, mode) {
    const cfg = window.REMOTE_CONFIG || {};
    const hasSupabase = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
    if (mode === 'local' || !hasSupabase) return new LocalTransport(role);
    return new SupabaseTransport(role, cfg);
  }
  function internetAvailable() {
    const cfg = window.REMOTE_CONFIG || {};
    return !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  }

  window.RemoteTransport = { createTransport, internetAvailable, LocalTransport, SupabaseTransport };
})();
