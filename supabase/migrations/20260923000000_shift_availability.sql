-- Reserva de horarios de titulares y reemplazantes. docs/turnos.md.
begin;
create extension if not exists btree_gist with schema extensions;

alter table public.shifts add column guard_start time;
-- Una guardia histórica sin horario debe aclararse antes de migrar; no se infiere.
alter table public.shifts add constraint shifts_guard_start_valid check (
  (shift_type = 'guardia' and guard_start is not null and guard_start < time '24:00') or
  (shift_type <> 'guardia' and guard_start is null)
);
alter table public.shifts add constraint shifts_franco_not_absent check (
  shift_type <> 'franco' or status <> 'absent'
);

create function public.shift_period(p_date date, p_type text, p_guard_start time)
returns tsrange language sql immutable set search_path = '' as $$
  select case p_type
    when 'manana' then tsrange(p_date + time '07:00', p_date + time '15:00', '[)')
    when 'tarde' then tsrange(p_date + time '15:00', p_date + time '23:00', '[)')
    when 'noche' then tsrange(p_date + time '23:00', (p_date + 1) + time '07:00', '[)')
    when 'guardia' then tsrange(p_date + p_guard_start, p_date + p_guard_start + interval '12 hours', '[)')
    when 'franco' then tsrange(p_date::timestamp, (p_date + 1)::timestamp, '[)')
  end;
$$;
revoke all on function public.shift_period from public, anon, authenticated, service_role;

create table public.shift_reservations (
  shift_id uuid not null references public.shifts(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  occupied tsrange not null check (not isempty(occupied)),
  primary key (shift_id, employee_id),
  -- La exclusión coordina también inserciones simultáneas en filas distintas.
  constraint shift_reservations_no_overlap exclude using gist (
    employee_id extensions.gist_uuid_ops with =, occupied with &&
  )
);
alter table public.shift_reservations enable row level security;
revoke all on public.shift_reservations from public, anon, authenticated, service_role;

create function public.sync_shift_reservations()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.shift_reservations where shift_id = new.id;
  if new.status <> 'cancelled' then
    insert into public.shift_reservations(shift_id, employee_id, occupied)
    select new.id, empleado, public.shift_period(new.shift_date, new.shift_type, new.guard_start)
    from unnest(array[new.employee_id, new.covered_by_employee_id]) as empleado
    where empleado is not null order by empleado;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_shift_reservations from public, anon, authenticated, service_role;
create trigger shifts_reservations after insert or update on public.shifts
for each row execute function public.sync_shift_reservations();

-- Si hay conflictos previos, se revierte la migración entera sin borrar ni mover turnos.
insert into public.shift_reservations(shift_id, employee_id, occupied)
select s.id, empleado, public.shift_period(s.shift_date, s.shift_type, s.guard_start)
from public.shifts s cross join lateral
  unnest(array[s.employee_id, s.covered_by_employee_id]) as empleado
where s.status <> 'cancelled' and empleado is not null;
drop index public.shifts_unique_employee_slot;

drop policy shifts_read on public.shifts;
create policy shifts_read on public.shifts for select to authenticated
using ((select public.has_permission('administration')));

drop function public.save_shift(uuid, uuid, date, text, text);
create function public.save_shift(
  p_id uuid default null,
  p_employee_id uuid default null,
  p_shift_date date default null,
  p_shift_type text default null,
  p_notes text default null,
  p_guard_start time default null,
  p_expected_updated_at timestamptz default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := coalesce(p_id, gen_random_uuid());
  v_previous public.shifts;
begin
  perform public.require_permission('administration');
  if p_id is null then
    insert into public.shifts(id, employee_id, shift_date, shift_type, guard_start, notes)
    values(v_id, p_employee_id, p_shift_date, p_shift_type, p_guard_start, nullif(btrim(p_notes), ''));
  else
    select * into v_previous from public.shifts where id = p_id for update;
    if not found then raise exception 'shift_not_found' using errcode = 'P0002'; end if;
    if p_expected_updated_at is null or p_expected_updated_at <> v_previous.updated_at then
      raise exception 'shift_changed' using errcode = '40001';
    end if;
    if v_previous.status not in ('scheduled', 'absent') then
      raise exception 'shift_not_editable' using errcode = '23514';
    end if;
    if v_previous.status = 'absent' and p_shift_type = 'franco' then
      raise exception 'franco_cannot_be_covered' using errcode = '23514';
    end if;
    update public.shifts set employee_id = p_employee_id, shift_date = p_shift_date,
      shift_type = p_shift_type, guard_start = p_guard_start, notes = nullif(btrim(p_notes), '')
    where id = p_id;
  end if;
  return v_id;
end;
$$;
revoke all on function public.save_shift from public, anon, authenticated, service_role;
grant execute on function public.save_shift to authenticated;

drop function public.cover_shift(uuid, uuid, text, text);
create function public.cover_shift(
  p_shift_id uuid, p_covered_by_employee_id uuid, p_absence_reason text,
  p_notes text default null, p_expected_updated_at timestamptz default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare v_previous public.shifts;
begin
  perform public.require_permission('administration');
  select * into v_previous from public.shifts where id = p_shift_id for update;
  if not found then raise exception 'shift_not_found' using errcode = 'P0002'; end if;
  if p_expected_updated_at is null or p_expected_updated_at <> v_previous.updated_at then
    raise exception 'shift_changed' using errcode = '40001';
  end if;
  if v_previous.status not in ('scheduled', 'absent') then
    raise exception 'shift_not_editable' using errcode = '23514';
  end if;
  if v_previous.shift_type = 'franco' then
    raise exception 'franco_cannot_be_covered' using errcode = '23514';
  end if;
  update public.shifts set status = 'absent', covered_by_employee_id = p_covered_by_employee_id,
    absence_reason = btrim(p_absence_reason), notes = coalesce(nullif(btrim(p_notes), ''), notes)
  where id = p_shift_id;
end;
$$;
revoke all on function public.cover_shift from public, anon, authenticated, service_role;
grant execute on function public.cover_shift to authenticated;

drop function public.cancel_shift(uuid);
create function public.cancel_shift(p_shift_id uuid, p_expected_updated_at timestamptz default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_previous public.shifts;
begin
  perform public.require_permission('administration');
  select * into v_previous from public.shifts where id = p_shift_id for update;
  if not found then raise exception 'shift_not_found' using errcode = 'P0002'; end if;
  if p_expected_updated_at is null or p_expected_updated_at <> v_previous.updated_at then
    raise exception 'shift_changed' using errcode = '40001';
  end if;
  if v_previous.status <> 'scheduled' then
    raise exception 'shift_not_editable' using errcode = '23514';
  end if;
  update public.shifts set status = 'cancelled' where id = p_shift_id;
end;
$$;
revoke all on function public.cancel_shift from public, anon, authenticated, service_role;
grant execute on function public.cancel_shift to authenticated;
commit;
