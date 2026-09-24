-- Captura transaccional de turnos y entrevistas desde esta migración.
begin;

-- Evita escrituras sin captura mientras se instalan los triggers.
lock table public.shifts, public.interviews in share row exclusive mode;

alter table public.audit_events drop constraint audit_table_valid;
alter table public.audit_events add constraint audit_table_valid check (table_name in
 ('consulta','residents','family_contacts','admissions','monthly_charges','payments','employees','user_access','consultation_admissions',
  'resident_documents','medical_indications','medications','special_needs','inventory_items','shifts','interviews'));

create or replace function public.capture_operational_audit()
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
  if tg_op = 'UPDATE' and v_before = v_after then return new; end if;
  select array_agg(field order by field) into v_changed from unnest(v_fields) field
  where (v_before -> field) is distinct from (v_after -> field);
  v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  select email into v_actor_label from auth.users where id = auth.uid();
  case tg_table_name
    when 'consulta' then v_label := v_row ->> 'nombre';
    when 'residents', 'family_contacts', 'employees' then
      v_label := (v_row ->> 'last_name') || ', ' || (v_row ->> 'first_name');
    when 'admissions', 'resident_documents', 'medical_indications', 'medications', 'special_needs', 'inventory_items' then
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
    when 'shifts' then
      select last_name || ', ' || first_name into v_label from public.employees where id = (v_row ->> 'employee_id')::uuid;
    when 'interviews' then v_label := v_row ->> 'candidate_name';
    else raise exception 'unsupported_audit_table';
  end case;
  insert into public.audit_events (table_name, record_id, action, actor_id, actor_label, record_label, old_values, new_values, changed_fields)
  values (tg_table_name, (v_row ->> tg_argv[0])::uuid, lower(tg_op), auth.uid(), v_actor_label, v_label,
    v_before, v_after, coalesce(v_changed, array[]::text[]));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- Solo datos de negocio; se excluyen autoría interna, relojes y claves de reintento.
create trigger shifts_audit after insert or update or delete on public.shifts
for each row execute function public.capture_operational_audit(
  'id','employee_id,shift_date,shift_type,guard_start,status,absence_reason,covered_by_employee_id,notes');
create trigger interviews_audit after insert or update or delete on public.interviews
for each row execute function public.capture_operational_audit(
  'id','consultation_id,candidate_name,candidate_dni,candidate_birth_date,companion_name,companion_phone,companion_relationship,interview_date,interviewer_employee_id,status,mobility_assessment,cognitive_assessment,medical_notes,social_notes,conclusion,rejection_reason');

commit;
