begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, email) values
  ('80000000-0000-4000-8000-000000000001', 'admin@example.invalid'),
  ('80000000-0000-4000-8000-000000000002', 'gestion@example.invalid'),
  ('80000000-0000-4000-8000-000000000003', 'lectura@example.invalid'),
  ('80000000-0000-4000-8000-000000000004', 'pendiente@example.invalid');
insert into user_access (user_id, role) values
  ('80000000-0000-4000-8000-000000000001', 'admin'),
  ('80000000-0000-4000-8000-000000000002', 'management'),
  ('80000000-0000-4000-8000-000000000003', 'readonly');
insert into consulta (id, nombre, telefono) values ('80000000-0000-4000-8000-000000000010', 'Familia ficticia', '000000');
insert into residents (id, first_name, last_name, dni, birth_date)
values ('80000000-0000-4000-8000-000000000011', 'Persona ficticia', 'Prueba', 'TEST-PERMISOS', '1940-01-01');
insert into admissions (id, resident_id, admitted_at, monthly_fee, due_day)
values ('80000000-0000-4000-8000-000000000012', '80000000-0000-4000-8000-000000000011', '2025-01-01', 100, 10);

select ok(not has_table_privilege('authenticated', 'user_access', 'insert,update,delete'), 'los perfiles no se escriben directamente');
select ok(not has_table_privilege('authenticated', 'access_events', 'insert,update,delete'), 'la auditoría no se altera');
select ok(not has_function_privilege('anon', 'list_user_access()', 'execute'), 'anon no lista cuentas');
select ok(not has_function_privilege('anon', 'set_user_access(uuid,text,boolean,timestamptz)', 'execute'), 'anon no asigna perfiles');

set local role authenticated;
select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000001', true);
select is((select count(*) from list_user_access()), 4::bigint, 'admin lista cuentas, incluidas las pendientes');
select save_employee(null,null,'Empleado ficticio','Prueba','TEST-ACC-EMP','Cuidador','2025-01-01') as empleado \gset
select throws_ok($$select set_user_access('80000000-0000-4000-8000-000000000001','readonly',true,
  (select updated_at from user_access where user_id = auth.uid()))$$,
  '23514', 'last_admin_required', 'no degrada al último administrador');
select throws_ok($$select set_user_access('80000000-0000-4000-8000-000000000001','admin',false,
  (select updated_at from user_access where user_id = auth.uid()))$$,
  '23514', 'last_admin_required', 'no suspende al último administrador');

select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000002', true);
select ok(has_permission('operational.write') and not has_permission('administration'), 'Gestión tiene solo permisos operativos');
select is((select count(*) from employees), 0::bigint, 'Gestión no ve empleados');
select is((select count(*) from user_access), 1::bigint, 'Gestión solo ve su propio perfil');
select throws_ok($$select list_user_access()$$, '42501', 'permission_denied', 'Gestión no enumera correos de cuentas');
select throws_ok($$select save_employee()$$, '42501', 'permission_denied', 'Gestión no crea empleados');
select throws_ok($$select terminate_employee(null,null,null,null)$$, '42501', 'permission_denied', 'Gestión no da bajas de empleados');
select throws_ok($$select set_user_access('80000000-0000-4000-8000-000000000002','admin',true)$$, '42501', 'permission_denied', 'no se eleva a sí mismo');
select create_monthly_charge('80000000-0000-4000-8000-000000000012','2025-01-01','2025-01-10',100) as cuota \gset
select '80000000-0000-4000-8000-000000000002/80000000-0000-4000-8000-000000000012/' || :'cuota' || '/ficticio.pdf' as ruta \gset
insert into storage.objects (bucket_id, name) values ('payment-receipts', :'ruta');
select record_payment(:'cuota','2025-01-05',10,'cash',null,:'ruta') as pago \gset
select lives_ok($$select update_consulta('80000000-0000-4000-8000-000000000010',
  (select actualizado_en from consulta where id = '80000000-0000-4000-8000-000000000010'), 'nuevo', 'save_notes', p_notes := 'Nota ficticia')$$,
  'Gestión actualiza consultas');

select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000003', true);
select ok(has_permission('operational.read') and not has_permission('operational.write'), 'Solo lectura lee sin escribir');
select is((select count(*) from consulta), 1::bigint, 'consulta se lee con RLS y sesión');
select is((select count(*) from residents), 1::bigint, 'Solo lectura ve residentes');
select is((select count(*) from monthly_charge_balances), 1::bigint, 'Solo lectura ve saldos');
select is((select count(*) from payments), 1::bigint, 'Solo lectura ve pagos');
select is((select count(*) from storage.objects where bucket_id = 'payment-receipts'), 1::bigint, 'Solo lectura descarga comprobantes vinculados');
select throws_ok(format($$insert into storage.objects (bucket_id, name) values ('payment-receipts', %L)$$,
  replace(:'ruta', '000000000002/', '000000000003/')), '42501', null, 'Solo lectura no carga comprobantes');
select is((select count(*) from employees), 0::bigint, 'Solo lectura no ve empleados');
select throws_ok($$insert into residents(first_name,last_name,dni,birth_date) values ('X','X','TEST-DENEGADO','1940-01-01')$$,
  '42501', null, 'RLS bloquea INSERT directo');
select results_eq($$update residents set first_name = 'Alterado' returning id$$, array[]::uuid[], 'RLS bloquea UPDATE directo');
select throws_ok($$select create_monthly_charge(null,null,null,null)$$, '42501', 'permission_denied', 'rechaza cuota antes de validar entrada');
select throws_ok($$select record_payment(null,null,null,null)$$, '42501', 'permission_denied', 'rechaza pago');
select throws_ok($$select void_payment(null,null)$$, '42501', 'permission_denied', 'rechaza anulación de pago');
select throws_ok($$select cancel_monthly_charge(null,null)$$, '42501', 'permission_denied', 'rechaza cancelación de cuota');
select throws_ok($$select update_consulta(null,null,null,null)$$, '42501', 'permission_denied', 'rechaza modificación de consulta');
select throws_ok($$select convert_consultation_admission(null,null,null,null,null)$$, '42501', 'permission_denied', 'rechaza conversión antes de devolver ingresos existentes');

select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000004', true);
select is(current_app_role(), null, 'crear Auth no asigna un perfil');
select is((select count(*) from consulta), 0::bigint, 'cuenta pendiente no ve consultas');
select is((select count(*) from residents), 0::bigint, 'cuenta pendiente no ve residentes');
select is((select count(*) from monthly_charge_balances), 0::bigint, 'vista de saldos respeta RLS');
select throws_ok($$select create_monthly_charge(null,null,null,null)$$, '42501', 'permission_denied', 'cuenta pendiente no escribe');

select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000001', true);
select set_user_access('80000000-0000-4000-8000-000000000004','readonly',true);
select throws_ok($$select set_user_access('80000000-0000-4000-8000-000000000004','admin',true)$$,
  '40001', 'access_changed', 'una pantalla obsoleta no sobrescribe permisos');
select set_user_access('80000000-0000-4000-8000-000000000002','management',false,
  (select updated_at from user_access where user_id = '80000000-0000-4000-8000-000000000002'));
select is((select count(*) from access_events), 2::bigint, 'registra autor y cambios de acceso');
select ok((select bool_and(changed_by = auth.uid()) from access_events), 'autor proviene de la sesión');
select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000002', true);
select is((select count(*) from consulta), 0::bigint, 'suspensión revoca lecturas conservando el mismo JWT');
select is((select count(*) from storage.objects where bucket_id = 'payment-receipts'), 0::bigint, 'suspensión bloquea incluso sus propias cargas');
select throws_ok($$select record_payment(null,null,null,null)$$, '42501', 'permission_denied', 'suspensión revoca escrituras');
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$select create_monthly_charge(null,null,null,null)$$, '42501', 'authentication_required', 'JWT sin identidad no escribe');
reset role;
select * from finish();
rollback;

