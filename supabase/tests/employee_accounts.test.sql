begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, email) values
  ('81000000-0000-4000-8000-000000000001','admin@example.invalid'),
  ('81000000-0000-4000-8000-000000000002','personal@example.invalid'),
  ('81000000-0000-4000-8000-000000000003','otra@example.invalid'),
  ('81000000-0000-4000-8000-000000000004','pendiente@example.invalid');
insert into user_access(user_id, role) values
  ('81000000-0000-4000-8000-000000000001','admin'),
  ('81000000-0000-4000-8000-000000000002','management'),
  ('81000000-0000-4000-8000-000000000003','readonly');
select ok(not has_function_privilege('anon','set_employee_account(uuid,timestamptz,uuid)','execute'), 'anon no vincula cuentas');
select ok(not has_table_privilege('authenticated','user_access','update'), 'no modifica el vínculo directamente');
select ok(not has_table_privilege('authenticated','employee_account_events','insert,update,delete'), 'historial sin escrituras directas');
set local role authenticated;
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
select save_employee(null,null,'Ficticio','Uno','TEST-VINC-1','Cuidador','2025-01-01') as empleado \gset
select save_employee(null,null,'Ficticio','Dos','TEST-VINC-2','Cuidador','2025-01-01') as otro \gset
select updated_at as version_cuenta from user_access where user_id = '81000000-0000-4000-8000-000000000002' \gset
select set_employee_account('81000000-0000-4000-8000-000000000002', :'version_cuenta', :'empleado');
select is((select employee_id from user_access where user_id = '81000000-0000-4000-8000-000000000002'), :'empleado'::uuid, 'persiste vínculo explícito');
select ok((select role = 'management' and enabled from user_access where user_id = '81000000-0000-4000-8000-000000000002'), 'vincular conserva rol y habilitación');
select is((select employee_name from list_user_access() where user_id = '81000000-0000-4000-8000-000000000002'), 'Uno, Ficticio', 'admin ve identidad laboral junto a la cuenta');
select throws_ok(format($$select set_employee_account('81000000-0000-4000-8000-000000000002', %L, null)$$, :'version_cuenta'), '40001', 'access_changed', 'versión anterior no desvincula');
select throws_ok(format($$select set_user_access('81000000-0000-4000-8000-000000000002','admin',true,%L)$$, :'version_cuenta'), '40001', 'access_changed', 'vincular invalida también un formulario viejo de permisos');
select throws_ok(format($$select set_employee_account('81000000-0000-4000-8000-000000000003',
  (select updated_at from user_access where user_id = '81000000-0000-4000-8000-000000000003'), %L)$$, :'empleado'), '23505', null, 'dos cuentas no comparten una ficha');
select throws_ok(format($$select set_employee_account('81000000-0000-4000-8000-000000000002',
  (select updated_at from user_access where user_id = '81000000-0000-4000-8000-000000000002'), %L)$$, :'otro'), '23514', 'account_already_linked', 'no sustituye silenciosamente el vínculo de una cuenta');
select throws_ok(format($$select set_employee_account('81000000-0000-4000-8000-000000000004',null,%L)$$, :'otro'), 'P0002', 'account_access_missing', 'primero exige asignar perfil a la cuenta');
select throws_ok(format($$select terminate_employee(%L,(select updated_at from employees where id = %L),'2025-02-01','Fin ficticio')$$, :'empleado', :'empleado'), '23514', 'employee_access_enabled', 'baja exige suspender la cuenta vinculada');
select ok((select terminated_at is null from employees where id = :'empleado'), 'baja rechazada no cambia la ficha');

select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000002',true);
select throws_ok($$select set_employee_account(null,null,null)$$, '42501','permission_denied','Gestión no altera vínculos');
select is((select count(*) from employee_account_events),0::bigint,'Gestión no lee historial de vínculos');
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000003',true);
select throws_ok($$select set_employee_account(null,null,null)$$, '42501','permission_denied','Solo lectura no altera vínculos');
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
select set_user_access('81000000-0000-4000-8000-000000000002','management',false,
  (select updated_at from user_access where user_id = '81000000-0000-4000-8000-000000000002'));
select terminate_employee(:'empleado',(select updated_at from employees where id = :'empleado'),'2025-02-01','Fin ficticio');
select is((select employee_id from user_access where user_id = '81000000-0000-4000-8000-000000000002'), :'empleado'::uuid, 'baja conserva identidad vinculada');
select throws_ok($$select set_user_access('81000000-0000-4000-8000-000000000002','management',true,
  (select updated_at from user_access where user_id = '81000000-0000-4000-8000-000000000002'))$$,
  '23514','employee_inactive','no habilita una cuenta vinculada a una baja');
select lives_ok($$select set_user_access('81000000-0000-4000-8000-000000000002','readonly',false,
  (select updated_at from user_access where user_id = '81000000-0000-4000-8000-000000000002'))$$,
  'permite mantener suspendida la cuenta de una baja');
select set_employee_account('81000000-0000-4000-8000-000000000002',
  (select updated_at from user_access where user_id = '81000000-0000-4000-8000-000000000002'),null);
select ok((select employee_id is null and not enabled and role = 'readonly' from user_access where user_id = '81000000-0000-4000-8000-000000000002'), 'desvincular no habilita ni cambia el perfil');
select throws_ok(format($$select set_employee_account('81000000-0000-4000-8000-000000000003',
  (select updated_at from user_access where user_id = '81000000-0000-4000-8000-000000000003'),%L)$$, :'empleado'), '23514','employee_inactive','no asigna nuevas cuentas a empleados inactivos');
select is((select count(*) from employee_account_events),2::bigint,'registra vínculo y desvinculación, no intentos fallidos');
select ok((select bool_and(changed_by = auth.uid()) from employee_account_events),'autor tomado de la sesión');
select ok((select previous_employee_id = :'empleado' and employee_id is null from employee_account_events order by id desc limit 1),'historial conserva la ficha anterior');
reset role;
select * from finish();
rollback;
