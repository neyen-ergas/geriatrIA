-- Sprint 2 — Residentes, habitaciones y contactos.
-- Modela explícitamente cliente ≠ residente: el responsable de pago vive en
-- contacto_residente con un flag, no en la ficha del residente.

create table habitacion (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  sede_id uuid not null references sede(id) on delete cascade,
  numero text not null,
  capacidad int not null default 1 check (capacidad > 0),
  creado_en timestamptz not null default now(),
  unique (sede_id, numero)
);

create table residente (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  sede_id uuid not null references sede(id) on delete cascade,
  habitacion_id uuid references habitacion(id) on delete set null,
  nombre text not null,
  apellido text not null,
  dni text,
  fecha_nacimiento date,
  sexo text check (sexo in ('F', 'M', 'X')),
  observaciones text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create index residente_sede_idx on residente(sede_id) where activo;

create table contacto_residente (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  residente_id uuid not null references residente(id) on delete cascade,
  nombre text not null,
  relacion text,
  telefono text,
  email text,
  es_responsable_pago boolean not null default false,
  creado_en timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table habitacion enable row level security;
alter table habitacion force row level security;
alter table residente enable row level security;
alter table residente force row level security;
alter table contacto_residente enable row level security;
alter table contacto_residente force row level security;

-- habitacion: lectura para todo el staff; escritura owner/admin/enfermeria.
create policy habitacion_select on habitacion for select to authenticated
  using (organizacion_id = auth_organizacion_id());
create policy habitacion_insert on habitacion for insert to authenticated
  with check (organizacion_id = auth_organizacion_id() and auth_es_gestor());
create policy habitacion_update on habitacion for update to authenticated
  using (organizacion_id = auth_organizacion_id() and auth_es_gestor())
  with check (organizacion_id = auth_organizacion_id() and auth_es_gestor());

-- residente: lectura para todo el staff; escritura owner/admin/enfermeria.
-- Sin DELETE: los residentes se dan de baja con activo=false, no se borran.
create policy residente_select on residente for select to authenticated
  using (organizacion_id = auth_organizacion_id());
create policy residente_insert on residente for insert to authenticated
  with check (organizacion_id = auth_organizacion_id() and auth_es_gestor());
create policy residente_update on residente for update to authenticated
  using (organizacion_id = auth_organizacion_id() and auth_es_gestor())
  with check (organizacion_id = auth_organizacion_id() and auth_es_gestor());

-- contacto_residente: idem residente.
create policy contacto_select on contacto_residente for select to authenticated
  using (organizacion_id = auth_organizacion_id());
create policy contacto_insert on contacto_residente for insert to authenticated
  with check (organizacion_id = auth_organizacion_id() and auth_es_gestor());
create policy contacto_update on contacto_residente for update to authenticated
  using (organizacion_id = auth_organizacion_id() and auth_es_gestor())
  with check (organizacion_id = auth_organizacion_id() and auth_es_gestor());

-- ─────────────────────────────────────────────────────────────
-- Auditoría sobre tablas sensibles.
-- ─────────────────────────────────────────────────────────────
create trigger audit_residente
  after insert or update or delete on residente
  for each row execute function audit_row();
create trigger audit_contacto
  after insert or update or delete on contacto_residente
  for each row execute function audit_row();
