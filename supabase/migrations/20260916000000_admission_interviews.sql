-- Entrevistas de admisión: evaluación inicial, movilidad, estado cognitivo y aptitud. docs/entrevistas.md.
begin;

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid references public.consulta(id) on delete set null,
  candidate_name text not null check (char_length(btrim(candidate_name)) between 1 and 200),
  candidate_dni text check (candidate_dni is null or char_length(btrim(candidate_dni)) between 6 and 20),
  candidate_birth_date date check (candidate_birth_date is null or candidate_birth_date <= current_date),
  companion_name text check (companion_name is null or char_length(btrim(companion_name)) between 1 and 200),
  companion_phone text check (companion_phone is null or char_length(btrim(companion_phone)) between 6 and 50),
  companion_relationship text check (companion_relationship is null or char_length(btrim(companion_relationship)) between 1 and 100),
  interview_date date not null,
  interviewer_employee_id uuid references public.employees(id) on delete restrict,
  status text not null default 'scheduled' constraint interviews_status_valid check (
    status in ('scheduled', 'completed', 'cancelled')
  ),
  mobility_assessment text constraint interviews_mobility_valid check (
    mobility_assessment is null or mobility_assessment in ('autovalido', 'semidependiente', 'dependiente_total')
  ),
  cognitive_assessment text constraint interviews_cognitive_valid check (
    cognitive_assessment is null or cognitive_assessment in ('lucido', 'deterioro_leve', 'deterioro_moderado', 'demencia_avanzada')
  ),
  medical_notes text check (medical_notes is null or char_length(medical_notes) <= 4000),
  social_notes text check (social_notes is null or char_length(social_notes) <= 4000),
  conclusion text not null default 'pendiente' constraint interviews_conclusion_valid check (
    conclusion in ('pendiente', 'apto', 'apto_con_observaciones', 'no_apto')
  ),
  rejection_reason text check (
    rejection_reason is null or (char_length(btrim(rejection_reason)) between 1 and 1000)
  ),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,

  -- Si es no_apto, el motivo es obligatorio.
  constraint interviews_rejection_valid check (
    (conclusion <> 'no_apto' and rejection_reason is null) or
    (conclusion = 'no_apto' and nullif(btrim(rejection_reason), '') is not null)
  )
);

create index interviews_date on public.interviews (interview_date desc);
create index interviews_status on public.interviews (status);
create index interviews_conclusion on public.interviews (conclusion);
create index interviews_consultation on public.interviews (consultation_id);
create index interviews_candidate on public.interviews (candidate_name);

alter table public.interviews enable row level security;
revoke all on public.interviews from public, anon, authenticated, service_role;
grant select on public.interviews to authenticated;

-- Lectura para Administrador (en línea con permisos.ts y auth.test.ts)
create policy interviews_admin_read on public.interviews for select to authenticated
using ((select public.has_permission('administration')));

-- Trigger para updated_at y created_by/updated_by
create function public.guard_interview()
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
  new.updated_at := clock_timestamp();

  return new;
end;
$$;

create trigger trg_guard_interview
before insert or update on public.interviews
for each row execute function public.guard_interview();

-- RPC transaccional para guardar entrevista
create function public.save_interview(
  p_id uuid,
  p_consultation_id uuid,
  p_candidate_name text,
  p_candidate_dni text,
  p_candidate_birth_date date,
  p_companion_name text,
  p_companion_phone text,
  p_companion_relationship text,
  p_interview_date date,
  p_interviewer_employee_id uuid,
  p_status text,
  p_mobility_assessment text,
  p_cognitive_assessment text,
  p_medical_notes text,
  p_social_notes text,
  p_conclusion text,
  p_rejection_reason text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := coalesce(p_id, gen_random_uuid());
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if not (select public.has_permission('administration')) then
    raise exception 'permission_denied' using errcode = '42501';
  end if;

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

commit;
