-- Vínculo explícito entre una cuenta y una ficha; docs/cuentas-empleados.md.
begin;

alter table public.user_access add column employee_id uuid references public.employees(id) on delete restrict;
alter table public.user_access add constraint user_access_employee_unique unique (employee_id);

create table public.employee_account_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  previous_employee_id uuid references public.employees(id) on delete restrict,
  employee_id uuid references public.employees(id) on delete restrict,
  changed_at timestamptz not null default clock_timestamp(),
  changed_by uuid not null references auth.users(id) on delete restrict
);
alter table public.employee_account_events enable row level security;
revoke all on public.employee_account_events from public, anon, authenticated;
grant select on public.employee_account_events to authenticated;
create policy employee_account_events_read on public.employee_account_events for select to authenticated
using ((select public.has_permission('administration')));

create function public.validate_employee_account()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Una baja puede conservar el vínculo suspendido, pero no se puede asignar
  -- una ficha inactiva ni volver a habilitar su cuenta.
  if new.employee_id is not null and
    (tg_op = 'INSERT' or new.employee_id is distinct from old.employee_id or new.enabled) then
    if exists (select 1 from public.employees where id = new.employee_id and terminated_at is not null) then
      raise exception 'employee_inactive' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.validate_employee_account() from public, anon, authenticated;
create trigger user_access_employee_valid before insert or update on public.user_access
for each row execute function public.validate_employee_account();

create function public.set_employee_account(p_user_id uuid, p_expected_updated_at timestamptz, p_employee_id uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_previous public.user_access%rowtype;
begin
  -- Mismo orden que permisos y cambios de personal para resolver carreras
  -- entre vínculo, baja y habilitación sin bloquear filas en orden opuesto.
  perform pg_catalog.pg_advisory_xact_lock(736194, 1);
  perform public.require_permission('administration');
  select * into v_previous from public.user_access where user_id = p_user_id for update;
  if not found then raise exception 'account_access_missing' using errcode = 'P0002'; end if;
  if v_previous.updated_at is distinct from p_expected_updated_at then
    raise exception 'access_changed' using errcode = '40001';
  end if;
  if v_previous.employee_id is not null and p_employee_id is not null and v_previous.employee_id <> p_employee_id then
    raise exception 'account_already_linked' using errcode = '23514';
  end if;
  if v_previous.employee_id is not distinct from p_employee_id then return; end if;
  update public.user_access set employee_id = p_employee_id, updated_by = auth.uid(),
    updated_at = greatest(clock_timestamp(), v_previous.updated_at + interval '1 microsecond')
  where user_id = p_user_id;
  insert into public.employee_account_events (user_id, previous_employee_id, employee_id, changed_by)
  values (p_user_id, v_previous.employee_id, p_employee_id, auth.uid());
end;
$$;
revoke all on function public.set_employee_account(uuid,timestamptz,uuid) from public, anon;
grant execute on function public.set_employee_account(uuid,timestamptz,uuid) to authenticated;

-- Se agregan columnas de respuesta; los consumidores anteriores las ignoran.
drop function public.list_user_access();
create function public.list_user_access()
returns table (user_id uuid, email text, role text, enabled boolean, updated_at timestamptz,
  employee_id uuid, employee_name text, employee_terminated_at date)
language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_permission('administration');
  return query select u.id, u.email::text, a.role, coalesce(a.enabled, false), a.updated_at,
    e.id, e.last_name || ', ' || e.first_name, e.terminated_at
    from auth.users u left join public.user_access a on a.user_id = u.id
    left join public.employees e on e.id = a.employee_id
    order by u.email, u.id;
end;
$$;
revoke all on function public.list_user_access() from public, anon;
grant execute on function public.list_user_access() to authenticated;

create or replace function public.save_employee(
  p_id uuid default null, p_expected_updated_at timestamptz default null,
  p_first_name text default null, p_last_name text default null, p_dni text default null,
  p_job_title text default null, p_hired_at date default null,
  p_birth_date date default null, p_phone text default null,
  p_email text default null, p_notes text default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_employee public.employees%rowtype; v_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(736194, 1);
  perform public.require_permission('administration');
  if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if p_id is null then
    if p_expected_updated_at is not null then raise exception 'invalid_employee_version' using errcode = '22023'; end if;
    insert into public.employees (first_name, last_name, dni, job_title, hired_at, birth_date, phone, email, notes)
    values (btrim(p_first_name), btrim(p_last_name), p_dni, btrim(p_job_title), p_hired_at,
      p_birth_date, nullif(btrim(p_phone), ''), nullif(btrim(p_email), ''), nullif(btrim(p_notes), '')) returning id into v_id;
  else
    select * into v_employee from public.employees where id = p_id for update;
    if not found then raise exception 'employee_not_found' using errcode = 'P0002'; end if;
    if v_employee.updated_at is distinct from p_expected_updated_at then
      raise exception 'employee_changed' using errcode = '40001';
    end if;
    update public.employees set first_name = btrim(p_first_name), last_name = btrim(p_last_name), dni = p_dni,
      job_title = btrim(p_job_title), hired_at = p_hired_at, birth_date = p_birth_date,
      phone = nullif(btrim(p_phone), ''), email = nullif(btrim(p_email), ''), notes = nullif(btrim(p_notes), '')
    where id = p_id returning id into v_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.terminate_employee(p_id uuid, p_expected_updated_at timestamptz, p_terminated_at date, p_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_employee public.employees%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(736194, 1);
  perform public.require_permission('administration');
  if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  select * into v_employee from public.employees where id = p_id for update;
  if not found then raise exception 'employee_not_found' using errcode = 'P0002'; end if;
  if v_employee.updated_at is distinct from p_expected_updated_at then
    raise exception 'employee_changed' using errcode = '40001';
  end if;
  if exists (select 1 from public.user_access where employee_id = p_id and enabled) then
    raise exception 'employee_access_enabled' using errcode = '23514';
  end if;
  if p_terminated_at is null then raise exception 'employee_termination_required' using errcode = '23514'; end if;
  update public.employees set terminated_at = p_terminated_at, termination_reason = btrim(p_reason) where id = p_id;
  return p_id;
end;
$$;

commit;
