begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
insert into auth.users (id) values ('70000000-0000-4000-8000-000000000099');
set local role anon;
select throws_ok($$ select * from employees $$, '42501', null, 'anónimo no lee personal');
select throws_ok($$ select save_employee(null,null,'Ficticio','Prueba','TEST-EMP','Cuidador','2025-01-01') $$,
  '42501', null, 'anónimo no registra personal');
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$ select save_employee(null,null,'Ficticio','Prueba','TEST-EMP','Cuidador','2025-01-01') $$,
  '42501', 'authentication_required', 'requiere identidad');
select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000099', true);
select throws_ok($$ insert into employees(first_name) values ('Prueba') $$, '42501', null, 'no permite insert directo');
select save_employee(null,null,'Ficticio','Prueba',' TEST.EMP ','Cuidador','2025-01-01') as empleado \gset
select updated_at as version from employees where id = :'empleado' \gset
select is((select dni from employees where id = :'empleado'), 'TESTEMP', 'normaliza DNI');
select is((select created_by from employees where id = :'empleado'), auth.uid(), 'registra autor');
select throws_ok($$ select save_employee(null,null,'Otro','Prueba','TESTEMP','Cuidador','2025-01-01') $$,
  '23505', null, 'no duplica identidad normalizada');
select throws_ok($$ select save_employee(null,null,'Ficticio','Prueba','OTRO','Cuidador','2999-01-01') $$,
  '23514', 'employee_future_date', 'no crea altas futuras');
select throws_ok($$ select save_employee(null,null,'Ficticio','Prueba','OTRO','Cuidador','2025-01-01','2025-02-01') $$,
  '23514', null, 'nacimiento no posterior al alta');
select throws_ok($$ select save_employee(null,null,'Ficticio','Prueba','OTRO','Cuidador','2025-01-01',p_email=>'incorrecto') $$,
  '23514', null, 'rechaza correo inválido');
select is((select count(*) from employees), 1::bigint, 'errores no dejan fichas parciales');
select save_employee(:'empleado',:'version','Ficticio','Prueba','TESTEMP','Coordinador','2025-01-01');
select cmp_ok((select updated_at from employees where id = :'empleado'), '>', :'version'::timestamptz, 'versión crece estrictamente');
select throws_ok(format($$ select save_employee(%L,%L,'Ficticio','Prueba','TESTEMP','Viejo','2025-01-01') $$, :'empleado', :'version'),
  '40001', 'employee_changed', 'rechaza edición desactualizada');
select updated_at as version from employees where id = :'empleado' \gset
select throws_ok(format($$ select terminate_employee(%L,%L,'2024-12-31','Prueba') $$, :'empleado', :'version'),
  '23514', null, 'baja no anterior al alta');
select throws_ok(format($$ select terminate_employee(%L,%L,'2025-02-01','') $$, :'empleado', :'version'),
  '23514', null, 'baja requiere motivo');
select terminate_employee(:'empleado',:'version','2025-02-01','Fin ficticio');
select is((select terminated_at from employees where id = :'empleado'), '2025-02-01'::date, 'conserva la baja');
select updated_at as version from employees where id = :'empleado' \gset
select throws_ok(format($$ select save_employee(%L,%L,'Ficticio','Prueba','TESTEMP','Cambio','2025-01-01') $$, :'empleado', :'version'),
  '23514', 'employee_inactive', 'baja queda de consulta');
select throws_ok($$ update employees set job_title = 'Cambio' $$, '42501', null, 'no permite update directo');
select throws_ok($$ delete from employees $$, '42501', null, 'no permite borrar fichas');
select * from finish();
rollback;
