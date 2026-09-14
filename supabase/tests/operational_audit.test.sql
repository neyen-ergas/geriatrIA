begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users(id,email,raw_user_meta_data) values
  ('84000000-0000-4000-8000-000000000001','admin@example.invalid','{"secret":"NO-AUDITAR-ESTO"}'),
  ('84000000-0000-4000-8000-000000000002','gestion@example.invalid','{}'),
  ('84000000-0000-4000-8000-000000000003','lectura@example.invalid','{}');
insert into user_access(user_id,role) values
  ('84000000-0000-4000-8000-000000000001','admin'),
  ('84000000-0000-4000-8000-000000000002','management'),
  ('84000000-0000-4000-8000-000000000003','readonly');
select ok((select relrowsecurity from pg_class where oid = 'audit_events'::regclass),'auditoría tiene RLS');
select ok(not has_table_privilege('authenticated','audit_events','insert,update,delete'),'ni admin escribe auditoría desde API');
select ok(not has_table_privilege('anon','audit_events','select'),'anon no lee');
select ok(not has_table_privilege('service_role','audit_events','insert,update,delete'),'clave de landing no falsifica eventos');
select ok(not has_function_privilege('authenticated','capture_operational_audit()','execute'),'función reservada a triggers');
set local role authenticated;
select set_config('request.jwt.claim.sub','84000000-0000-4000-8000-000000000001',true);
insert into residents(id,first_name,last_name,dni,birth_date) values
  ('84000000-0000-4000-8000-000000000010','Persona ficticia','Prueba','84.000.010','1940-01-01');
select is((select new_values->>'dni' from audit_events where record_id = '84000000-0000-4000-8000-000000000010'),'84000010','registra el valor ya normalizado');
select ok((select old_values is null and action = 'insert' and origin = 'live' and source_key is null
  and actor_id = auth.uid() and actor_label = 'admin@example.invalid' from audit_events where record_id = '84000000-0000-4000-8000-000000000010'),'alta con autor verificado');
update residents set first_name = first_name where id = '84000000-0000-4000-8000-000000000010';
select is((select count(*) from audit_events where record_id = '84000000-0000-4000-8000-000000000010'),1::bigint,'ignora reenvío y cambio de reloj');
insert into admissions(id,resident_id,admitted_at,monthly_fee,due_day) values
  ('84000000-0000-4000-8000-000000000011','84000000-0000-4000-8000-000000000010','2025-01-01',100,10);
select is((select count(*) from audit_events where record_id = '84000000-0000-4000-8000-000000000010'),1::bigint,'bloqueo de estadías no inventa una edición de residente');
select set_config('request.jwt.claim.sub','84000000-0000-4000-8000-000000000002',true);
update residents set phone = '000000', notes = 'Nota ficticia' where id = '84000000-0000-4000-8000-000000000010';
select is((select count(*) from audit_events),0::bigint,'Gestión escribe negocio pero no lee auditoría');
select set_config('request.jwt.claim.sub','84000000-0000-4000-8000-000000000003',true);
select is((select count(*) from audit_events),0::bigint,'Solo lectura no lee auditoría');
select set_config('request.jwt.claim.sub','84000000-0000-4000-8000-000000000001',true);
select ok((select actor_id = '84000000-0000-4000-8000-000000000002' and changed_fields = array['notes','phone']
  and old_values->'notes' = 'null'::jsonb and new_values->>'notes' = 'Nota ficticia'
  from audit_events where record_id = '84000000-0000-4000-8000-000000000010' and action = 'update'),'antes/después y autor de una edición directa bajo RLS');
select throws_ok($$do $q$ begin
  insert into residents(id,first_name,last_name,dni,birth_date) values ('84000000-0000-4000-8000-000000000020','Temporal','Prueba','TEST-ROLLBACK','1940-01-01');
  insert into residents(first_name,last_name,dni,birth_date) values ('Duplicado','Prueba','84000010','1940-01-01');
end; $q$ $$, '23505',null,'una operación multiescritura fallida revierte todo');
select is((select count(*) from audit_events where record_id = '84000000-0000-4000-8000-000000000020'),0::bigint,'sin evento de una transacción revertida');
select create_monthly_charge('84000000-0000-4000-8000-000000000011','2025-01-01','2025-01-10',100) as cuota \gset
select record_payment(:'cuota','2025-01-05',25,'cash') as pago \gset
select void_payment(:'pago','Corrección ficticia');
select cancel_monthly_charge(:'cuota','Cuota ficticia');
select ok((select old_values->'voided_at' = 'null'::jsonb and new_values->>'voided_reason' = 'Corrección ficticia'
  and actor_id = auth.uid() from audit_events where record_id = :'pago' and action = 'update'),'anulación conserva motivo y valores anteriores');
select is((select count(*) from audit_events where record_id = :'cuota'),2::bigint,'cuota registra alta y cancelación una sola vez');
select save_employee(null,null,'Ficticio','Empleado','TEST-AUD-EMP','Cuidador','2025-01-01') as empleado \gset
select set_employee_account('84000000-0000-4000-8000-000000000002',
  (select updated_at from user_access where user_id = '84000000-0000-4000-8000-000000000002'),:'empleado');
select ok((select changed_fields = array['employee_id'] and new_values->>'employee_id' = :'empleado'
  from audit_events where record_id = '84000000-0000-4000-8000-000000000002' and action = 'update'),'vínculo auditado sin duplicar su tabla de eventos');
select set_user_access('84000000-0000-4000-8000-000000000002','management',false,
  (select updated_at from user_access where user_id = '84000000-0000-4000-8000-000000000002'));
select terminate_employee(:'empleado',(select updated_at from employees where id = :'empleado'),'2025-02-01','Fin ficticio');
select ok((select new_values->>'termination_reason' = 'Fin ficticio' from audit_events where record_id = :'empleado' and action = 'update'),'baja laboral conserva motivo');
select set_config('request.jwt.claim.sub','84000000-0000-4000-8000-000000000002',true);
select is((select count(*) from audit_events),0::bigint,'suspensión tampoco permite historial');
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role service_role;
insert into consulta(id,nombre,telefono) values ('84000000-0000-4000-8000-000000000030','Familia ficticia','000000');
reset role;
select ok((select actor_id is null and actor_label is null from audit_events where record_id = '84000000-0000-4000-8000-000000000030'),'landing conserva INSERT sin inventar autor');
set local role authenticated;
select set_config('request.jwt.claim.sub','84000000-0000-4000-8000-000000000001',true);
select update_consulta('84000000-0000-4000-8000-000000000030',
  (select actualizado_en from consulta where id = '84000000-0000-4000-8000-000000000030'),'nuevo','save_notes',p_notes := 'Nota de llamada');
select is((select count(*) from audit_events where record_id = '84000000-0000-4000-8000-000000000030' and action = 'update'),1::bigint,'notas de admisión quedan auditadas');
select update_consulta('84000000-0000-4000-8000-000000000030',
  (select actualizado_en from consulta where id = '84000000-0000-4000-8000-000000000030'),'nuevo','schedule_visit',
  p_visit_date := current_date + 1, p_visit_slot := 'manana');
select actualizado_en as version_conversion from consulta where id = '84000000-0000-4000-8000-000000000030' \gset
select convert_consultation_admission('84000000-0000-4000-8000-000000000030', :'version_conversion',
  '2025-01-01',100,10,p_resident_first_name := 'Nuevo ficticio',p_resident_last_name := 'Prueba',
  p_resident_dni := 'TEST-AUD-CONV',p_resident_birth_date := '1940-01-01',
  p_contact_first_name := 'Familiar ficticio',p_contact_last_name := 'Prueba',
  p_contact_relationship := 'Familiar',p_contact_phone := '0000000') as ingreso_conversion \gset
select convert_consultation_admission('84000000-0000-4000-8000-000000000030', :'version_conversion', '2025-01-01',100,10);
select is((select count(*) from audit_events where table_name = 'consultation_admissions'
  and record_id = '84000000-0000-4000-8000-000000000030'),1::bigint,'repetir conversión no duplica su auditoría');
select ok((select new_values->>'admission_id' = :'ingreso_conversion' and actor_id = auth.uid()
  from audit_events where table_name = 'consultation_admissions' and record_id = '84000000-0000-4000-8000-000000000030'),'conversión conserva estadía y autor');
select is((select count(*) from audit_events e join family_contacts f on f.id = e.record_id
  join admissions a on a.resident_id = f.resident_id where a.id = :'ingreso_conversion'
  and e.table_name = 'family_contacts' and e.action = 'insert'),1::bigint,'familiar inicial también queda auditado');
select ok(not exists (select 1 from audit_events where new_values::text like '%NO-AUDITAR-ESTO%' or new_values ? 'updated_at'),'no serializa secretos ni relojes internos');

reset role;
create function pg_temp.fail_audit() returns trigger language plpgsql as $$begin raise exception 'simulated_audit_failure'; end;$$;
create trigger fail_audit_test before insert on audit_events for each row
when (new.record_id = '84000000-0000-4000-8000-000000000040') execute function pg_temp.fail_audit();
set local role authenticated;
select throws_ok($$insert into residents(id,first_name,last_name,dni,birth_date)
  values ('84000000-0000-4000-8000-000000000040','Ficticio','Rechazo','TEST-AUD-FAIL','1940-01-01')$$,
  'P0001','simulated_audit_failure','fallo de auditoría impide confirmar negocio sin historial');
select is((select count(*) from residents where id = '84000000-0000-4000-8000-000000000040'),0::bigint,'negocio también se revierte si falla el evento');
reset role;
insert into residents(id,first_name,last_name,dni,birth_date)
values ('84000000-0000-4000-8000-000000000050','Ficticio','Sin relaciones','TEST-AUD-DELETE','1940-01-01');
delete from residents where id = '84000000-0000-4000-8000-000000000050';
select ok((select new_values is null and old_values->>'dni' = 'TEST-AUD-DELETE'
  from audit_events where record_id = '84000000-0000-4000-8000-000000000050' and action = 'delete'), 'eliminación administrativa conserva el registro anterior');
select * from finish();
rollback;
