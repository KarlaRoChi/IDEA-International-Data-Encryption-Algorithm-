/*
 * idea.js — Implementación educativa y trazable de IDEA
 * (International Data Encryption Algorithm, Lai & Massey, 1991).
 *
 * - Bloque de 64 bits = 4 palabras de 16 bits (X1..X4).
 * - Clave de 128 bits -> 52 subclaves de 16 bits (Z1..Z52).
 * - 8 rondas completas + transformación de salida ("8.5 rondas").
 *
 * Validada con el vector de prueba de Lai (1992) y con vectores
 * generados por OpenSSL (ver tests/). Es una implementación DIDÁCTICA:
 * no es de tiempo constante ni está pensada para producción.
 *
 * Funciona como script clásico (expone window.IDEA) y como módulo
 * CommonJS (require) para las pruebas en Node.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IDEA = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MASK16 = 0xffff;
  const MOD_ADD = 0x10000;   // 2^16
  const MOD_MUL = 0x10001;   // 2^16 + 1 = 65537 (primo de Fermat F4)

  /* ---------------- Operaciones de grupo sobre palabras de 16 bits -------- */

  /** XOR bit a bit:  a ⊕ b */
  function xor(a, b) { return (a ^ b) & MASK16; }

  /** Suma módulo 2^16:  a ⊞ b */
  function add(a, b) { return (a + b) & MASK16; }

  /** Opuesto aditivo módulo 2^16:  −a  (a ⊞ (−a) = 0) */
  function addInv(a) { return (MOD_ADD - a) & MASK16; }

  /**
   * Multiplicación módulo 2^16+1:  a ⊙ b
   * La palabra 0x0000 representa el valor 2^16 (≡ −1 mod 65537), de modo que
   * las 2^16 palabras posibles forman el grupo multiplicativo Z*_65537.
   * Se usa aritmética de enteros exacta: 65536·65536 = 2^32 < 2^53.
   */
  function mul(a, b) {
    const x = a === 0 ? MOD_ADD : a;
    const y = b === 0 ? MOD_ADD : b;
    const r = (x * y) % MOD_MUL;          // r ∈ [1, 65536]
    return r === MOD_ADD ? 0 : r;          // 65536 vuelve a codificarse como 0
  }

  /**
   * Inverso multiplicativo módulo 2^16+1 (algoritmo de Euclides extendido).
   * mulInv(0) = 0, porque 2^16 · 2^16 = 2^32 ≡ 1 (mod 65537).
   */
  function mulInv(a) {
    const x = a === 0 ? MOD_ADD : a;
    let [r0, r1] = [MOD_MUL, x];
    let [t0, t1] = [0, 1];
    while (r1 !== 0) {
      const q = Math.floor(r0 / r1);
      [r0, r1] = [r1, r0 - q * r1];
      [t0, t1] = [t1, t0 - q * t1];
    }
    // r0 = mcd = 1 porque 65537 es primo
    let inv = t0 % MOD_MUL;
    if (inv < 0) inv += MOD_MUL;
    return inv === MOD_ADD ? 0 : inv;
  }

  /* ---------------- Utilidades de formato ------------------------------- */

  const hex16 = (w) => w.toString(16).toUpperCase().padStart(4, '0');
  const bin16 = (w) => w.toString(2).padStart(16, '0');

  /** Normaliza una cadena hexadecimal (admite espacios, guiones y "0x"). */
  function cleanHex(s) {
    return String(s).replace(/0x/gi, '').replace(/[\s:_-]/g, '').toUpperCase();
  }

  /** Convierte hex a un arreglo de palabras de 16 bits; valida longitud. */
  function hexToWords(s, nWords) {
    const h = cleanHex(s);
    if (!/^[0-9A-F]*$/.test(h)) throw new Error('Solo se admiten dígitos hexadecimales (0-9, A-F).');
    if (h.length !== nWords * 4) {
      throw new Error(`Se esperaban ${nWords * 4} dígitos hexadecimales (${nWords * 16} bits); se recibieron ${h.length}.`);
    }
    const out = [];
    for (let i = 0; i < nWords; i++) out.push(parseInt(h.slice(4 * i, 4 * i + 4), 16));
    return out;
  }

  const wordsToHex = (ws, sep = ' ') => ws.map(hex16).join(sep);

  /* ---------------- Generación de subclaves ----------------------------- */

  /** Rota a la izquierda 25 bits una clave de 128 bits (8 palabras). */
  function rotl25(kw) {
    const bits = kw.map(bin16).join('');               // 128 caracteres '0'/'1'
    const rot = bits.slice(25) + bits.slice(0, 25);
    const out = [];
    for (let i = 0; i < 8; i++) out.push(parseInt(rot.slice(16 * i, 16 * i + 16), 2));
    return out;
  }

  /**
   * Expande la clave de 128 bits en 52 subclaves de cifrado.
   * Devuelve también los 7 "grupos" (clave tras 0..6 rotaciones de 25 bits)
   * para poder visualizar el proceso.
   */
  function expandKey(keyWords) {
    if (keyWords.length !== 8) throw new Error('La clave debe tener 8 palabras de 16 bits.');
    const groups = [];
    const Z = [];
    let k = keyWords.slice();
    for (let g = 0; g < 7; g++) {
      groups.push({ rotation: 25 * g, words: k.slice() });
      for (let i = 0; i < 8 && Z.length < 52; i++) Z.push(k[i]);
      k = rotl25(k);
    }
    return { Z, groups };
  }

  /**
   * Subclaves de descifrado U1..U52 a partir de Z1..Z52 (índices base 0).
   * Para la ronda de descifrado r (1..9) se toman las subclaves de la
   * "ronda espejo" 10−r del cifrado:
   *   U1 = Z1'^-1, U4 = Z4'^-1           (inversos multiplicativos)
   *   U2 = −Z3', U3 = −Z2'  (rondas 2..8: intercambiadas por el cruce)
   *   U2 = −Z2', U3 = −Z3'  (rondas 1 y 9: sin intercambio)
   *   U5, U6 = Z5, Z6 de la ronda 9−r     (la caja MA es una involución)
   */
  function decryptSubkeys(Z) {
    const U = new Array(52);
    const origin = new Array(52); // de qué Z proviene y con qué operación
    for (let r = 1; r <= 9; r++) {
      const m = 9 - r;               // índice base 0 de la ronda espejo (0..8)
      const b = 6 * m;                // primera subclave de esa ronda en Z
      const o = 6 * (r - 1);          // primera subclave de la ronda r en U
      const swap = r !== 1 && r !== 9;
      const i2 = swap ? b + 2 : b + 1;
      const i3 = swap ? b + 1 : b + 2;
      U[o] = mulInv(Z[b]);       origin[o] = { from: b, op: 'mulInv' };
      U[o + 1] = addInv(Z[i2]);  origin[o + 1] = { from: i2, op: 'addInv' };
      U[o + 2] = addInv(Z[i3]);  origin[o + 2] = { from: i3, op: 'addInv' };
      U[o + 3] = mulInv(Z[b + 3]); origin[o + 3] = { from: b + 3, op: 'mulInv' };
      if (r <= 8) {
        const p = 6 * (8 - r);     // subclaves MA de la ronda de cifrado 9−r
        U[o + 4] = Z[p + 4]; origin[o + 4] = { from: p + 4, op: 'copy' };
        U[o + 5] = Z[p + 5]; origin[o + 5] = { from: p + 5, op: 'copy' };
      }
    }
    return { U, origin };
  }

  /* ---------------- Núcleo con traza ------------------------------------ */

  /**
   * Ejecuta las 8.5 rondas con las subclaves dadas y registra cada operación.
   * Estructura de cada paso: { round, step, op, a, b, out, label, ka/kb }.
   */
  function crypt(blockWords, K, kn = 'Z') {
    let [X1, X2, X3, X4] = blockWords;
    const rounds = [];
    for (let r = 0; r < 8; r++) {
      const k = K.slice(6 * r, 6 * r + 6);
      const z = (i) => `${kn}${6 * r + i}`;   // nombre global de la subclave
      const input = [X1, X2, X3, X4];
      const s = [];
      const rec = (n, op, a, b, label, ka, kb, group) => {
        const out = op === 'mul' ? mul(a, b) : op === 'add' ? add(a, b) : xor(a, b);
        s.push({ n, op, a, b, out, label, ka, kb, group });
        return out;
      };
      // Capa de "transformación de entrada" con las subclaves Z1..Z4
      const t1 = rec(1, 'mul', X1, k[0], `X1 ⊙ ${z(1)}`, 'X1', z(1), 'key');
      const t2 = rec(2, 'add', X2, k[1], `X2 ⊞ ${z(2)}`, 'X2', z(2), 'key');
      const t3 = rec(3, 'add', X3, k[2], `X3 ⊞ ${z(3)}`, 'X3', z(3), 'key');
      const t4 = rec(4, 'mul', X4, k[3], `X4 ⊙ ${z(4)}`, 'X4', z(4), 'key');
      // Entradas de la caja MA
      const t5 = rec(5, 'xor', t1, t3, '(1) ⊕ (3)', '(1)', '(3)', 'ma-in');
      const t6 = rec(6, 'xor', t2, t4, '(2) ⊕ (4)', '(2)', '(4)', 'ma-in');
      // Caja MA (multiplicación–adición)
      const t7 = rec(7, 'mul', t5, k[4], `(5) ⊙ ${z(5)}`, '(5)', z(5), 'ma');
      const t8 = rec(8, 'add', t6, t7, '(6) ⊞ (7)', '(6)', '(7)', 'ma');
      const t9 = rec(9, 'mul', t8, k[5], `(8) ⊙ ${z(6)}`, '(8)', z(6), 'ma');
      const t10 = rec(10, 'add', t7, t9, '(7) ⊞ (9)', '(7)', '(9)', 'ma');
      // Mezcla de salida de la ronda
      const t11 = rec(11, 'xor', t1, t9, '(1) ⊕ (9)', '(1)', '(9)', 'out');
      const t12 = rec(12, 'xor', t3, t9, '(3) ⊕ (9)', '(3)', '(9)', 'out');
      const t13 = rec(13, 'xor', t2, t10, '(2) ⊕ (10)', '(2)', '(10)', 'out');
      const t14 = rec(14, 'xor', t4, t10, '(4) ⊕ (10)', '(4)', '(10)', 'out');
      // Por posición, la ronda produce (11, 13, 12, 14): el paso 13 queda en la
      // línea de X2 y el 12 en la de X3. Luego se cruzan los bloques centrales,
      // con lo que la salida es (11, 12, 13, 14). La ronda 8 no cruza (o, de
      // forma equivalente, la transformación final deshace el cruce).
      const swap = r < 7;
      const output = swap ? [t11, t12, t13, t14] : [t11, t13, t12, t14];
      rounds.push({ round: r + 1, subkeys: k, subkeyIndex: 6 * r, keyName: kn, input, steps: s, output, swap });
      [X1, X2, X3, X4] = output;
    }
    // Transformación de salida (media ronda) con Z49..Z52
    const k = K.slice(48, 52);
    const input = [X1, X2, X3, X4];
    const steps = [
      { n: 1, op: 'mul', a: X1, b: k[0], out: mul(X1, k[0]), label: `X1 ⊙ ${kn}49`, ka: 'X1', kb: `${kn}49`, group: 'key' },
      { n: 2, op: 'add', a: X2, b: k[1], out: add(X2, k[1]), label: `X2 ⊞ ${kn}50`, ka: 'X2', kb: `${kn}50`, group: 'key' },
      { n: 3, op: 'add', a: X3, b: k[2], out: add(X3, k[2]), label: `X3 ⊞ ${kn}51`, ka: 'X3', kb: `${kn}51`, group: 'key' },
      { n: 4, op: 'mul', a: X4, b: k[3], out: mul(X4, k[3]), label: `X4 ⊙ ${kn}52`, ka: 'X4', kb: `${kn}52`, group: 'key' },
    ];
    const output = steps.map((x) => x.out);
    const final = { round: 9, subkeys: k, subkeyIndex: 48, keyName: kn, input, steps, output, swap: false };
    return { input: blockWords.slice(), rounds, final, output };
  }

  /* ---------------- API pública ---------------------------------------- */

  function encryptWords(block, key) {
    const { Z } = expandKey(key);
    return crypt(block, Z).output;
  }

  function decryptWords(block, key) {
    const { Z } = expandKey(key);
    return crypt(block, decryptSubkeys(Z).U).output;
  }

  /** Cifra o descifra un bloque hex de 64 bits con una clave hex de 128 bits. */
  function encryptHex(blockHex, keyHex) {
    return wordsToHex(encryptWords(hexToWords(blockHex, 4), hexToWords(keyHex, 8)), '');
  }
  function decryptHex(blockHex, keyHex) {
    return wordsToHex(decryptWords(hexToWords(blockHex, 4), hexToWords(keyHex, 8)), '');
  }

  /** Traza completa de cifrado y descifrado para las visualizaciones. */
  function trace(blockHex, keyHex, mode = 'encrypt') {
    const block = hexToWords(blockHex, 4);
    const key = hexToWords(keyHex, 8);
    const { Z, groups } = expandKey(key);
    const { U, origin } = decryptSubkeys(Z);
    const K = mode === 'decrypt' ? U : Z;
    return { mode, block, key, Z, U, origin, groups, ...crypt(block, K, mode === 'decrypt' ? 'U' : 'Z') };
  }

  /** Vector de prueba de referencia (Lai, 1992; reproducido en Schneier, 1996). */
  const REFERENCE_VECTOR = Object.freeze({
    key: '00010002000300040005000600070008',
    plaintext: '0000000100020003',
    ciphertext: '11FBED2B01986DE5',
  });

  return {
    MOD_ADD, MOD_MUL,
    xor, add, mul, addInv, mulInv,
    hex16, bin16, cleanHex, hexToWords, wordsToHex,
    rotl25, expandKey, decryptSubkeys, crypt,
    encryptWords, decryptWords, encryptHex, decryptHex, trace,
    REFERENCE_VECTOR,
  };
});
