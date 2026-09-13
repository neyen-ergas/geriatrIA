-- Perfiles y revocación efectiva en cada pedido; docs/permisos.md.
begin;

create table public.user_access (
  user_id uuid primary key references auth.users(id) on delete restrict,
  role text not null constraint user_access_role_valid check (role in ('admin', 'management', 'readonly')),
  enabled boolean not null default true,
  updated_at timestamptz not null default clock_timestamp(),
  updated_by uuid references auth.users(id) on delete restrict
);
alter table public.user_access enable row level security;
revoke all on public.user_access from public, anon, authenticated;
grant select on public.user_access to authenticated;

create table public.access_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  old_role text,
  old_enabled boolean,
  new_role text not null,
  new_enabled boolean not null,
  changed_at timestamptz not null default clock_timestamp(),
  changed_by uuid not null references auth.users(id) on delete restrict
);
alter table public.access_events enable row level security;
revoke all on public.access_events from public, anon, authenticated;
grant select on public.access_events to authenticated;

-- Se conserva al único titular existente. Nunca se elevan varias cuentas por
-- inferencia. Una instalación vacía requiere asignar su primer admin por SQL.
do $$
begin
  if (select count(*) from auth.users) > 1 then
    raise exception 'initial_admin_ambiguous';
  end if;
  insert into public.user_access (user_id, role) select id, 'admin' from auth.users;
end;
$$;

create function public.current_app_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.user_access where user_id = auth.uid() and enabled;
$$;
revoke all on function public.current_app_role() from public, anon;
grant execute on function public.current_app_role() to authenticated;

create function public.has_permission(p_permission text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(case p_permission
    when 'operational.read' then public.current_app_role() in ('admin', 'management', 'readonly')
    when 'operational.write' then public.current_app_role() in ('admin', 'management')
    when 'administration' then public.current_app_role() = 'admin'
    else false end, false);
$$;
revoke all on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated;

-- El bloqueo mantiene la autorización hasta terminar la escritura. Una
-- revocación espera esas escrituras y los pedidos siguientes ya se rechazan.
create function public.require_permission(p_permission text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_role text;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  select role into v_role from public.user_access where user_id = auth.uid() and enabled for share;
  if not coalesce(case p_permission
    when 'operational.read' then v_role in ('admin', 'management', 'readonly')
    when 'operational.write' then v_role in ('admin', 'management')
    when 'administration' then v_role = 'admin'
    else false end, false) then
    raise exception 'permission_denied' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.require_permission(text) from public, anon;
grant execute on function public.require_permission(text) to authenticated;

create policy user_access_read on public.user_access for select to authenticated
using (user_id = (select auth.uid()) or (select public.has_permission('administration')));
create policy access_events_read on public.access_events for select to authenticated
using ((select public.has_permission('administration')));

create function public.list_user_access()
returns table (user_id uuid, email text, role text, enabled boolean, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_permission('administration');
  return query select u.id, u.email::text, a.role, coalesce(a.enabled, false), a.updated_at
    from auth.users u left join public.user_access a on a.user_id = u.id
    order by u.email, u.id;
end;
$$;
revoke all on function public.list_user_access() from public, anon;
grant execute on function public.list_user_access() to authenticated;

create function public.set_user_access(p_user_id uuid, p_role text, p_enabled boolean, p_expected_updated_at timestamptz default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_previous public.user_access%rowtype;
begin
  -- Serializa cambios entre administradores y evita perder al último por dos
  -- degradaciones simultáneas. La autorización se comprueba después de esperar.
  perform pg_catalog.pg_advisory_xact_lock(736194, 1);
  perform public.require_permission('administration');
  if p_role is null or p_role not in ('admin', 'management', 'readonly') or p_enabled is null then
    raise exception 'invalid_access' using errcode = '22023';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'account_not_found' using errcode = 'P0002';
  end if;
  select * into v_previous from public.user_access where user_id = p_user_id for update;
  if v_previous.updated_at is distinct from p_expected_updated_at then
    raise exception 'access_changed' using errcode = '40001';
  end if;
  if v_previous.role = 'admin' and v_previous.enabled and (p_role <> 'admin' or not p_enabled)
    and not exists (select 1 from public.user_access where role = 'admin' and enabled and user_id <> p_user_id) then
    raise exception 'last_admin_required' using errcode = '23514';
  end if;
  insert into public.user_access (user_id, role, enabled, updated_at, updated_by)
  values (p_user_id, p_role, p_enabled, greatest(clock_timestamp(), v_previous.updated_at + interval '1 microsecond'), auth.uid())
  on conflict (user_id) do update set role = excluded.role, enabled = excluded.enabled,
    updated_at = excluded.updated_at, updated_by = excluded.updated_by;
  insert into public.access_events (user_id, old_role, old_enabled, new_role, new_enabled, changed_by)
  values (p_user_id, v_previous.role, v_previous.enabled, p_role, p_enabled, auth.uid());
end;
$$;
revoke all on function public.set_user_access(uuid,text,boolean,timestamptz) from public, anon;
grant execute on function public.set_user_access(uuid,text,boolean,timestamptz) to authenticated;

-- Las políticas restrictivas se combinan con AND con las reglas existentes;
-- conservan los límites de cada módulo y no abren escrituras directas nuevas.
grant select on public.consulta to authenticated;
create policy consulta_read on public.consulta for select to authenticated
using ((select public.has_permission('operational.read')));

create policy access_read on public.residents as restrictive for select to authenticated
using ((select public.has_permission('operational.read')));

create policy access_read on public.family_contacts as restrictive for select to authenticated
using ((select public.has_permission('operational.read')));

create policy access_read on public.admissions as restrictive for select to authenticated
using ((select public.has_permission('operational.read')));

create policy access_read on public.consulta as restrictive for select to authenticated
using ((select public.has_permission('operational.read')));

create policy access_read on public.visit_events as restrictive for select to authenticated
using ((select public.has_permission('operational.read')));

create policy access_read on public.consultation_admissions as restrictive for select to authenticated
using ((select public.has_permission('operational.read')));

create policy access_read on public.monthly_charges as restrictive for select to authenticated
using ((select public.has_permission('operational.read')));

create policy access_read on public.payments as restrictive for select to authenticated
using ((select public.has_permission('operational.read')));

create policy access_read on public.employees as restrictive for select to authenticated
using ((select public.has_permission('administration')));

create policy access_insert on public.residents as restrictive for insert to authenticated
with check ((select public.has_permission('operational.write')));

create policy access_update on public.residents as restrictive for update to authenticated
using ((select public.has_permission('operational.write')))
with check ((select public.has_permission('operational.write')));

create policy access_insert on public.family_contacts as restrictive for insert to authenticated
with check ((select public.has_permission('operational.write')));

create policy access_update on public.family_contacts as restrictive for update to authenticated
using ((select public.has_permission('operational.write')))
with check ((select public.has_permission('operational.write')));

create policy access_insert on public.admissions as restrictive for insert to authenticated
with check ((select public.has_permission('operational.write')));

create policy access_update on public.admissions as restrictive for update to authenticated
using ((select public.has_permission('operational.write')))
with check ((select public.has_permission('operational.write')));

create policy receipt_access_select on storage.objects as restrictive for select to authenticated
using (bucket_id <> 'payment-receipts' or (select public.has_permission('operational.read')));

create policy receipt_access_insert on storage.objects as restrictive for insert to authenticated
with check (bucket_id <> 'payment-receipts' or (select public.has_permission('operational.write')));

create or replace function public.create_monthly_charge(
  p_admission_id uuid,
  p_period date,
  p_due_date date,
  p_amount_due numeric,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_admission public.admissions%rowtype;
  v_period_end date;
  v_charge_id uuid;
begin
  perform public.require_permission('operational.write');
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if p_period is null or extract(day from p_period) <> 1 then
    raise exception 'period_must_be_first_day' using errcode = '22023';
  end if;

  v_period_end := (p_period + interval '1 month - 1 day')::date;

  if p_due_date is null
    or p_due_date < p_period
    or p_due_date > v_period_end then
    raise exception 'due_date_outside_period' using errcode = '22023';
  end if;

  if p_amount_due is null
    or p_amount_due <= 0
    or p_amount_due > 9999999999.99 then
    raise exception 'invalid_amount_due' using errcode = '22023';
  end if;

  select *
  into v_admission
  from public.admissions
  where id = p_admission_id;

  if not found then
    raise exception 'admission_not_found' using errcode = 'P0002';
  end if;

  if v_period_end < v_admission.admitted_at
    or (
      v_admission.discharged_at is not null
      and p_period > v_admission.discharged_at
    ) then
    raise exception 'period_outside_admission' using errcode = '23514';
  end if;

  insert into public.monthly_charges (
    admission_id,
    period,
    due_date,
    amount_due,
    currency,
    notes,
    created_by
  )
  values (
    p_admission_id,
    p_period,
    p_due_date,
    p_amount_due,
    v_admission.currency,
    nullif(btrim(p_notes), ''),
    v_user_id
  )
  returning id into v_charge_id;

  return v_charge_id;
end;
$$;

create or replace function public.record_payment(
  p_monthly_charge_id uuid,
  p_paid_on date,
  p_amount numeric,
  p_payment_method text,
  p_reference text default null,
  p_receipt_path text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_charge public.monthly_charges%rowtype;
  v_paid_amount numeric(12, 2);
  v_payment_id uuid;
  v_payment_method text := lower(btrim(p_payment_method));
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  perform public.require_permission('operational.write');
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if p_paid_on is null or p_paid_on > v_today then
    raise exception 'invalid_payment_date' using errcode = '22023';
  end if;

  if p_amount is null
    or p_amount <= 0
    or p_amount > 9999999999.99 then
    raise exception 'invalid_payment_amount' using errcode = '22023';
  end if;

  if p_payment_method is null
    or v_payment_method not in (
      'cash',
      'bank_transfer',
      'debit_card',
      'credit_card',
      'other'
    ) then
    raise exception 'invalid_payment_method' using errcode = '22023';
  end if;

  -- El bloqueo serializa pagos concurrentes sobre la misma cuota.
  select *
  into v_charge
  from public.monthly_charges
  where id = p_monthly_charge_id
  for update;

  if not found then
    raise exception 'monthly_charge_not_found' using errcode = 'P0002';
  end if;

  if v_charge.cancelled_at is not null then
    raise exception 'monthly_charge_cancelled' using errcode = '23514';
  end if;

  select coalesce(sum(amount), 0)
  into v_paid_amount
  from public.payments
  where monthly_charge_id = p_monthly_charge_id
    and voided_at is null;

  if v_paid_amount + p_amount > v_charge.amount_due then
    raise exception 'payment_exceeds_balance' using errcode = '23514';
  end if;

  insert into public.payments (
    monthly_charge_id,
    paid_on,
    amount,
    payment_method,
    reference,
    receipt_path,
    notes,
    created_by
  )
  values (
    p_monthly_charge_id,
    p_paid_on,
    p_amount,
    v_payment_method,
    nullif(btrim(p_reference), ''),
    nullif(btrim(p_receipt_path), ''),
    nullif(btrim(p_notes), ''),
    v_user_id
  )
  returning id into v_payment_id;

  return v_payment_id;
end;
$$;

create or replace function public.void_payment(
  p_payment_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_payment_id uuid;
begin
  perform public.require_permission('operational.write');
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'void_reason_required' using errcode = '22023';
  end if;

  update public.payments
  set
    voided_at = now(),
    voided_reason = btrim(p_reason),
    voided_by = v_user_id
  where id = p_payment_id
    and voided_at is null
  returning id into v_payment_id;

  if not found then
    raise exception 'active_payment_not_found' using errcode = 'P0002';
  end if;

  return v_payment_id;
end;
$$;

create or replace function public.cancel_monthly_charge(
  p_monthly_charge_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_charge_id uuid;
begin
  perform public.require_permission('operational.write');
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'cancellation_reason_required' using errcode = '22023';
  end if;

  select id
  into v_charge_id
  from public.monthly_charges
  where id = p_monthly_charge_id
    and cancelled_at is null
  for update;

  if not found then
    raise exception 'current_monthly_charge_not_found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.payments
    where monthly_charge_id = p_monthly_charge_id
      and voided_at is null
  ) then
    raise exception 'monthly_charge_has_active_payments' using errcode = '23514';
  end if;

  update public.monthly_charges
  set
    cancelled_at = now(),
    cancelled_reason = btrim(p_reason),
    cancelled_by = v_user_id
  where id = p_monthly_charge_id;

  return v_charge_id;
end;
$$;

create or replace function public.update_consulta(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_expected_state text,
  p_action text,
  p_state text default null,
  p_visit_date date default null,
  p_visit_slot text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_consulta public.consulta%rowtype;
  v_allowed boolean;
  v_actor uuid := auth.uid();
  v_after public.consulta%rowtype;
  v_action text;
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  perform public.require_permission('operational.write');
  if v_actor is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  -- El bloqueo cubre lectura, validación y escritura. Un segundo operador
  -- espera y compara su versión con la fila ya modificada por el primero.
  select * into v_consulta
  from public.consulta
  where id = p_id
  for update;

  if not found then
    raise exception 'consulta_not_found' using errcode = 'P0002';
  end if;

  if p_expected_updated_at is distinct from v_consulta.actualizado_en
    or p_expected_state is distinct from v_consulta.estado then
    raise exception 'consulta_changed' using errcode = '40001';
  end if;

  case p_action
    when 'change_state' then
      v_allowed := case v_consulta.estado
        when 'nuevo' then p_state in ('contactado', 'descartada')
        when 'contactado' then p_state in ('nuevo', 'descartada')
        when 'visita_agendada' then p_state in ('ingreso', 'descartada')
        when 'ingreso' then p_state = 'contactado'
        when 'descartada' then p_state = 'nuevo'
        else false
      end;

      if v_allowed is not true then
        raise exception 'invalid_consulta_transition' using errcode = '22023';
      end if;

      update public.consulta set estado = p_state where id = p_id;

    when 'schedule_visit' then
      if v_consulta.estado not in ('nuevo', 'contactado', 'visita_agendada') then
        raise exception 'invalid_consulta_transition' using errcode = '22023';
      end if;
      if p_visit_date is null or p_visit_date < v_today
        or p_visit_slot is null or p_visit_slot not in ('manana', 'tarde') then
        raise exception 'invalid_consulta_visit' using errcode = '22023';
      end if;

      update public.consulta
      set estado = 'visita_agendada',
          visita_fecha = p_visit_date,
          visita_franja = p_visit_slot
      where id = p_id;

    when 'cancel_visit' then
      if v_consulta.estado <> 'visita_agendada' then
        raise exception 'invalid_consulta_transition' using errcode = '22023';
      end if;

      update public.consulta
      set estado = 'contactado', visita_fecha = null, visita_franja = null
      where id = p_id;

    when 'save_notes' then
      update public.consulta
      set notas_internas = nullif(btrim(p_notes), '')
      where id = p_id;

    else
      raise exception 'invalid_consulta_action' using errcode = '22023';
  end case;

  if p_action in ('schedule_visit', 'cancel_visit')
    or (p_action = 'change_state' and v_consulta.estado = 'visita_agendada') then
    select * into v_after from public.consulta where id = p_id;
    v_action := case
      when p_action = 'cancel_visit' then 'cancelled'
      when p_action = 'change_state' then 'closed'
      when v_consulta.estado = 'visita_agendada' then 'rescheduled'
      else 'scheduled'
    end;
    insert into public.visit_events (
      consultation_id, action, actor_id, previous_date, previous_slot,
      new_date, new_slot, previous_state, new_state
    ) values (
      p_id, v_action, v_actor, v_consulta.visita_fecha, v_consulta.visita_franja,
      v_after.visita_fecha, v_after.visita_franja,
      v_consulta.estado, v_after.estado
    );
  end if;

  return v_consulta.id;
end;
$$;

create or replace function public.convert_consultation_admission(
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
  perform public.require_permission('operational.write');
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
  perform public.require_permission('administration');
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


commit;
