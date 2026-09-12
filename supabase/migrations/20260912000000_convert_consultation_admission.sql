begin;

-- Conversión atómica e idempotente; ver docs/admision-ingreso.md.
create table public.consultation_admissions (
  consultation_id uuid primary key references public.consulta(id) on delete restrict,
  admission_id uuid not null unique references public.admissions(id) on delete restrict,
  converted_at timestamptz not null default clock_timestamp(),
  converted_by uuid not null references auth.users(id) on delete restrict
);
alter table public.consultation_admissions enable row level security;
revoke all on public.consultation_admissions from public, anon, authenticated;
grant select on public.consultation_admissions to authenticated;
create policy consultation_admissions_read on public.consultation_admissions
for select to authenticated using ((select auth.uid()) is not null);

create function public.guard_converted_consultation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.estado <> 'ingreso' and exists (
    select 1 from public.consultation_admissions where consultation_id = new.id
  ) then
    raise exception 'consultation_already_converted' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_converted_consultation() from public, anon, authenticated;
create trigger consulta_guard_conversion before update on public.consulta
for each row execute function public.guard_converted_consultation();

create function public.convert_consultation_admission(
  p_consultation_id uuid,
  p_expected_updated_at timestamptz,
  p_admitted_at date,
  p_monthly_fee numeric,
  p_due_day integer,
  p_resident_id uuid default null,
  p_resident_first_name text default null,
  p_resident_last_name text default null,
  p_resident_dni text default null,
  p_resident_birth_date date default null,
  p_contact_first_name text default null,
  p_contact_last_name text default null,
  p_contact_relationship text default null,
  p_contact_phone text default null,
  p_contact_is_emergency_contact boolean default true,
  p_contact_is_payment_responsible boolean default true,
  p_resident_phone text default null,
  p_resident_address text default null,
  p_resident_notes text default null,
  p_contact_notes text default null,
  p_room text default null,
  p_administrative_notes text default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_consulta public.consulta%rowtype;
  v_resident_id uuid;
  v_admission_id uuid;
  v_last_discharge date;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  select * into v_consulta from public.consulta where id = p_consultation_id for update;
  if not found then raise exception 'consulta_not_found' using errcode = 'P0002'; end if;
  select admission_id into v_admission_id from public.consultation_admissions
  where consultation_id = p_consultation_id;
  if found then return v_admission_id; end if;
  if p_expected_updated_at is distinct from v_consulta.actualizado_en then
    raise exception 'consulta_changed' using errcode = '40001';
  end if;
  -- Se admiten estados ingreso históricos sin vínculo; no se infieren personas
  -- ni se crean vínculos retroactivos automáticamente.
  if v_consulta.estado not in ('visita_agendada', 'ingreso') then
    raise exception 'invalid_consulta_transition' using errcode = '22023';
  end if;

  if p_resident_id is null then
    v_resident_id := public.create_initial_admission(
      p_resident_first_name, p_resident_last_name, p_resident_dni, p_resident_birth_date,
      p_contact_first_name, p_contact_last_name, p_contact_relationship, p_contact_phone,
      p_contact_is_emergency_contact, p_contact_is_payment_responsible,
      p_admitted_at, p_monthly_fee, p_due_day,
      p_resident_phone, p_resident_address, p_resident_notes, p_contact_notes,
      p_room, p_administrative_notes
    );
    select id into strict v_admission_id from public.admissions
    where resident_id = v_resident_id and discharged_at is null;
  else
    select id into v_resident_id from public.residents where id = p_resident_id for update;
    if not found then raise exception 'resident_not_found' using errcode = 'P0002'; end if;
    if exists (select 1 from public.admissions where resident_id = v_resident_id and discharged_at is null) then
      raise exception 'resident_has_active_admission' using errcode = '23514';
    end if;
    select max(discharged_at) into v_last_discharge from public.admissions where resident_id = v_resident_id;
    if p_admitted_at < v_last_discharge then
      raise exception 'admission_before_last_discharge' using errcode = '23514';
    end if;
    insert into public.admissions (resident_id, admitted_at, monthly_fee, due_day, room, administrative_notes)
    values (v_resident_id, p_admitted_at, p_monthly_fee, p_due_day,
      nullif(btrim(p_room), ''), nullif(btrim(p_administrative_notes), ''))
    returning id into v_admission_id;
  end if;

  insert into public.consultation_admissions (consultation_id, admission_id, converted_by)
  values (p_consultation_id, v_admission_id, v_actor);
  if v_consulta.estado = 'visita_agendada' then
    perform public.update_consulta(p_consultation_id, p_expected_updated_at,
      v_consulta.estado, 'change_state', 'ingreso');
  else
    update public.consulta set estado = 'ingreso' where id = p_consultation_id;
  end if;
  return v_admission_id;
end;
$$;

revoke all on function public.convert_consultation_admission(uuid,timestamptz,date,numeric,integer,
  uuid,text,text,text,date,text,text,text,text,boolean,boolean,text,text,text,text,text,text)
from public, anon;
grant execute on function public.convert_consultation_admission(uuid,timestamptz,date,numeric,integer,
  uuid,text,text,text,date,text,text,text,text,boolean,boolean,text,text,text,text,text,text)
to authenticated;
commit;
