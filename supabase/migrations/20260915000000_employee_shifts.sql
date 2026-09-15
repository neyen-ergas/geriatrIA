-- Turnos del personal: asignación, no-superposición y cobertura. docs/turnos.md.
begin;

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  shift_date date not null,
  shift_type text not null constraint shifts_type_valid check (
    shift_type in ('manana', 'tarde', 'noche', 'guardia', 'franco')
  ),
  status text not null default 'scheduled' constraint shifts_status_valid check (
    status in ('scheduled', 'completed', 'absent', 'cancelled')
  ),
  absence_reason text check (
    absence_reason is null or (char_length(btrim(absence_reason)) between 1 and 500)
  ),
  covered_by_employee_id uuid references public.employees(id) on delete restrict,
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,

  -- La ausencia exige motivo.
  constraint shifts_absence_valid check (
    (status <> 'absent' and absence_reason is null) or
    (status = 'absent' and nullif(btrim(absence_reason), '') is not null)
  ),
  -- La cobertura exige que quien cubre sea otra persona y que el titular esté ausente.
  constraint shifts_coverage_valid check (
    covered_by_employee_id is null or (
      status = 'absent' and covered_by_employee_id <> employee_id
    )
  )
);

-- Invariante: un empleado no puede tener dos turnos activos en la misma franja y fecha.
create unique index shifts_unique_employee_slot on public.shifts (
  employee_id, shift_date, shift_type
) where (status <> 'cancelled');

create index shifts_date_range on public.shifts (shift_date, shift_type);
create index shifts_employee_date on public.shifts (employee_id, shift_date desc);

alter table public.shifts enable row level security;
revoke all on public.shifts from public, anon, authenticated, service_role;
grant select on public.shifts to authenticated;

-- Lectura para todo el personal operativo (admin, management, readonly).
create policy shifts_read on public.shifts for select to authenticated
using ((select public.has_permission('operational.read')));

-- Trigger de integridad laboral y auditoría de timestamps.
create function public.guard_shift()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_emp record;
  v_cover record;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  -- Comprobar vigencia del empleado titular
  select hired_at, terminated_at into v_emp from public.employees where id = new.employee_id;
  if not found then
    raise exception 'employee_not_found' using errcode = '23503';
  end if;

  if new.shift_date < v_emp.hired_at or (v_emp.terminated_at is not null and new.shift_date > v_emp.terminated_at) then
    raise exception 'shift_outside_employment_dates' using errcode = '23514';
  end if;

  -- Si hay reemplazo, comprobar que el empleado que cubre esté activo
  if new.covered_by_employee_id is not null then
    select hired_at, terminated_at into v_cover from public.employees where id = new.covered_by_employee_id;
    if not found then
      raise exception 'covering_employee_not_found' using errcode = '23503';
    end if;
    if new.shift_date < v_cover.hired_at or (v_cover.terminated_at is not null and new.shift_date > v_cover.terminated_at) then
      raise exception 'covering_employee_inactive' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond');
  else
    new.created_by := auth.uid();
    new.created_at := clock_timestamp();
    new.updated_at := new.created_at;
  end if;

  new.updated_by := auth.uid();
  return new;
end;
$$;

revoke all on function public.guard_shift() from public, anon, authenticated;
create trigger shifts_guard before insert or update on public.shifts
for each row execute function public.guard_shift();

-- RPC: Guardar o asignar turno
create function public.save_shift(
  p_id uuid,
  p_employee_id uuid,
  p_shift_date date,
  p_shift_type text,
  p_notes text default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := coalesce(p_id, gen_random_uuid());
begin
  perform public.require_permission('administration');

  if p_id is null then
    insert into public.shifts (
      id, employee_id, shift_date, shift_type, notes, status
    ) values (
      v_id, p_employee_id, p_shift_date, p_shift_type, nullif(btrim(p_notes), ''), 'scheduled'
    );
  else
    update public.shifts
    set employee_id = p_employee_id,
        shift_date = p_shift_date,
        shift_type = p_shift_type,
        notes = nullif(btrim(p_notes), '')
    where id = p_id;
    if not found then
      raise exception 'shift_not_found' using errcode = 'P0002';
    end if;
  end if;

  return v_id;
end;
$$;

revoke all on function public.save_shift(uuid, uuid, date, text, text) from public, anon;
grant execute on function public.save_shift(uuid, uuid, date, text, text) to authenticated;

-- RPC: Registrar ausencia y cobertura
create function public.cover_shift(
  p_shift_id uuid,
  p_covered_by_employee_id uuid,
  p_absence_reason text,
  p_notes text default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_permission('administration');

  update public.shifts
  set status = 'absent',
      covered_by_employee_id = p_covered_by_employee_id,
      absence_reason = btrim(p_absence_reason),
      notes = coalesce(nullif(btrim(p_notes), ''), notes)
  where id = p_shift_id and status <> 'cancelled';

  if not found then
    raise exception 'shift_not_found_or_cancelled' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.cover_shift(uuid, uuid, text, text) from public, anon;
grant execute on function public.cover_shift(uuid, uuid, text, text) to authenticated;

-- RPC: Cancelar turno programado
create function public.cancel_shift(
  p_shift_id uuid
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_permission('administration');

  update public.shifts
  set status = 'cancelled'
  where id = p_shift_id and status = 'scheduled';

  if not found then
    raise exception 'shift_not_found_or_not_scheduled' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.cancel_shift(uuid) from public, anon;
grant execute on function public.cancel_shift(uuid) to authenticated;

commit;
