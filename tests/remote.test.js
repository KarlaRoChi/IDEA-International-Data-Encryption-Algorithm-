// Pruebas del protocolo del control remoto. Ejecutar con:  npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../js/remote/protocol.js');

const A = 'remoteA123', B = 'remoteB456';
const cmd = (from, c, base, slide, action) => P.makeCommand(from, c, base, slide, action);

test('NEXT / PREVIOUS / inicio / fin / ir a N producen la acción correcta', () => {
  const h = new P.RemoteHost({ total: 10, index: 3 });
  let t = 0;
  assert.deepEqual(h.handle(cmd(A, 'NEXT', 0), (t += 1000)).action, { type: 'goto', index: 4 });
  assert.deepEqual(h.handle(cmd(A, 'PREVIOUS', 0), (t += 1000)).action, { type: 'goto', index: 2 });
  assert.deepEqual(h.handle(cmd(A, 'GO_TO_START', 0), (t += 1000)).action, { type: 'goto', index: 0 });
  assert.deepEqual(h.handle(cmd(A, 'GO_TO_END', 0), (t += 1000)).action, { type: 'goto', index: 9 });
  assert.deepEqual(h.handle(cmd(A, 'GOTO_SLIDE', 0, 7), (t += 1000)).action, { type: 'goto', index: 7 });
});

test('comandos inválidos o mal formados se rechazan', () => {
  const h = new P.RemoteHost({ total: 10 });
  const ok = cmd(A, 'NEXT', 0);
  const bad = [
    null, 'NEXT', {}, { ...ok, t: 'STATE' }, { ...ok, v: 99 }, { ...ok, cmd: 'DELETE_ALL' },
    { ...ok, id: 'x' }, { ...ok, id: '<script>' }, { ...ok, from: '' }, { ...ok, base: -1 }, { ...ok, base: 1.5 },
    { ...cmd(A, 'GOTO_SLIDE', 0, 2), slide: '2' }, { ...ok, slide: 3 }, { ...ok, a: 1, b: 2, c: 3 },
  ];
  for (const m of bad) assert.equal(h.handle(m, 1e6).ok, false, JSON.stringify(m));
});

test('saltos a diapositivas inexistentes se rechazan', () => {
  const h = new P.RemoteHost({ total: 10, index: 9 });
  assert.equal(h.handle(cmd(A, 'GOTO_SLIDE', 0, 10), 1000).reason, 'fuera-de-rango');
  assert.equal(h.handle(cmd(A, 'GOTO_SLIDE', 0, -1), 2000).reason, 'fuera-de-rango');
  assert.equal(h.handle(cmd(A, 'NEXT', 0), 3000).reason, 'limite');
});

test('comandos duplicados (mismo id) se aplican una sola vez', () => {
  const h = new P.RemoteHost({ total: 10 });
  const m = cmd(A, 'GOTO_SLIDE', 0, 5);
  assert.equal(h.handle(m, 1000).ok, true);
  assert.equal(h.handle({ ...m }, 2000).reason, 'duplicado');
});

test('pulsaciones demasiado rápidas: límite por dispositivo', () => {
  const h = new P.RemoteHost({ total: 100 });
  let accepted = 0;
  for (let i = 0; i < 20; i++) if (h.handle(cmd(A, 'GOTO_SLIDE', 0, i % 50 + 1), 1000 + i * 10).reason !== 'frecuencia') accepted++;
  assert.ok(accepted <= 4, `aceptados ${accepted}`);
});

test('dos personas pulsan «Siguiente» a la vez: solo avanza una diapositiva', () => {
  const h = new P.RemoteHost({ total: 10, index: 2 });
  const r1 = h.handle(cmd(A, 'NEXT', 0), 1000);
  assert.deepEqual(r1.action, { type: 'goto', index: 3 });
  h.localChange(3);                                 // la presentación aplicó el cambio (versión 1)
  const r2 = h.handle(cmd(B, 'NEXT', 0), 1010);     // B aún veía la versión 0
  assert.equal(r2.ok, false);
  assert.equal(r2.reason, 'obsoleto');
  assert.equal(h.index, 3);
});

test('comandos absolutos simultáneos: gana el último en llegar', () => {
  const h = new P.RemoteHost({ total: 10 });
  assert.deepEqual(h.handle(cmd(A, 'GOTO_SLIDE', 0, 4), 1000).action, { type: 'goto', index: 4 });
  h.localChange(4);
  assert.deepEqual(h.handle(cmd(B, 'GOTO_SLIDE', 0, 7), 1300).action, { type: 'goto', index: 7 });
});

test('pasos de demo: solo si el presentador los permite y la diapositiva tiene demo', () => {
  const h = new P.RemoteHost({ total: 10 });
  assert.equal(h.handle(cmd(A, 'DEMO_NEXT', 0), 1000, { hasDemo: true }).reason, 'demo-desactivada');
  h.allowDemo = true;
  assert.equal(h.handle(cmd(A, 'DEMO_NEXT', 0), 2000, { hasDemo: false }).reason, 'sin-demo');
  assert.deepEqual(h.handle(cmd(A, 'DEMO_NEXT', 0), 3000, { hasDemo: true }).action, { type: 'demo', op: 'next' });
  assert.equal(h.handle(cmd(A, 'DEMO_ALL', 0), 4000, { hasDemo: true, caps: {} }).reason, 'sin-accion');
  assert.deepEqual(h.handle(cmd(A, 'DEMO_ALL', 0), 5000, { hasDemo: true, caps: { all: true } }).action, { type: 'demo', op: 'all' });
  assert.deepEqual(h.handle(cmd(A, 'DEMO_RESET', 0), 6000, { hasDemo: true, caps: { reset: true } }).action, { type: 'demo', op: 'reset' });
  assert.equal(h.index, 0, 'un paso de demo no cambia de diapositiva');
});

test('sesión cerrada: no se aceptan más comandos', () => {
  const h = new P.RemoteHost({ total: 10 });
  h.closed = true;
  assert.equal(h.handle(cmd(A, 'NEXT', 0), 1000).reason, 'cerrada');
});

test('el control remoto ignora estados viejos, repetidos o fuera de orden', () => {
  const h = new P.RemoteHost({ total: 10 });
  const s0 = h.state({ title: 'a' });
  h.localChange(5);
  const s1 = h.state({ title: 'b' });
  h.localChange(6);
  const s2 = h.state({ title: 'c' });
  const tr = new P.StateTracker();
  assert.equal(tr.accept(s0), true);
  assert.equal(tr.accept(s2), true);
  assert.equal(tr.accept(s1), false, 'llega tarde: se ignora');
  assert.equal(tr.accept(s2), false, 'repetido');
  assert.equal(tr.state.slide, 6);
  assert.equal(tr.accept({ ...s2, version: 9, slide: 99 }), false, 'diapositiva inexistente');
});

test('reconexión: un estado antiguo no devuelve la presentación atrás', () => {
  const h = new P.RemoteHost({ total: 10 });
  h.localChange(8);
  const tr = new P.StateTracker();
  tr.accept(h.state());
  const old = { ...h.state(), version: 0, slide: 1 };
  assert.equal(tr.accept(old), false);
  assert.equal(tr.state.slide, 8);
});

test('DEMO_ACTION: ejecuta el control publicado si la etiqueta coincide y está activo', () => {
  const h = new P.RemoteHost({ total: 10, allowDemo: true });
  const actions = [{ l: '◀ Paso', d: true }, { l: 'Paso ▶' }, { l: 'Ejemplos: Vector de Lai (1992)' }];
  const act = (i, label, t) => h.handle(cmd(A, 'DEMO_ACTION', 0, undefined, { act: i, label }), t, { actions });
  assert.deepEqual(act(1, 'Paso ▶', 1000).action, { type: 'demo-action', index: 1 });
  assert.equal(act(0, '◀ Paso', 2000).reason, 'accion-desactivada');
  assert.equal(act(2, 'Otra cosa', 3000).reason, 'accion-desconocida');
  assert.equal(act(9, 'Paso ▶', 4000).reason, 'accion-desconocida');
  assert.equal(h.handle({ ...cmd(A, 'DEMO_ACTION', 0, undefined, { act: -1, label: 'x' }) }, 5000, { actions }).reason, 'accion');
  assert.equal(h.handle({ ...cmd(A, 'NEXT', 0), act: 1 }, 6000).reason, 'accion');
  h.allowDemo = false;
  assert.equal(act(1, 'Paso ▶', 7000).reason, 'demo-desactivada');
});

test('DEMO_ACTION con valor: deslizadores dentro de su rango y textos sin caracteres de control', () => {
  const h = new P.RemoteHost({ total: 10, allowDemo: true });
  const actions = [{ l: 'Bits', k: 'r', min: 40, max: 256, step: 1, v: '128' }, { l: 'Clave', k: 't', max: 32, v: '' }, { l: 'Paso ▶' }];
  let t = 0;
  const go = (i, label, value) => h.handle(cmd(A, 'DEMO_ACTION', 0, undefined, { act: i, label, value }), (t += 1000), { actions });
  assert.deepEqual(go(0, 'Bits', '64').action, { type: 'demo-action', index: 0, value: '64' });
  assert.equal(go(0, 'Bits', '300').reason, 'valor');
  assert.equal(go(0, 'Bits', 'abc').reason, 'valor');
  assert.equal(go(0, 'Bits', undefined).reason, 'valor');
  assert.deepEqual(go(1, 'Clave', '0001 0002').action, { type: 'demo-action', index: 1, value: '0001 0002' });
  assert.equal(go(1, 'Clave', 'A'.repeat(33)).reason, 'valor');
  assert.equal(go(1, 'Clave', 'ab\ncd').reason, 'valor');
  assert.equal(go(2, 'Paso ▶', 'x').reason, 'valor', 'un botón no acepta valor');
  assert.equal(h.handle({ ...cmd(A, 'DEMO_ACTION', 0, undefined, { act: 1, label: 'Clave' }), value: 'x'.repeat(201) }, (t += 1000), { actions }).reason, 'valor');
  assert.equal(h.handle({ ...cmd(A, 'NEXT', 0), value: '1' }, (t += 1000)).reason, 'accion');
});

test('DEMO_ACTION de una diapositiva anterior (versión vieja) se rechaza', () => {
  const h = new P.RemoteHost({ total: 10, allowDemo: true });
  h.localChange(4);
  const r = h.handle(cmd(A, 'DEMO_ACTION', 0, undefined, { act: 0, label: 'Paso ▶' }), 1000, { actions: [{ l: 'Paso ▶' }] });
  assert.equal(r.reason, 'obsoleto');
});

test('los cambios de la demo publican estados nuevos sin invalidar la navegación', () => {
  const h = new P.RemoteHost({ total: 10, allowDemo: true });
  const tr = new P.StateTracker();
  assert.equal(tr.accept(h.state({ demo: true, actions: [{ l: 'Paso ▶' }], status: '1 / 134' })), true);
  h.demoChange();
  const s2 = h.state({ demo: true, actions: [{ l: 'Paso ▶' }], status: '2 / 134' });
  assert.equal(tr.accept(s2), true);
  assert.equal(tr.state.status, '2 / 134');
  assert.equal(tr.accept(s2), false, 'repetido');
  assert.equal(h.version, 0, 'la versión de navegación no cambia');
  assert.equal(h.handle(cmd(A, 'NEXT', 0), 9000).ok, true, 'un «Siguiente» con la versión vista sigue siendo válido');
});

test('códigos de sala: 8 caracteres sin ambigüedades', () => {
  for (let i = 0; i < 200; i++) {
    const c = P.randomCode();
    assert.ok(P.isValidCode(c), c);
    assert.doesNotMatch(c, /[01ILO]/);
  }
  assert.equal(P.normalizeCode(' abcd-efgh '), 'ABCDEFGH');
  assert.equal(P.isValidCode('ABCD1234'), false);
});

test('cambiar un ajuste (permitir demos) publica un estado nuevo que los remotos aceptan', () => {
  const h = new P.RemoteHost({ total: 10 });
  const tr = new P.StateTracker();
  tr.accept(h.state({ demo: true }));
  assert.equal(tr.state.demo, false);
  h.allowDemo = true; h.touch();
  assert.equal(tr.accept(h.state({ demo: true })), true);
  assert.equal(tr.state.demo, true);
});
