-- Fechas y estadías coherentes, también ante escrituras concurrentes.
-- Diseño, prevalidación y despliegue: docs/residentes-fechas-despliegue.md.
begin;

-- Impide escrituras entre la auditoría inicial y la instalación de los triggers.
lock table public.residents, public.admissions in share row exclusive mode;

do $$
begin
  if exists (
    select 1 from public.residents r
    where not isfinite(r.birth_date)
      or r.birth_date >
        (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date
  ) or exists (
    select 1 from public.admissions a
    join public.residents r on r.id = a.resident_id
    where not isfinite(a.admitted_at)
      or a.admitted_at < r.birth_date
      or a.admitted_at >
        (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date
      or (a.discharged_at is not null and (
        not isfinite(a.discharged_at)
        or a.discharged_at >
          (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date
      ))
  ) or exists (
    select 1 from public.admissions a
    join public.admissions b on b.resident_id = a.resident_id and a.id < b.id
    where (a.discharged_at is null or b.admitted_at < a.discharged_at)
      and (b.discharged_at is null or a.admitted_at < b.discharged_at)
  ) then
    raise exception 'resident_stays_require_review'
      using errcode = '23514',
        hint = 'Revisar docs/residentes-fechas-despliegue.md; no se modificaron datos.';
  end if;
end;
$$;

-- El día de negocio es el argentino, independientemente de la sesión SQL.
alter table public.residents
  add constraint residents_birth_date_valid check (
    isfinite(birth_date) and birth_date <=
      (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date
  );
alter table public.admissions
  add constraint admissions_admitted_date_valid check (
    isfinite(admitted_at) and admitted_at <=
      (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date
  ),
  add constraint admissions_discharged_date_valid check (
    discharged_at is null or (isfinite(discharged_at) and discharged_at <=
      (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date)
  );

create function public.serialize_resident_stays()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Una versión nueva de la persona serializa sus estadías y su nacimiento.
  -- FOR UPDATE solo no alcanza con snapshots de REPEATABLE READ.
  -- También actualiza residents.updated_at mediante el trigger existente.
  update public.residents set id = id where id = new.resident_id;
  return new;
end;
$$;

create function public.validate_resident_stays()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_resident_id uuid;
begin
  if tg_table_name = 'admissions' then
    v_resident_id = new.resident_id;
  else
    v_resident_id = new.id;
  end if;

  -- Se consulta el estado final: editar nacimiento e ingreso en la misma RPC
  -- puede tener un estado intermedio incompatible, pero debe confirmar coherente.
  if exists (
    select 1 from public.admissions a
    join public.residents r on r.id = a.resident_id
    where r.id = v_resident_id and a.admitted_at < r.birth_date
  ) then
    raise exception 'admissions_birth_date_valid'
      using errcode = '23514', constraint = 'admissions_birth_date_valid';
  end if;

  -- Los extremos pueden coincidir. Una estadía de duración cero puede estar
  -- en un extremo, pero no dentro de otra; no se descarta como rango vacío.
  if exists (
    select 1 from public.admissions a
    join public.admissions b on b.resident_id = a.resident_id and a.id < b.id
    where a.resident_id = v_resident_id
      and (a.discharged_at is null or b.admitted_at < a.discharged_at)
      and (b.discharged_at is null or a.admitted_at < b.discharged_at)
  ) then
    raise exception 'admissions_stays_overlap'
      using errcode = '23P01', constraint = 'admissions_stays_overlap';
  end if;
  return null;
end;
$$;

-- Solo los triggers pueden invocarlas. El contexto del propietario permite
-- comprobar toda la historia, sin ampliar los permisos ni las políticas RLS.
revoke all on function public.serialize_resident_stays()
  from public, anon, authenticated, service_role;
revoke all on function public.validate_resident_stays()
  from public, anon, authenticated, service_role;

create trigger admissions_serialize_stays
before insert or update on public.admissions
for each row execute function public.serialize_resident_stays();

create constraint trigger residents_validate_stays
  after insert or update on public.residents
  deferrable initially deferred
  for each row execute function public.validate_resident_stays();

-- También valida después de escribir la estadía si el cliente cambia las
-- restricciones a IMMEDIATE; el toque de la persona ocurre antes de escribir.
create constraint trigger admissions_validate_stays
  after insert or update on public.admissions
  deferrable initially deferred
  for each row execute function public.validate_resident_stays();

commit;
