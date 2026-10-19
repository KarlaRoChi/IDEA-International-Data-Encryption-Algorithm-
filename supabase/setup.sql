-- =====================================================================
-- Control remoto de la presentación IDEA · configuración de Supabase
-- Ejecutar UNA vez en: Supabase → SQL Editor → New query → Run.
--
-- Requisitos en el panel de Supabase (ver docs/CONTROL-REMOTO.md):
--   1. Authentication → Sign In / Providers → «Allow anonymous sign-ins»: ON
--   2. Realtime → Settings → desactivar «Allow public access»
--      (así solo funcionan canales PRIVADOS, sujetos a las políticas de abajo)
--
-- Modelo de seguridad:
--   * Cada dispositivo inicia una sesión ANÓNIMA (rol «authenticated»).
--   * El presentador crea una sala con create_remote_room(): id UUID aleatorio,
--     código de 8 caracteres (solo se guarda su hash SHA-256) y caducidad.
--   * Un control remoto entra con join_remote_room(código): límite de intentos
--     fallidos y de miembros por sala.
--   * Las tablas no son accesibles directamente (RLS sin políticas): todo pasa
--     por funciones SECURITY DEFINER con comprobaciones explícitas.
--   * Las políticas sobre realtime.messages solo dejan leer/escribir en el
--     canal «room:<uuid>» a sus miembros, mientras la sala esté abierta.
--   * Solo el presentador puede emitir los eventos «state» y «closed»;
--     los controles remotos solo pueden emitir «cmd» y «hello».
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------
create table if not exists public.remote_rooms (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null,
  code_hash   text not null unique,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  closed      boolean not null default false
);

create table if not exists public.remote_members (
  room_id    uuid not null references public.remote_rooms(id) on delete cascade,
  user_id    uuid not null,
  role       text not null check (role in ('presenter', 'remote')),
  joined_at  timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.remote_join_failures (
  user_id  uuid not null,
  at       timestamptz not null default now()
);
create index if not exists remote_join_failures_user_at on public.remote_join_failures (user_id, at);

-- RLS activado y SIN políticas: nadie lee ni escribe estas tablas desde el cliente.
alter table public.remote_rooms enable row level security;
alter table public.remote_members enable row level security;
alter table public.remote_join_failures enable row level security;
revoke all on public.remote_rooms, public.remote_members, public.remote_join_failures from anon, authenticated;

-- ---------------------------------------------------------------------
-- Crear sala (presentador)
-- ---------------------------------------------------------------------
create or replace function public.create_remote_room(p_ttl_minutes int default 180)
returns table (room_id uuid, code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
  v_bytes bytea;
  v_uuid bytea;
  v_id uuid;
  v_exp timestamptz;
  i int;
begin
  if auth.uid() is null then
    raise exception 'Se requiere sesión';
  end if;
  -- Como máximo 3 salas abiertas por usuario
  if (select count(*) from public.remote_rooms r
        where r.owner = auth.uid() and not r.closed and r.expires_at > now()) >= 3 then
    raise exception 'Demasiadas salas abiertas';
  end if;

  v_exp := now() + make_interval(mins => least(greatest(coalesce(p_ttl_minutes, 180), 10), 360));

  loop
    v_code := '';
    -- Bytes aleatorios de gen_random_uuid() (generador fuerte de PostgreSQL),
    -- omitiendo los bytes 6 y 8, que contienen bits fijos de versión/variante.
    v_bytes := ''::bytea;
    for i in 1 .. 2 loop
      v_uuid := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
      v_bytes := v_bytes || substring(v_uuid from 1 for 6) || substring(v_uuid from 8 for 1) || substring(v_uuid from 10 for 7);
    end loop;
    for i in 0 .. length(v_bytes) - 1 loop
      -- 248 = 8·31: se descartan bytes altos para no sesgar la distribución
      if get_byte(v_bytes, i) < 248 and length(v_code) < 8 then
        v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % 31) + 1, 1);
      end if;
    end loop;
    exit when length(v_code) = 8
      and not exists (select 1 from public.remote_rooms r
                      where r.code_hash = encode(sha256(convert_to(v_code, 'UTF8')), 'hex'));
  end loop;

  insert into public.remote_rooms (owner, code_hash, expires_at)
  values (auth.uid(), encode(sha256(convert_to(v_code, 'UTF8')), 'hex'), v_exp)
  returning id into v_id;

  insert into public.remote_members (room_id, user_id, role) values (v_id, auth.uid(), 'presenter');

  return query select v_id, v_code, v_exp;
end;
$$;

-- ---------------------------------------------------------------------
-- Entrar en una sala (control remoto)
-- Devuelve status: 'ok' | 'invalid' | 'limit' | 'full'
-- (no se lanza excepción en los fallos para que el intento quede registrado)
-- ---------------------------------------------------------------------
create or replace function public.join_remote_room(p_code text)
returns table (room_id uuid, expires_at timestamptz, status text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_room public.remote_rooms%rowtype;
  v_fails int;
  v_members int;
begin
  if auth.uid() is null then
    raise exception 'Se requiere sesión';
  end if;

  select count(*) into v_fails from public.remote_join_failures f
   where f.user_id = auth.uid() and f.at > now() - interval '10 minutes';
  if v_fails >= 8 then
    return query select null::uuid, null::timestamptz, 'limit'::text;
    return;
  end if;

  select * into v_room from public.remote_rooms r
   where r.code_hash = encode(sha256(convert_to(upper(coalesce(p_code, '')), 'UTF8')), 'hex')
     and not r.closed and r.expires_at > now();

  if not found then
    insert into public.remote_join_failures (user_id) values (auth.uid());
    return query select null::uuid, null::timestamptz, 'invalid'::text;
    return;
  end if;

  select count(*) into v_members from public.remote_members m where m.room_id = v_room.id;
  if v_members >= 12 and not exists (select 1 from public.remote_members m
                                     where m.room_id = v_room.id and m.user_id = auth.uid()) then
    return query select null::uuid, null::timestamptz, 'full'::text;
    return;
  end if;

  insert into public.remote_members (room_id, user_id, role)
  values (v_room.id, auth.uid(), 'remote')
  on conflict do nothing;

  return query select v_room.id, v_room.expires_at, 'ok'::text;
end;
$$;

-- ---------------------------------------------------------------------
-- Cerrar sala (solo su presentador)
-- ---------------------------------------------------------------------
create or replace function public.close_remote_room(p_room uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.remote_rooms set closed = true
   where id = p_room and owner = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- Comprobación usada por las políticas de Realtime
-- ---------------------------------------------------------------------
create or replace function public.remote_room_role(p_topic text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
    from public.remote_members m
    join public.remote_rooms r on r.id = m.room_id
   where m.user_id = auth.uid()
     and 'room:' || r.id::text = p_topic
     and not r.closed
     and r.expires_at > now()
   limit 1;
$$;

revoke all on function public.create_remote_room(int) from public, anon;
revoke all on function public.join_remote_room(text) from public, anon;
revoke all on function public.close_remote_room(uuid) from public, anon;
revoke all on function public.remote_room_role(text) from public, anon;
grant execute on function public.create_remote_room(int) to authenticated;
grant execute on function public.join_remote_room(text) to authenticated;
grant execute on function public.close_remote_room(uuid) to authenticated;
grant execute on function public.remote_room_role(text) to authenticated;

-- ---------------------------------------------------------------------
-- Políticas de Realtime (canales privados)
-- ---------------------------------------------------------------------
drop policy if exists "idea_remote_read" on realtime.messages;
drop policy if exists "idea_remote_write" on realtime.messages;

-- Leer (recibir broadcast y presence): cualquier miembro de la sala abierta
create policy "idea_remote_read" on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension in ('broadcast', 'presence')
    and public.remote_room_role((select realtime.topic())) is not null
  );

-- Escribir: presence para todos los miembros; en broadcast, cada rol solo sus eventos
create policy "idea_remote_write" on realtime.messages
  for insert to authenticated
  with check (
    (
      realtime.messages.extension = 'presence'
      and public.remote_room_role((select realtime.topic())) is not null
    )
    or (
      realtime.messages.extension = 'broadcast'
      and (
        (realtime.messages.event in ('cmd', 'hello')
          and public.remote_room_role((select realtime.topic())) is not null)
        or (realtime.messages.event in ('state', 'closed')
          and public.remote_room_role((select realtime.topic())) = 'presenter')
      )
    )
  );

-- ---------------------------------------------------------------------
-- Limpieza opcional (ejecutar de vez en cuando o con pg_cron)
-- ---------------------------------------------------------------------
-- delete from public.remote_rooms where expires_at < now() - interval '1 day';
-- delete from public.remote_join_failures where at < now() - interval '1 day';
