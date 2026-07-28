-- Sprint 1 — Tenancy, roles, helpers de auth, auditoría y RLS base.
-- geriatrIA · multi-tenant desde el modelo de datos (organizacion_id + RLS).

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
create type rol_usuario as enum ('owner', 'admin', 'enfermeria', 'cuidador');
create type estado_administracion as enum ('pendiente', 'administrada', 'rechazada', 'omitida');

-- ─────────────────────────────────────────────────────────────
-- Tablas de tenancy
-- ─────────────────────────────────────────────────────────────
create table organizacion (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cuit text,
  creado_en timestamptz not null default now()
);

create table sede (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  nombre text not null,
  direccion text,
  -- Franjas horarias configurables (mañana/tarde/noche) para agrupar la vista de turno.
  turnos jsonb not null default '[
    {"clave":"manana","nombre":"Mañana","desde":"06:00","hasta":"14:00"},
    {"clave":"tarde","nombre":"Tarde","desde":"14:00","hasta":"22:00"},
    {"clave":"noche","nombre":"Noche","desde":"22:00","hasta":"06:00"}
  ]'::jsonb,
  creado_en timestamptz not null default now()
);

create table usuario_perfil (
  id uuid primary key references auth.users(id) on delete cascade,
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  nombre text not null,
  email text not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table usuario_rol (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  rol rol_usuario not null,
  sede_id uuid references sede(id) on delete cascade,
  creado_en timestamptz not null default now(),
  unique (usuario_id, rol)
);

-- ─────────────────────────────────────────────────────────────
-- Helpers de auth (SECURITY DEFINER, owned by postgres → bypassrls).
-- DEUDA TÉCNICA (Sprint 1 real): en producción esto se resuelve con el
-- Custom Access Token Hook inyectando organizacion_id/rol en el JWT y
-- leyendo del claim, en vez de una subquery por fila. Para el demo
-- (pocas filas) el costo es despreciable.
-- ─────────────────────────────────────────────────────────────
create or replace function auth_organizacion_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organizacion_id from usuario_perfil where id = auth.uid();
$$;

create or replace function auth_tiene_rol(p_rol rol_usuario)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from usuario_rol
    where usuario_id = auth.uid() and rol = p_rol
  );
$$;

-- owner/admin/enfermeria = pueden gestionar datos clínicos y de configuración.
create or replace function auth_es_gestor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from usuario_rol
    where usuario_id = auth.uid()
      and rol in ('owner', 'admin', 'enfermeria')
  );
$$;

-- Cualquier usuario con al menos un rol en la organización = staff.
create or replace function auth_es_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from usuario_rol where usuario_id = auth.uid()
  );
$$;

grant execute on function auth_organizacion_id() to authenticated;
grant execute on function auth_tiene_rol(rol_usuario) to authenticated;
grant execute on function auth_es_gestor() to authenticated;
grant execute on function auth_es_staff() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Auditoría: tabla append-only + trigger genérico.
-- ─────────────────────────────────────────────────────────────
create table audit_log (
  id bigint generated always as identity primary key,
  organizacion_id uuid,
  tabla text not null,
  operacion text not null,
  row_id text,
  usuario_id uuid,
  valores_viejos jsonb,
  valores_nuevos jsonb,
  ts timestamptz not null default now()
);

create index audit_log_org_idx on audit_log(organizacion_id, ts desc);

create or replace function audit_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_row_id text;
begin
  if (tg_op = 'DELETE') then
    v_org := (to_jsonb(old) ->> 'organizacion_id')::uuid;
    v_row_id := (to_jsonb(old) ->> 'id');
  else
    v_org := (to_jsonb(new) ->> 'organizacion_id')::uuid;
    v_row_id := (to_jsonb(new) ->> 'id');
  end if;

  insert into audit_log (
    organizacion_id, tabla, operacion, row_id, usuario_id,
    valores_viejos, valores_nuevos
  ) values (
    v_org,
    tg_table_name,
    tg_op,
    v_row_id,
    auth.uid(),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  if (tg_op = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- RLS: ENABLE + FORCE en todas las tablas. Sin excepciones.
-- ─────────────────────────────────────────────────────────────
alter table organizacion enable row level security;
alter table organizacion force row level security;
alter table sede enable row level security;
alter table sede force row level security;
alter table usuario_perfil enable row level security;
alter table usuario_perfil force row level security;
alter table usuario_rol enable row level security;
alter table usuario_rol force row level security;
alter table audit_log enable row level security;
alter table audit_log force row level security;

-- organizacion: solo la propia, solo lectura.
create policy organizacion_select on organizacion
  for select to authenticated
  using (id = auth_organizacion_id());

-- sede: solo lectura de la propia organización.
create policy sede_select on sede
  for select to authenticated
  using (organizacion_id = auth_organizacion_id());

-- usuario_perfil: lectura de perfiles de la misma organización.
create policy usuario_perfil_select on usuario_perfil
  for select to authenticated
  using (organizacion_id = auth_organizacion_id());

-- usuario_rol: lectura de roles de la misma organización.
create policy usuario_rol_select on usuario_rol
  for select to authenticated
  using (organizacion_id = auth_organizacion_id());

-- audit_log: solo owner/admin leen la auditoría de su organización.
-- Sin políticas de INSERT/UPDATE/DELETE → append-only (lo escribe el trigger,
-- que corre como definer/bypassrls). Nadie puede reescribir historia.
create policy audit_log_select on audit_log
  for select to authenticated
  using (
    organizacion_id = auth_organizacion_id()
    and (auth_tiene_rol('owner') or auth_tiene_rol('admin'))
  );
