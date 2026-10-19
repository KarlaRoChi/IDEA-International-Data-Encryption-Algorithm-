// Pruebas del canal cifrado del control remoto (modo MQTT). Ejecutar con:  npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const SC = require('../js/remote/securechannel.js');

const FAST = 1000; // iteraciones reducidas SOLO para que las pruebas sean rápidas

test('mismo código → mismo tema; otro código → otro tema; el tema no contiene el código', async () => {
  const a = await SC.deriveRoom('ABCDEFGH', FAST);
  const b = await SC.deriveRoom('abcdefgh', FAST);
  const c = await SC.deriveRoom('ABCDEFGJ', FAST);
  assert.equal(a.topic, b.topic);
  assert.notEqual(a.topic, c.topic);
  assert.match(a.topic, /^idea-remote\/v1\/[0-9a-f]{32}$/);
  assert.doesNotMatch(a.topic, /ABCDEFGH/i);
});

test('cifrar y descifrar recupera el mensaje; dos cifrados del mismo mensaje difieren', async () => {
  const { key } = await SC.deriveRoom('ABCDEFGH', FAST);
  const msg = { ev: 'cmd', payload: { t: 'CMD', cmd: 'NEXT' }, from: 'abc123' };
  const s1 = await SC.seal(key, msg);
  const s2 = await SC.seal(key, msg);
  assert.notEqual(s1, s2, 'IV aleatorio');
  assert.deepEqual(await SC.open(key, s1), msg);
  assert.doesNotMatch(s1, /NEXT|cmd/);
});

test('un mensaje alterado, falso o con otra clave se rechaza', async () => {
  const { key } = await SC.deriveRoom('ABCDEFGH', FAST);
  const other = (await SC.deriveRoom('ZZZZZZZZ', FAST)).key;
  const sealed = await SC.seal(key, { ev: 'state', payload: { slide: 3 } });
  const raw = Buffer.from(sealed, 'base64'); raw[20] ^= 1;
  assert.equal(await SC.open(key, raw.toString('base64')), null, 'alterado');
  assert.equal(await SC.open(other, sealed), null, 'otra clave');
  assert.equal(await SC.open(key, 'no es base64 válido!!'), null, 'basura');
  assert.equal(await SC.open(key, Buffer.from(JSON.stringify({ ev: 'cmd' })).toString('base64')), null, 'texto en claro');
});

test('la derivación real usa 300 000 iteraciones de PBKDF2', () => {
  assert.equal(SC.ITERATIONS, 300000);
});
