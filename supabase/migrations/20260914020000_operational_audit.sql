-- Auditoría transaccional de datos operativos; docs/auditoria.md.
begin;

-- Cierra la ventana entre la importación del historial y los triggers nuevos.
lock table public.consulta, public.residents, public.family_contacts,
  public.admissions, public.monthly_charges, public.payments, public.employees,
  public.user_access, public.consultation_admissions, public.visit_events,
  public.access_events, public.employee_account_events in share row exclusive mode;

create table public.audit_events (
  id bigint generated always as identity primary key,
  table_name text not null constraint audit_table_valid check (table_name in
    ('consulta','residents','family_contacts','admissions','monthly_charges','payments','employees','user_access','consultation_admissions')),
  record_id uuid not null,
  action text not null constraint audit_action_valid check (action in ('insert','update','delete')),
  occurred_at timestamptz not null default clock_timestamp(),
  -- Identidades históricas sin FK: una eliminación administrativa futura no
  -- borra ni impide conservar la evidencia del autor o registro original.
  actor_id uuid,
  actor_label text,
  record_label text,
  old_values jsonb,
  new_values jsonb,
  changed_fields text[] not null,
  origin text not null default 'live' constraint audit_origin_valid check (origin in ('live','historical')),
  source_key text unique,
  constraint audit_values_objects check (
    (old_values is null or jsonb_typeof(old_values) = 'object') and
    (new_values is null or jsonb_typeof(new_values) = 'object'))
);
alter table public.audit_events enable row level security;
revoke all on public.audit_events from public, anon, authenticated, service_role;
revoke all on sequence public.audit_events_id_seq from public, anon, authenticated, service_role;
grant select on public.audit_events to authenticated;
create policy audit_events_admin_read on public.audit_events for select to authenticated
using ((select public.has_permission('administration')));
create index audit_events_time on public.audit_events (occurred_at desc, id desc);
create index audit_events_record on public.audit_events (table_name, record_id, occurred_at desc, id desc);
create index audit_events_actor on public.audit_events (actor_id, occurred_at desc, id desc);

create function public.capture_operational_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_row jsonb;
  v_fields text[] := string_to_array(tg_argv[1], ',');
  v_changed text[];
  v_label text;
  v_actor_label text;
begin
  if tg_op <> 'INSERT' then
    select coalesce(jsonb_object_agg(key,value), '{}'::jsonb) into v_before
    from jsonb_each(to_jsonb(old)) where key = any(v_fields);
  end if;
  if tg_op <> 'DELETE' then
    select coalesce(jsonb_object_agg(key,value), '{}'::jsonb) into v_after
    from jsonb_each(to_jsonb(new)) where key = any(v_fields);
  end if;
  -- Ignora cambios de reloj/bloqueo y reenvíos sin cambios funcionales.
  if tg_op = 'UPDATE' and v_before = v_after then return new; end if;
  select array_agg(field order by field) into v_changed from unnest(v_fields) field
  where (v_before -> field) is distinct from (v_after -> field);
  v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  select email into v_actor_label from auth.users where id = auth.uid();
  case tg_table_name
    when 'consulta' then v_label := v_row ->> 'nombre';
    when 'residents', 'family_contacts', 'employees' then
      v_label := (v_row ->> 'last_name') || ', ' || (v_row ->> 'first_name');
    when 'admissions' then
      select last_name || ', ' || first_name into v_label from public.residents where id = (v_row ->> 'resident_id')::uuid;
    when 'monthly_charges' then
      select r.last_name || ', ' || r.first_name into v_label from public.admissions a
      join public.residents r on r.id = a.resident_id where a.id = (v_row ->> 'admission_id')::uuid;
    when 'payments' then
      select r.last_name || ', ' || r.first_name into v_label from public.monthly_charges c
      join public.admissions a on a.id = c.admission_id join public.residents r on r.id = a.resident_id
      where c.id = (v_row ->> 'monthly_charge_id')::uuid;
    when 'user_access' then select email into v_label from auth.users where id = (v_row ->> 'user_id')::uuid;
    when 'consultation_admissions' then select nombre into v_label from public.consulta where id = (v_row ->> 'consultation_id')::uuid;
    else raise exception 'unsupported_audit_table';
  end case;
  insert into public.audit_events (table_name, record_id, action, actor_id, actor_label, record_label, old_values, new_values, changed_fields)
  values (tg_table_name, (v_row ->> tg_argv[0])::uuid, lower(tg_op), auth.uid(), v_actor_label, v_label,
    v_before, v_after, coalesce(v_changed, array[]::text[]));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.capture_operational_audit() from public, anon, authenticated, service_role;

-- Solo campos de negocio explícitos. Auth, secretos y objetos de Storage no
-- se serializan; el comprobante se registra como ruta, nunca como contenido.
create trigger consulta_audit after insert or update or delete on public.consulta for each row
execute function public.capture_operational_audit('id','nombre,telefono,momento_llamado,mensaje,origen,estado,visita_fecha,visita_franja,notas_internas');
create trigger residents_audit after insert or update or delete on public.residents for each row
execute function public.capture_operational_audit('id','first_name,last_name,dni,birth_date,phone,address,notes');
create trigger contacts_audit after insert or update or delete on public.family_contacts for each row
execute function public.capture_operational_audit('id','resident_id,first_name,last_name,relationship,phone,is_emergency_contact,is_payment_responsible,notes');
create trigger admissions_audit after insert or update or delete on public.admissions for each row
execute function public.capture_operational_audit('id','resident_id,admitted_at,room,monthly_fee,currency,due_day,administrative_notes,discharged_at,discharge_reason');
create trigger charges_audit after insert or update or delete on public.monthly_charges for each row
execute function public.capture_operational_audit('id','admission_id,period,due_date,amount_due,currency,notes,cancelled_at,cancelled_reason');
create trigger payments_audit after insert or update or delete on public.payments for each row
execute function public.capture_operational_audit('id','monthly_charge_id,paid_on,amount,payment_method,reference,receipt_path,notes,voided_at,voided_reason');
create trigger employees_audit after insert or update or delete on public.employees for each row
execute function public.capture_operational_audit('id','first_name,last_name,dni,birth_date,phone,email,job_title,hired_at,terminated_at,termination_reason,notes');
create trigger access_audit after insert or update or delete on public.user_access for each row
execute function public.capture_operational_audit('user_id','role,enabled,employee_id');
create trigger conversion_audit after insert or update or delete on public.consultation_admissions for each row
execute function public.capture_operational_audit('consultation_id','admission_id');

-- Historial verificable anterior. No se fabrican snapshots antiguos a partir
-- de fichas actuales: los campos desconocidos permanecen sin valor registrado.
insert into public.audit_events (table_name, record_id, action, occurred_at, actor_id, old_values, new_values, changed_fields, origin, source_key)
select 'consulta', consultation_id, 'update', occurred_at, actor_id,
  jsonb_build_object('visita_fecha',previous_date,'visita_franja',previous_slot,'estado',previous_state),
  jsonb_build_object('visita_fecha',new_date,'visita_franja',new_slot,'estado',new_state),
  array['visita_fecha','visita_franja','estado'], 'historical', 'visit:' || id from public.visit_events;
insert into public.audit_events (table_name, record_id, action, occurred_at, actor_id, old_values, new_values, changed_fields, origin, source_key)
select 'user_access', user_id, case when old_role is null then 'insert' else 'update' end, changed_at, changed_by,
  case when old_role is null then null else jsonb_build_object('role',old_role,'enabled',old_enabled) end,
  jsonb_build_object('role',new_role,'enabled',new_enabled), array['role','enabled'], 'historical', 'access:' || id from public.access_events;
insert into public.audit_events (table_name, record_id, action, occurred_at, actor_id, old_values, new_values, changed_fields, origin, source_key)
select 'user_access', user_id, 'update', changed_at, changed_by,
  jsonb_build_object('employee_id',previous_employee_id), jsonb_build_object('employee_id',employee_id),
  array['employee_id'], 'historical', 'employee-account:' || id from public.employee_account_events;
insert into public.audit_events (table_name, record_id, action, occurred_at, actor_id, new_values, changed_fields, origin, source_key)
select 'monthly_charges', id, 'insert', created_at, created_by, '{}'::jsonb, array[]::text[], 'historical', 'charge-created:' || id from public.monthly_charges
union all select 'payments', id, 'insert', created_at, created_by, '{}'::jsonb, array[]::text[], 'historical', 'payment-created:' || id from public.payments
union all select 'employees', id, 'insert', created_at, created_by, '{}'::jsonb, array[]::text[], 'historical', 'employee-created:' || id from public.employees
union all select 'employees', id, 'update', updated_at, updated_by, '{}'::jsonb, array[]::text[], 'historical', 'employee-updated:' || id from public.employees where updated_at > created_at
union all select 'consultation_admissions', consultation_id, 'insert', converted_at, converted_by,
  jsonb_build_object('admission_id',admission_id), array['admission_id'], 'historical', 'conversion:' || consultation_id from public.consultation_admissions;
insert into public.audit_events (table_name, record_id, action, occurred_at, actor_id, new_values, changed_fields, origin, source_key)
select 'monthly_charges', id, 'update', cancelled_at, cancelled_by,
  jsonb_build_object('cancelled_at',cancelled_at,'cancelled_reason',cancelled_reason), array['cancelled_at','cancelled_reason'],
  'historical', 'charge-cancelled:' || id from public.monthly_charges where cancelled_at is not null
union all select 'payments', id, 'update', voided_at, voided_by,
  jsonb_build_object('voided_at',voided_at,'voided_reason',voided_reason), array['voided_at','voided_reason'],
  'historical', 'payment-voided:' || id from public.payments where voided_at is not null;

-- Normaliza la lista importada: cada detalle muestra solo diferencias reales.
update public.audit_events a set changed_fields = (
  select coalesce(array_agg(field order by field),array[]::text[]) from unnest(a.changed_fields) field
  where (a.old_values -> field) is distinct from (a.new_values -> field)
) where origin = 'historical';

commit;
