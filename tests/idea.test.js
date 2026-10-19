// Pruebas del núcleo IDEA. Ejecutar con:  npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const IDEA = require('../js/idea/idea.js');
const vectors = require('./openssl-vectors.json');

test('vector de referencia de Lai (1992): 0001..0008 / 0000 0001 0002 0003', () => {
  const v = IDEA.REFERENCE_VECTOR;
  assert.equal(IDEA.encryptHex(v.plaintext, v.key), v.ciphertext);
  assert.equal(IDEA.decryptHex(v.ciphertext, v.key), v.plaintext);
});

test('subclaves Z1..Z52 del vector de referencia (rotaciones de 25 bits)', () => {
  const { Z } = IDEA.expandKey(IDEA.hexToWords(IDEA.REFERENCE_VECTOR.key, 8));
  assert.equal(Z.length, 52);
  // Z1..Z8 son la clave tal cual
  assert.deepEqual(Z.slice(0, 8), [1, 2, 3, 4, 5, 6, 7, 8]);
  // Z9..Z16: clave rotada 25 bits a la izquierda
  assert.deepEqual(IDEA.wordsToHex(Z.slice(8, 16)), '0400 0600 0800 0A00 0C00 0E00 1000 0200');
  // Z49..Z52 (cuatro primeras palabras tras 6 rotaciones = 150 bits)
  const k = IDEA.hexToWords(IDEA.REFERENCE_VECTOR.key, 8);
  let r = k; for (let i = 0; i < 6; i++) r = IDEA.rotl25(r);
  assert.deepEqual(Z.slice(48), r.slice(0, 4));
});

test(`${vectors.length} vectores independientes generados con OpenSSL (idea-ecb)`, () => {
  for (const v of vectors) {
    assert.equal(IDEA.encryptHex(v.plaintext, v.key), v.ciphertext.toUpperCase(), `cifrado ${v.key}/${v.plaintext}`);
    assert.equal(IDEA.decryptHex(v.ciphertext, v.key), v.plaintext.toUpperCase(), `descifrado ${v.key}/${v.ciphertext}`);
  }
});

test('multiplicación mod 2^16+1: tratamiento del cero (0 ≡ 2^16)', () => {
  assert.equal(IDEA.mul(0, 0), 1);          // (−1)(−1) = 1
  assert.equal(IDEA.mul(0, 1), 0);          // 2^16 · 1 = 2^16 -> 0
  assert.equal(IDEA.mul(0, 2), 0xffff);     // 2^17 mod 65537 = 65535
  assert.equal(IDEA.mul(0x8000, 2), 0);     // 2^16 -> 0
  assert.equal(IDEA.mul(0xffff, 0xffff), 4); // (−2)(−2) = 4
});

test('inversos: x ⊙ x^-1 = 1 y x ⊞ (−x) = 0 para las 65536 palabras', () => {
  for (let x = 0; x < 0x10000; x++) {
    assert.equal(IDEA.mul(x, IDEA.mulInv(x)), 1, `mulInv ${x}`);
    assert.equal(IDEA.add(x, IDEA.addInv(x)), 0, `addInv ${x}`);
  }
  assert.equal(IDEA.mulInv(0), 0);
  assert.equal(IDEA.mulInv(1), 1);
});

test('ida y vuelta con 500 bloques/clave pseudoaleatorios', () => {
  let s = 12345;
  const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) >>> 16) & 0xffff;
  for (let i = 0; i < 500; i++) {
    const key = Array.from({ length: 8 }, rnd);
    const pt = Array.from({ length: 4 }, rnd);
    assert.deepEqual(IDEA.decryptWords(IDEA.encryptWords(pt, key), key), pt);
  }
});

test('la traza es coherente: cada paso calcula su resultado y la salida coincide', () => {
  const v = IDEA.REFERENCE_VECTOR;
  const t = IDEA.trace(v.plaintext, v.key);
  assert.equal(t.rounds.length, 8);
  assert.equal(t.rounds[0].steps.length, 14);
  assert.equal(t.final.steps.length, 4);
  for (const r of t.rounds) {
    for (const st of r.steps) {
      const f = { mul: IDEA.mul, add: IDEA.add, xor: IDEA.xor }[st.op];
      assert.equal(st.out, f(st.a, st.b));
    }
  }
  assert.equal(IDEA.wordsToHex(t.output, ''), v.ciphertext);
  // El descifrado con la traza recorre el camino inverso
  const d = IDEA.trace(v.ciphertext, v.key, 'decrypt');
  assert.equal(IDEA.wordsToHex(d.output, ''), v.plaintext);
});

test('validación de entradas hexadecimales', () => {
  assert.throws(() => IDEA.hexToWords('123', 4));
  assert.throws(() => IDEA.hexToWords('XYZ0000000000000', 4));
  assert.deepEqual(IDEA.hexToWords('0x0000 0001-0002_0003', 4), [0, 1, 2, 3]);
});
