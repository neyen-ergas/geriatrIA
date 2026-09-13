-- Ficha laboral y bajas sin eliminación; docs/empleados.md.
begin;

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(btrim(first_name)) between 1 and 80),
  last_name text not null check (char_length(btrim(last_name)) between 1 and 80),
  dni text not null unique check (char_length(dni) between 1 and 30),
  birth_date date,
  phone text check (char_length(phone) <= 40),
  email text check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  job_title text not null check (char_length(btrim(job_title)) between 1 and 100),
  hired_at date not null,
  terminated_at date,
  termination_reason text,
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  -- La baja va completa y no puede preceder al alta; no se elimina la ficha.
  constraint employees_termination_valid check (
    (terminated_at is null and termination_reason is null) or
    (terminated_at is not null and terminated_at >= hired_at and
      termination_reason is not null and char_length(btrim(termination_reason)) between 1 and 1000)
  ),
  constraint employees_birth_valid check (birth_date is null or birth_date <= hired_at)
);
alter table public.employees enable row level security;
revoke all on public.employees from public, anon, authenticated;
grant select on public.employees to authenticated;
create policy employees_read on public.employees for select to authenticated
using ((select auth.uid()) is not null);
create index employees_status_name on public.employees ((terminated_at is null), last_name, first_name, id);

create function public.guard_employee()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_today date := (current_timestamp at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  new.dni := public.normalize_resident_dni(new.dni);
  if new.hired_at > v_today or new.terminated_at > v_today then
    raise exception 'employee_future_date' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' then
    if old.terminated_at is not null then raise exception 'employee_inactive' using errcode = '23514'; end if;
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
revoke all on function public.guard_employee() from public, anon, authenticated;
create trigger employees_guard before insert or update on public.employees
for each row execute function public.guard_employee();

create function public.save_employee(
  p_id uuid default null, p_expected_updated_at timestamptz default null,
  p_first_name text default null, p_last_name text default null, p_dni text default null,
  p_job_title text default null, p_hired_at date default null,
  p_birth_date date default null, p_phone text default null,
  p_email text default null, p_notes text default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_employee public.employees%rowtype; v_id uuid;
begin
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
revoke all on function public.save_employee(uuid,timestamptz,text,text,text,text,date,date,text,text,text) from public, anon;
grant execute on function public.save_employee(uuid,timestamptz,text,text,text,text,date,date,text,text,text) to authenticated;

create function public.terminate_employee(p_id uuid, p_expected_updated_at timestamptz, p_terminated_at date, p_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_employee public.employees%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  select * into v_employee from public.employees where id = p_id for update;
  if not found then raise exception 'employee_not_found' using errcode = 'P0002'; end if;
  if v_employee.updated_at is distinct from p_expected_updated_at then
    raise exception 'employee_changed' using errcode = '40001';
  end if;
  if p_terminated_at is null then raise exception 'employee_termination_required' using errcode = '23514'; end if;
  update public.employees set terminated_at = p_terminated_at, termination_reason = btrim(p_reason) where id = p_id;
  return p_id;
end;
$$;
revoke all on function public.terminate_employee(uuid,timestamptz,date,text) from public, anon;
grant execute on function public.terminate_employee(uuid,timestamptz,date,text) to authenticated;
commit;
