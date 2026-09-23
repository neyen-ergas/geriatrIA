-- Acciones de entrevista autorizadas y ediciones con versión. docs/entrevistas.md.
begin;

create or replace function public.guard_interview()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if not (select public.has_permission('administration')) then
    raise exception 'permission_denied' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := clock_timestamp();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;

  new.updated_by := auth.uid();
  new.updated_at := case when tg_op = 'UPDATE'
    then greatest(clock_timestamp(), old.updated_at + interval '1 microsecond')
    else clock_timestamp() end;

  return new;
end;
$$;

drop function public.save_interview(uuid, uuid, text, text, date, text, text, text,
  date, uuid, text, text, text, text, text, text, text);

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
  p_expected_updated_at timestamptz default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := coalesce(p_id, gen_random_uuid());
  v_user_id uuid := auth.uid();
  v_updated_at timestamptz;
begin
  perform public.require_permission('administration');

  if p_id is null then
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

create function public.transition_interview(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_status text
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_interview public.interviews;
begin
  perform public.require_permission('administration');
  if p_status is null or p_status not in ('completed', 'cancelled') then
    raise exception 'invalid_interview_transition' using errcode = '23514';
  end if;

  select * into v_interview from public.interviews where id = p_id for update;
  if not found then
    raise exception 'interview_not_found' using errcode = 'P0002';
  end if;
  if p_expected_updated_at is null or p_expected_updated_at <> v_interview.updated_at then
    raise exception 'interview_changed' using errcode = '40001';
  end if;
  if v_interview.status <> 'scheduled' then
    raise exception 'invalid_interview_transition' using errcode = '23514';
  end if;

  update public.interviews set status = p_status where id = p_id;
end;
$$;
revoke all on function public.transition_interview from public, anon, authenticated, service_role;
grant execute on function public.transition_interview to authenticated;

commit;
