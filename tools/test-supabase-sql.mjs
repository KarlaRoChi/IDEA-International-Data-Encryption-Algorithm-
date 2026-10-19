// Prueba de supabase/setup.sql en PostgreSQL real (PGlite = PostgreSQL en WebAssembly).
// Simula lo mínimo de Supabase: roles anon/authenticated, auth.uid(),
// realtime.messages con RLS y realtime.topic().
//
// Uso (fuera del repo, en una carpeta con PGlite instalado):
//   npm install @electric-sql/pglite@0.2.17
//   node tools/test-supabase-sql.mjs <ruta a supabase/setup.sql>
// LIMITACIÓN: valida el SQL y la lógica de las políticas, pero no el servidor
// Realtime real de Supabase (que aplica estas políticas al unirse al canal).
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
const sqlPath = process.argv[2];
const db = new PGlite();
let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('✔', name); } else { fail++; console.log('✖', name); } };
const tryq = async (q, p) => { try { return { rows: (await db.query(q, p)).rows }; } catch (e) { return { error: e.message }; } };

// ---------- Simulación mínima del entorno de Supabase ----------
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema extensions; create schema auth; create schema realtime;
  grant usage on schema public, extensions, auth, realtime to anon, authenticated;
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function realtime.topic() returns text language sql stable as
    $$ select current_setting('realtime.topic', true) $$;
  create table realtime.messages (
    id bigserial primary key, topic text not null, extension text not null,
    event text, payload jsonb, private boolean default true, inserted_at timestamptz default now());
  alter table realtime.messages enable row level security;
  grant select, insert on realtime.messages to authenticated;
  grant usage on sequence realtime.messages_id_seq to authenticated;
`);
await db.exec(fs.readFileSync(sqlPath, 'utf8'));
ok(true, 'setup.sql se ejecuta sin errores en PostgreSQL');
await db.exec(`grant execute on all functions in schema auth, realtime to authenticated;`);

const A = '11111111-1111-4111-8111-111111111111';   // presentador
const B = '22222222-2222-4222-8222-222222222222';   // compañero
const C = '33333333-3333-4333-8333-333333333333';   // intruso
async function as(user, topic) {
  await db.exec(`reset role;`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('realtime.topic', $2, false)`, [user || '', topic || '']);
  await db.exec(`set role authenticated;`);
}

// ---------- Crear sala ----------
await as(A);
const room = (await db.query(`select * from public.create_remote_room(60)`)).rows[0];
ok(room && /^[0-9a-f-]{36}$/.test(room.room_id), 'create_remote_room devuelve un UUID');
ok(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/.test(room.code), `código de 8 caracteres sin ambigüedades (${room.code})`);
const mins = (new Date(room.expires_at) - Date.now()) / 60000;
ok(mins > 58 && mins < 61, 'la sala caduca según el tiempo pedido');
const topic = 'room:' + room.room_id;

// ---------- Acceso directo a tablas: prohibido ----------
await as(B);
ok(!!(await tryq(`select * from public.remote_rooms`)).error, 'un cliente no puede leer remote_rooms directamente');
ok(!!(await tryq(`insert into public.remote_members values ($1, $2, 'presenter')`, [room.room_id, B])).error, 'un cliente no puede insertarse como miembro directamente');

// ---------- Unirse ----------
const bad = (await db.query(`select * from public.join_remote_room('ZZZZZZZZ')`)).rows[0];
ok(bad.status === 'invalid' && bad.room_id === null, 'código incorrecto → invalid');
const good = (await db.query(`select * from public.join_remote_room($1)`, [room.code.toLowerCase()])).rows[0];
ok(good.status === 'ok' && good.room_id === room.room_id, 'código correcto (aunque esté en minúsculas) → ok');

// ---------- Políticas de Realtime ----------
const ins = (ev, ext = 'broadcast') => tryq(`insert into realtime.messages (topic, extension, event, payload) values ($1, $2, $3, '{}')`, [topic, ext, ev]);
await as(B, topic);
ok(!(await ins('cmd')).error, 'un compañero puede enviar «cmd»');
ok(!(await ins('hello')).error, 'un compañero puede enviar «hello»');
ok(!!(await ins('state')).error, 'un compañero NO puede enviar «state» (suplantar al presentador)');
ok(!!(await ins('closed')).error, 'un compañero NO puede enviar «closed»');
ok(!(await ins(null, 'presence')).error, 'un compañero puede publicar su presencia');
ok((await tryq(`select count(*)::int n from realtime.messages`)).rows[0].n > 0, 'un compañero puede leer los mensajes de su sala');
await as(B, 'room:00000000-0000-4000-8000-000000000000');
const other = await tryq(`insert into realtime.messages (topic, extension, event) values ('room:00000000-0000-4000-8000-000000000000', 'broadcast', 'cmd')`);
ok(!!other.error, 'un compañero no puede escribir en otra sala');

await as(A, topic);
ok(!(await ins('state')).error, 'el presentador puede enviar «state»');
ok(!(await ins('closed')).error, 'el presentador puede enviar «closed»');

await as(C, topic);
ok(!!(await ins('cmd')).error, 'un intruso que conoce el UUID pero no el código NO puede enviar comandos');
ok((await tryq(`select count(*)::int n from realtime.messages`)).rows[0].n === 0, 'un intruso no puede leer los mensajes de la sala');
await as('', topic);
ok(!!(await tryq(`select * from public.create_remote_room(60)`)).error, 'sin sesión no se puede crear una sala');

// ---------- Límite de intentos fallidos ----------
await as(C);
let last;
for (let i = 0; i < 9; i++) last = (await db.query(`select * from public.join_remote_room('YYYYYYYY')`)).rows[0];
ok(last.status === 'limit', 'tras 8 intentos fallidos en 10 min → limit');
const blocked = (await db.query(`select * from public.join_remote_room($1)`, [room.code])).rows[0];
ok(blocked.status === 'limit', 'bloqueado incluso con el código correcto mientras dure el límite');

// ---------- Cierre ----------
await as(B);
await db.query(`select public.close_remote_room($1)`, [room.room_id]);
await as(B, topic);
ok(!(await ins('cmd')).error, 'un compañero NO puede cerrar la sala (sigue abierta)');
await as(A);
await db.query(`select public.close_remote_room($1)`, [room.room_id]);
await as(B, topic);
ok(!!(await ins('cmd')).error, 'tras cerrar la sala, los compañeros ya no pueden enviar comandos');
await as('44444444-4444-4444-8444-444444444444');
ok((await db.query(`select * from public.join_remote_room($1)`, [room.code])).rows[0].status === 'invalid', 'nadie puede entrar en una sala cerrada');

// ---------- Caducidad ----------
await as(A);
const r2 = (await db.query(`select * from public.create_remote_room(60)`)).rows[0];
await db.exec(`reset role;`);
await db.query(`update public.remote_rooms set expires_at = now() - interval '1 minute' where id = $1`, [r2.room_id]);
await as(B);
ok((await db.query(`select * from public.join_remote_room($1)`, [r2.code])).rows[0].status === 'invalid', 'una sala caducada no admite nuevos miembros');

// ---------- Límite de salas por usuario ----------
await as(A);
await db.query(`select * from public.create_remote_room(60)`);
await db.query(`select * from public.create_remote_room(60)`);
await db.query(`select * from public.create_remote_room(60)`);
ok(!!(await tryq(`select * from public.create_remote_room(60)`)).error, 'máximo 3 salas abiertas por usuario');

console.log(`\n${pass} superadas, ${fail} fallidas`);
process.exit(fail ? 1 : 0);
