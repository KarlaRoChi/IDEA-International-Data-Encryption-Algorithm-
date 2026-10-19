// Pruebas de contenido y reparto. Ejecutar con:  npm test
// Carga los archivos de diapositivas en un entorno aislado (sin navegador).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const ctx = { window: { Widgets: {} }, console };
ctx.window.window = ctx.window;
vm.createContext(ctx);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
load('js/config.js');
load('js/data/references.js');
const order = ['00-apertura.js', '01-contexto-fundamentos.js', '02-arquitectura-cifrado.js', '03-ejemplo-descifrado.js', '04-criptoanalisis-seguridad.js', '99-cierre.js'];
order.forEach((f) => load('js/slides/' + f));
const S = ctx.window.SLIDES;
const REFS = ctx.window.REFS;
const mins = (p) => S.filter((s) => (s.person || 0) === p).reduce((a, s) => a + s.minutes, 0);

test('index.html carga los mismos archivos de diapositivas, en el mismo orden', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const found = [...html.matchAll(/js\/slides\/([\w-]+\.js)/g)].map((m) => m[1]);
  assert.deepEqual(found, order);
});

test('orden estricto de los expositores: 0, 1…1, 2…2, 3…3, 4…4, 0', () => {
  const seq = S.map((s) => s.person || 0).filter((p, i, a) => i === 0 || p !== a[i - 1]);
  assert.deepEqual(Array.from(seq), [0, 1, 2, 3, 4, 0]);
});

test('cada bloque empieza con portada, termina con transición y tiene alguna demo', () => {
  for (const p of [1, 2, 3, 4]) {
    const b = S.filter((s) => s.person === p);
    assert.equal(b[0].type, 'cover', `bloque ${p}: portada`);
    assert.equal(b[b.length - 1].type, 'handoff', `bloque ${p}: transición/conclusión`);
    if (p < 4) assert.equal(b[b.length - 1].next, p + 1, `bloque ${p}: pasa al siguiente`);
    assert.ok(b.filter((s) => typeof s.mount === 'function').length >= 1, `bloque ${p}: interacción`);
  }
});

test('duración total 30–40 min y bloques equilibrados (≈8 min, ±1)', () => {
  const total = S.reduce((a, s) => a + s.minutes, 0);
  assert.ok(total >= 30 && total <= 40, `total ${total}`);
  for (const p of [1, 2, 3, 4]) {
    const m = mins(p);
    assert.ok(m >= 7 && m <= 9, `bloque ${p}: ${m} min`);
  }
});

test('todas las diapositivas tienen título, tiempo y notas del presentador', () => {
  for (const s of S) {
    assert.ok(s.title, s.id);
    assert.ok(s.minutes > 0, s.id);
    assert.ok(s.notes && s.notes.length > 40, `notas de ${s.id}`);
  }
});

test('las citas apuntan a referencias existentes con URL verificable', () => {
  for (const s of S) for (const r of s.refs || []) assert.ok(REFS.byId[r], `${s.id} cita ${r}`);
  for (const r of REFS.list) assert.match(r.url, /^https:\/\//, r.id);
  const used = new Set(S.flatMap((s) => s.refs || []));
  const unused = REFS.list.filter((r) => !used.has(r.id)).map((r) => r.id);
  assert.deepEqual(Array.from(unused), [], 'referencias sin citar en ninguna diapositiva');
});

test('los identificadores de diapositiva son únicos', () => {
  const ids = S.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('reparto de temas: palabras clave de cada bloque no aparecen como contenido de otro', () => {
  // Contenido visible (html), no notas: se buscan temas "propios" fuera de su bloque.
  const visible = (p) => S.filter((s) => s.person === p && s.type !== 'cover').map((s) => s.html || '').join(' ');
  const rules = [
    { owner: 4, re: /biclique|claves? débil|Sweet32|patente/i },
    { owner: 3, re: /11FB ED2B 0198 6DE5|inverso multiplicativo/i },
    { owner: 2, re: /rotaci[oó]n de 25|⋘\s*25|\\lll 25/i },
  ];
  for (const { owner, re } of rules) {
    for (const p of [1, 2, 3, 4]) if (p !== owner) assert.doesNotMatch(visible(p), re, `bloque ${p} invade el tema de ${owner}: ${re}`);
  }
});
