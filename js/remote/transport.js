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

  /* ------------------------------------------------------------------ */
  /* Transporte MQTT público con cifrado de extremo a extremo (internet,  */
  /* sin cuentas ni configuración)                                       */
  /* ------------------------------------------------------------------ */
  const loaded = {};
  function loadScript(src, globalName) {
    if (window[globalName]) return Promise.resolve();
    if (!loaded[src]) {
      loaded[src] = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => res();
        s.onerror = () => { delete loaded[src]; rej(new Error('No se pudo cargar ' + src)); };
        document.head.appendChild(s);
      });
    }
    return loaded[src];
  }

  class MqttTransport extends Emitter {
    constructor(role, cfg) {
      super();
      this.kind = 'mqtt';
      this.role = role;
      this.cfg = cfg;
      this.me = RP.randomId(8);
      this.peers = new Map();
      this.closed = false;
    }
    async _open(code) {
      this.emit('status', 'conectando');
      await loadScript(this.cfg.mqttLibraryPath || 'vendor/mqtt/mqtt.min.js', 'mqtt');
      const room = await window.SecureChannel.deriveRoom(code);
      this.key = room.key;
      this.topic = room.topic;
      const brokers = this.cfg.mqttBrokers && this.cfg.mqttBrokers.length ? this.cfg.mqttBrokers : ['wss://broker.hivemq.com:8884/mqtt'];
      let lastErr = null;
      for (const url of brokers) {
        try { await this._connect(url); this.broker = url; return; } catch (e) { lastErr = e; console.warn('Broker no disponible:', url, e.message); }
      }
      this.emit('status', 'error', 'No se pudo conectar con ningún servidor de mensajería.');
      throw new Error('Sin conexión con el servidor de mensajería. ' + (lastErr ? lastErr.message : ''));
    }
    _connect(url) {
      return new Promise((resolve, reject) => {
        const client = window.mqtt.connect(url, {
          clientId: 'idea_' + RP.randomId(6), clean: true, keepalive: 30,
          connectTimeout: 8000, reconnectPeriod: 2000, protocolVersion: 4,
        });
        let first = true;
        const fail = setTimeout(() => { if (first) { client.end(true); reject(new Error('tiempo de espera agotado')); } }, 9000);
        client.on('connect', () => {
          client.subscribe(this.topic, { qos: 0 }, (err) => {
            if (err) { if (first) { clearTimeout(fail); client.end(true); reject(err); } return; }
            this.emit('status', 'conectado');
            this._ping();
            if (!first) this.emit('reconnected');
            if (first) { first = false; clearTimeout(fail); resolve(); }
          });
        });
        client.on('reconnect', () => { if (!first && !this.closed) this.emit('status', 'reconectando'); });
        client.on('offline', () => { if (!first && !this.closed) this.emit('status', 'reconectando'); });
        client.on('error', (e) => { if (first) { clearTimeout(fail); client.end(true); reject(e); } });
        client.on('message', (_t, buf) => this._onMessage(buf));
        this.client = client;
      }).then(() => {
        this.pingTimer = setInterval(() => { this._ping(); this._presence(); }, 4000);
      });
    }
    async _onMessage(buf) {
      const env = await window.SecureChannel.open(this.key, typeof buf === 'string' ? buf : new TextDecoder().decode(buf));
      if (!env || typeof env !== 'object' || env.from === this.me || typeof env.ev !== 'string') return;
      if (env.ev === '_ping') { this.peers.set(env.from, { role: env.role, t: Date.now() }); this._presence(); return; }
      if (env.ev === '_bye') { this.peers.delete(env.from); this._presence(); return; }
      this.emit(env.ev, env.payload);
    }
    _presence() {
      const now = Date.now();
      for (const [k, v] of this.peers) if (now - v.t > 12000) this.peers.delete(k);
      this.emit('presence', [...this.peers.values()].filter((p) => p.role === 'remote').length);
    }
    async _publish(env) {
      if (!this.client || !this.client.connected) return;
      this.client.publish(this.topic, await window.SecureChannel.seal(this.key, env), { qos: 0 });
    }
    _ping() { this._publish({ ev: '_ping', from: this.me, role: this.role }); }
    async host() {
      const code = RP.randomCode();
      await this._open(code);
      return { code, expiresAt: null };
    }
    async join(code) {
      if (!RP.isValidCode(code)) throw new Error('Código no válido.');
      await this._open(code);
      return { expiresAt: null };
    }
    send(ev, payload) { this._publish({ ev, payload, from: this.me, role: this.role }); }
    onPresence(fn) { this.on('presence', fn); }
    onStatus(fn) { this.on('status', fn); }
    async close() {
      this.closed = true;
      clearInterval(this.pingTimer);
      if (this.client) {
        await this._publish({ ev: '_bye', from: this.me }).catch(() => {});
        await new Promise((r) => this.client.end(false, {}, r));
        this.client = null;
      }
      this.emit('status', 'desconectado');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Selección del transporte                                            */
  /*   'supabase' : si js/remote-config.js tiene URL y clave             */
  /*   'mqtt'     : internet sin configuración (cifrado de extremo a     */
  /*                extremo); es el modo por defecto                     */
  /*   'local'    : ensayo en un solo navegador                          */
  /* ------------------------------------------------------------------ */
  const MODE_CODES = { supabase: 'sb', mqtt: 'mq', local: 'local' };
  function supabaseConfigured() {
    const cfg = window.REMOTE_CONFIG || {};
    return !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  }
  function defaultMode() { return supabaseConfigured() ? 'supabase' : 'mqtt'; }
  function modeFromCode(c) {
    const m = Object.keys(MODE_CODES).find((k) => MODE_CODES[k] === c);
    if (m === 'supabase' && !supabaseConfigured()) return 'mqtt';
    return m || defaultMode();
  }
  function createTransport(role, mode) {
    const cfg = window.REMOTE_CONFIG || {};
    const m = mode || defaultMode();
    if (m === 'local') return new LocalTransport(role);
    if (m === 'supabase' && supabaseConfigured()) return new SupabaseTransport(role, cfg);
    return new MqttTransport(role, cfg);
  }
  // Compatibilidad: «hay internet» = cualquier modo que no sea el de ensayo
  function internetAvailable() { return true; }

  window.RemoteTransport = {
    createTransport, internetAvailable, supabaseConfigured, defaultMode, modeFromCode, MODE_CODES,
    LocalTransport, SupabaseTransport, MqttTransport,
  };
})();
