-- Reintentos seguros y coordinación de bajas laborales con turnos. docs/turnos.md.
begin;

create table public.creation_requests (
  scope text not null check (scope in ('shift', 'interview')),
  request_id uuid not null,
  actor_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null,
  fingerprint text not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key (scope, request_id)
);
alter table public.creation_requests enable row level security;
revoke all on public.creation_requests from public, anon, authenticated, service_role;

create function public.begin_creation_request(p_scope text, p_request_id uuid, p_fingerprint text)
returns table(resource_id uuid, already_exists boolean)
language plpgsql security definer set search_path = '' as $$
declare v_request public.creation_requests;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if p_scope not in ('shift', 'interview') or p_request_id is null or p_fingerprint is null then
    raise exception 'creation_request_required' using errcode = '22023';
  end if;
  insert into public.creation_requests(scope, request_id, actor_id, resource_id, fingerprint)
  values(p_scope, p_request_id, auth.uid(), gen_random_uuid(), p_fingerprint)
  on conflict do nothing returning * into v_request;
  if found then
    return query select v_request.resource_id, false;
    return;
  end if;
  select * into v_request from public.creation_requests
  where scope = p_scope and request_id = p_request_id for update;
  if v_request.actor_id <> auth.uid() or v_request.fingerprint <> p_fingerprint then
    raise exception 'creation_request_reused' using errcode = '23505';
  end if;
  return query select v_request.resource_id, true;
end;
$$;
revoke all on function public.begin_creation_request from public, anon, authenticated, service_role;

create or replace function public.guard_shift()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_emp record;
  v_cover record;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  -- Comprobar vigencia del empleado titular
  select hired_at, terminated_at into v_emp from public.employees where id = new.employee_id for share;
  if not found then
    raise exception 'employee_not_found' using errcode = '23503';
  end if;

  if new.shift_date < v_emp.hired_at or (v_emp.terminated_at is not null and new.shift_date > v_emp.terminated_at) then
    raise exception 'shift_outside_employment_dates' using errcode = '23514';
  end if;

  -- Si hay reemplazo, comprobar que el empleado que cubre esté activo
  if new.covered_by_employee_id is not null then
    select hired_at, terminated_at into v_cover from public.employees where id = new.covered_by_employee_id for share;
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

drop function public.save_shift(uuid, uuid, date, text, text, time, timestamptz);
drop function public.save_interview(uuid, uuid, text, text, date, text, text, text,
  date, uuid, text, text, text, text, text, text, text, timestamptz);

create function public.save_shift(
  p_id uuid default null,
  p_employee_id uuid default null,
  p_shift_date date default null,
  p_shift_type text default null,
  p_notes text default null,
  p_guard_start time default null,
  p_expected_updated_at timestamptz default null,
  p_request_id uuid default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := coalesce(p_id, gen_random_uuid());
  v_previous public.shifts;
  v_replay boolean;
  v_fingerprint text;
begin
  perform public.require_permission('administration');
  if p_id is null then
    v_fingerprint := pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
      pg_catalog.jsonb_build_array(p_employee_id, p_shift_date, p_shift_type,
        nullif(btrim(p_notes), ''), p_guard_start)::text, 'UTF8')), 'hex');
    select resource_id, already_exists into v_id, v_replay
    from public.begin_creation_request('shift', p_request_id, v_fingerprint);
    if v_replay then return v_id; end if;
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

create function public.save_interview(
  p_id uuid default null,
  p_consultation_id uuid default null,
  p_candidate_name text default null,
  p_candidate_dni text default null,
  p_candidate_birth_date date default null,
  p_companion_name text default null,
  p_companion_phone text default null,
  p_companion_relationship text default null,
  p_interview_date date default null,
  p_interviewer_employee_id uuid default null,
  p_status text default null,
  p_mobility_assessment text default null,
  p_cognitive_assessment text default null,
  p_medical_notes text default null,
  p_social_notes text default null,
  p_conclusion text default null,
  p_rejection_reason text default null,
  p_expected_updated_at timestamptz default null,
  p_request_id uuid default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := coalesce(p_id, gen_random_uuid());
  v_user_id uuid := auth.uid();
  v_updated_at timestamptz;
  v_replay boolean;
  v_fingerprint text;
begin
  perform public.require_permission('administration');

  if p_id is null then
    v_fingerprint := pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
      pg_catalog.jsonb_build_array(p_consultation_id, p_candidate_name,
        p_candidate_dni, p_candidate_birth_date, p_companion_name, p_companion_phone,
        p_companion_relationship, p_interview_date, p_interviewer_employee_id,
        coalesce(p_status, 'scheduled'), p_mobility_assessment,
        p_cognitive_assessment, p_medical_notes, p_social_notes,
        coalesce(p_conclusion, 'pendiente'), p_rejection_reason)::text, 'UTF8')), 'hex');
    select resource_id, already_exists into v_id, v_replay
    from public.begin_creation_request('interview', p_request_id, v_fingerprint);
    if v_replay then return v_id; end if;
    insert into public.interviews (
      id,
      consultation_id,
      candidate_name,
      candidate_dni,
      candidate_birth_date,
      companion_name,
      companion_phone,
      companion_relationship,
      interview_date,
      interviewer_employee_id,
      status,
      mobility_assessment,
      cognitive_assessment,
      medical_notes,
      social_notes,
      conclusion,
      rejection_reason,
      created_by,
      updated_by
    ) values (
      v_id,
      p_consultation_id,
      p_candidate_name,
      p_candidate_dni,
      p_candidate_birth_date,
      p_companion_name,
      p_companion_phone,
      p_companion_relationship,
      p_interview_date,
      p_interviewer_employee_id,
      coalesce(p_status, 'scheduled'),
      p_mobility_assessment,
      p_cognitive_assessment,
      p_medical_notes,
      p_social_notes,
      coalesce(p_conclusion, 'pendiente'),
      p_rejection_reason,
      v_user_id,
      v_user_id
    );
  else
    select updated_at into v_updated_at from public.interviews where id = p_id for update;
    if not found then
      raise exception 'interview_not_found' using errcode = 'P0002';
    end if;
    if p_expected_updated_at is null or p_expected_updated_at <> v_updated_at then
      raise exception 'interview_changed' using errcode = '40001';
    end if;

    update public.interviews set
      consultation_id = p_consultation_id,
      candidate_name = p_candidate_name,
      candidate_dni = p_candidate_dni,
      candidate_birth_date = p_candidate_birth_date,
      companion_name = p_companion_name,
      companion_phone = p_companion_phone,
      companion_relationship = p_companion_relationship,
      interview_date = p_interview_date,
      interviewer_employee_id = p_interviewer_employee_id,
      status = coalesce(p_status, status),
      mobility_assessment = p_mobility_assessment,
      cognitive_assessment = p_cognitive_assessment,
      medical_notes = p_medical_notes,
      social_notes = p_social_notes,
      conclusion = coalesce(p_conclusion, conclusion),
      rejection_reason = case when p_conclusion = 'no_apto' then p_rejection_reason else null end,
      updated_by = v_user_id,
      updated_at = clock_timestamp()
    where id = p_id;

    if not found then
      raise exception 'interview_not_found' using errcode = 'P0002';
    end if;
  end if;

  return v_id;
end;
$$;

revoke all on function public.save_interview from public, anon, authenticated, service_role;
grant execute on function public.save_interview to authenticated;

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
  if exists (
    select 1 from public.shifts
    where status <> 'cancelled' and shift_date > p_terminated_at
      and (employee_id = p_id or covered_by_employee_id = p_id)
  ) then
    raise exception 'employee_has_future_shifts' using errcode = '23514';
  end if;
  update public.employees set terminated_at = p_terminated_at, termination_reason = btrim(p_reason) where id = p_id;
  return p_id;
end;
$$;

commit;
