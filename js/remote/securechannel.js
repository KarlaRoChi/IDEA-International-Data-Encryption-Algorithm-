/*
 * securechannel.js — Cifrado de extremo a extremo para el canal del control
 * remoto cuando viaja por un broker MQTT PÚBLICO.
 *
 * A partir del código de la sala (8 caracteres) se derivan, con PBKDF2-SHA256
 * (300 000 iteraciones), 512 bits:
 *   - 256 bits: clave AES-GCM con la que se cifra y autentica cada mensaje.
 *   - 128 bits: identificador del «tema» MQTT (no revela el código).
 * El broker solo ve bytes cifrados: no puede leer los mensajes ni inyectar
 * comandos válidos (AES-GCM rechaza cualquier mensaje alterado o falso).
 * Las iteraciones de PBKDF2 encarecen probar códigos por fuerza bruta.
 *
 * Usa la Web Crypto API (navegador y Node ≥ 18). Script clásico o CommonJS.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SecureChannel = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SALT = 'idea-remote/v1';
  const ITERATIONS = 300000;
  const subtle = () => (globalThis.crypto && globalThis.crypto.subtle) || require('node:crypto').webcrypto.subtle;
  const rand = (n) => { const a = new Uint8Array(n); (globalThis.crypto || require('node:crypto').webcrypto).getRandomValues(a); return a; };
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const hex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, '0')).join('');

  function b64(u8) {
    let s = '';
    for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return btoa(s);
  }
  function unb64(s) {
    const bin = atob(s);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  }

  /** Deriva la clave AES y el tema a partir del código. */
  async function deriveRoom(code, iterations = ITERATIONS) {
    const base = await subtle().importKey('raw', enc.encode(String(code).toUpperCase()), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await subtle().deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(SALT), iterations }, base, 512));
    const key = await subtle().importKey('raw', bits.slice(0, 32), 'AES-GCM', false, ['encrypt', 'decrypt']);
    return { key, topic: `idea-remote/v1/${hex(bits.slice(32, 48))}` };
  }

  /** Cifra un objeto JSON → texto base64 (IV de 96 bits + texto cifrado + etiqueta). */
  async function seal(key, obj) {
    const iv = rand(12);
    const ct = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj))));
    const out = new Uint8Array(12 + ct.length);
    out.set(iv, 0); out.set(ct, 12);
    return b64(out);
  }

  /** Descifra y verifica; devuelve null si el mensaje es falso, alterado o mal formado. */
  async function open(key, text) {
    try {
      const raw = unb64(typeof text === 'string' ? text : dec.decode(text));
      if (raw.length < 12 + 16 || raw.length > 64 * 1024) return null;
      const pt = await subtle().decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, key, raw.slice(12));
      return JSON.parse(dec.decode(pt));
    } catch (e) {
      return null;
    }
  }

  return { deriveRoom, seal, open, ITERATIONS, SALT };
});
