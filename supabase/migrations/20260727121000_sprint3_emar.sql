-- Sprint 3 — eMAR: medicamentos, prescripciones y administraciones.
-- Regla de negocio clave (del plan): el front NUNCA decide un estado clínico.
-- Registrar una toma va por RPC SECURITY DEFINER con validación adentro.
-- Un cuidador puede INSERT en administracion_medicamento pero NO UPDATE/DELETE
-- directo: corrige vía anotación (rol enfermeria), no reescribiendo historia.

create table medicamento (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  nombre text not null,
  droga text,
  presentacion text,
  creado_en timestamptz not null default now()
);

create table prescripcion (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  residente_id uuid not null references residente(id) on delete cascade,
  medicamento_id uuid not null references medicamento(id) on delete restrict,
  dosis text not null,
  horarios time[] not null default '{}',
  indicaciones text,
  fecha_inicio date not null default current_date,
  fecha_fin date,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

create table administracion_medicamento (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizacion(id) on delete cascade,
  prescripcion_id uuid not null references prescripcion(id) on delete cascade,
  residente_id uuid not null references residente(id) on delete cascade,
  programada_para timestamptz not null,
  estado estado_administracion not null default 'pendiente',
  motivo text,
  observacion text,
  registrada_por uuid references auth.users(id),
  registrada_en timestamptz,
  creado_en timestamptz not null default now(),
  -- Idempotencia: correr el generador dos veces no duplica tomas.
  unique (prescripcion_id, programada_para)
);

create index adm_org_prog_idx on administracion_medicamento(organizacion_id, programada_para);
create index adm_residente_idx on administracion_medicamento(residente_id, programada_para desc);

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table medicamento enable row level security;
alter table medicamento force row level security;
alter table prescripcion enable row level security;
alter table prescripcion force row level security;
alter table administracion_medicamento enable row level security;
alter table administracion_medicamento force row level security;

-- medicamento / prescripcion: lectura staff, escritura owner/admin/enfermeria.
create policy medicamento_select on medicamento for select to authenticated
  using (organizacion_id = auth_organizacion_id());
create policy medicamento_insert on medicamento for insert to authenticated
  with check (organizacion_id = auth_organizacion_id() and auth_es_gestor());
create policy medicamento_update on medicamento for update to authenticated
  using (organizacion_id = auth_organizacion_id() and auth_es_gestor())
  with check (organizacion_id = auth_organizacion_id() and auth_es_gestor());

create policy prescripcion_select on prescripcion for select to authenticated
  using (organizacion_id = auth_organizacion_id());
create policy prescripcion_insert on prescripcion for insert to authenticated
  with check (organizacion_id = auth_organizacion_id() and auth_es_gestor());
create policy prescripcion_update on prescripcion for update to authenticated
  using (organizacion_id = auth_organizacion_id() and auth_es_gestor())
  with check (organizacion_id = auth_organizacion_id() and auth_es_gestor());

-- administracion_medicamento: la tabla más sensible.
--  SELECT  → todo el staff de la organización (incluye cuidador).
--  INSERT  → cuidador + gestores (append: registrar una toma no programada).
--  UPDATE  → SOLO gestores (owner/admin/enfermeria). El cuidador NO.
--  DELETE  → nadie (no se borra historia clínica).
create policy adm_select on administracion_medicamento for select to authenticated
  using (organizacion_id = auth_organizacion_id());
create policy adm_insert on administracion_medicamento for insert to authenticated
  with check (
    organizacion_id = auth_organizacion_id()
    and (auth_tiene_rol('cuidador') or auth_es_gestor())
  );
create policy adm_update on administracion_medicamento for update to authenticated
  using (organizacion_id = auth_organizacion_id() and auth_es_gestor())
  with check (organizacion_id = auth_organizacion_id() and auth_es_gestor());

-- ─────────────────────────────────────────────────────────────
-- Auditoría sobre tablas sensibles del eMAR.
-- ─────────────────────────────────────────────────────────────
create trigger audit_prescripcion
  after insert or update or delete on prescripcion
  for each row execute function audit_row();
create trigger audit_administracion
  after insert or update or delete on administracion_medicamento
  for each row execute function audit_row();

-- ─────────────────────────────────────────────────────────────
-- RPC: generar_tomas_del_dia(sede, fecha). Idempotente.
-- En producción lo dispara pg_cron a las 00:05 hora local. Acá lo llama
-- el seed y podría llamarlo un job.
-- ─────────────────────────────────────────────────────────────
create or replace function generar_tomas_del_dia(p_sede_id uuid, p_fecha date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  r record;
begin
  for r in
    select p.id as prescripcion_id, p.residente_id, p.organizacion_id,
           unnest(p.horarios) as hora
    from prescripcion p
    join residente res on res.id = p.residente_id
    where res.sede_id = p_sede_id
      and p.activa
      and (p.fecha_inicio is null or p.fecha_inicio <= p_fecha)
      and (p.fecha_fin is null or p.fecha_fin >= p_fecha)
  loop
    insert into administracion_medicamento (
      organizacion_id, prescripcion_id, residente_id, programada_para, estado
    ) values (
      r.organizacion_id, r.prescripcion_id, r.residente_id,
      ((p_fecha + r.hora) at time zone 'America/Argentina/Buenos_Aires'),
      'pendiente'
    )
    on conflict (prescripcion_id, programada_para) do nothing;
    if found then v_count := v_count + 1; end if;
  end loop;
  return v_count;
end;
$$;

grant execute on function generar_tomas_del_dia(uuid, date) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- RPC: registrar_toma. Única vía por la que el front cambia un estado.
-- Corre como definer → puede actualizar aunque el cuidador no tenga
-- UPDATE directo, PERO valida rol y pertenencia a la organización adentro.
-- ─────────────────────────────────────────────────────────────
create or replace function registrar_toma(
  p_toma_id uuid,
  p_estado estado_administracion,
  p_motivo text default null,
  p_observacion text default null
)
returns administracion_medicamento
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := auth_organizacion_id();
  v_toma administracion_medicamento;
begin
  if v_org is null then
    raise exception 'Usuario sin organización';
  end if;
  if not (auth_tiene_rol('cuidador') or auth_es_gestor()) then
    raise exception 'El rol actual no puede registrar tomas';
  end if;
  if p_estado not in ('administrada', 'rechazada') then
    raise exception 'Estado inválido para registro manual: %', p_estado;
  end if;
  if p_estado = 'rechazada' and (p_motivo is null or length(trim(p_motivo)) = 0) then
    raise exception 'El rechazo requiere un motivo';
  end if;

  update administracion_medicamento
  set estado = p_estado,
      motivo = case when p_estado = 'rechazada' then p_motivo else null end,
      observacion = p_observacion,
      registrada_por = auth.uid(),
      registrada_en = now()
  where id = p_toma_id
    and organizacion_id = v_org
    and estado = 'pendiente'
  returning * into v_toma;

  if not found then
    raise exception 'Toma inexistente, fuera de tu organización o ya registrada';
  end if;

  return v_toma;
end;
$$;

grant execute on function registrar_toma(uuid, estado_administracion, text, text) to authenticated;
