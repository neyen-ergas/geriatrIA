begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select is(normalize_resident_dni(U&' 00.123\00a0456\202f\0009'),
  '00123456', 'quita separadores y conserva ceros iniciales');
select is(normalize_resident_dni('TEST-DNI'), 'TEST-DNI',
  'no transforma otros caracteres del identificador');

set local role authenticated;
select set_config('request.jwt.claim.sub',
  '20000000-0000-4000-8000-000000000099', true);

insert into residents (id, first_name, last_name, dni, birth_date) values
  ('20000000-0000-4000-8000-000000000001', 'Prueba ficticia', 'DNI', '99.000.001', '1940-01-01'),
  ('20000000-0000-4000-8000-000000000002', 'Otra prueba ficticia', 'DNI', '99 000 002', '1940-01-01');

select is((select dni from residents
  where id = '20000000-0000-4000-8000-000000000001'), '99000001',
  'INSERT directo persiste el DNI normalizado');
select throws_ok($$
  insert into residents (first_name, last_name, dni, birth_date)
  values ('Duplicado ficticio', 'DNI', '99000001', '1940-01-01')
$$, '23505', null, 'el DNI sin puntos no duplica al DNI con puntos');
select throws_ok($$
  insert into residents (first_name, last_name, dni, birth_date)
  values ('Duplicado ficticio', 'DNI', ' 99.000 001 ', '1940-01-01')
$$, '23505', null, 'la combinación de puntos y espacios tampoco duplica');
select throws_ok($$
  update residents set dni = '99.000.001'
  where id = '20000000-0000-4000-8000-000000000002'
$$, '23505', null, 'editar no permite apropiarse de otro DNI');
select is((select dni from residents
  where id = '20000000-0000-4000-8000-000000000002'), '99000002',
  'la edición rechazada conserva el DNI anterior');
select throws_ok($$
  insert into residents (first_name, last_name, dni, birth_date)
  values ('Vacío ficticio', 'DNI', ' . . ', '1940-01-01')
$$, '23514', null, 'un DNI de solo separadores se rechaza');
select lives_ok($$
  update residents set dni = ' 99.000.002 '
  where id = '20000000-0000-4000-8000-000000000002'
$$, 'editar el propio DNI con separadores es válido');
select is((select dni from residents
  where id = '20000000-0000-4000-8000-000000000002'), '99000002',
  'UPDATE también persiste el valor normalizado');

select throws_ok($$
  select create_initial_admission('Duplicado ficticio', 'DNI', '99 000 001',
    '1940-01-01', 'Contacto ficticio', 'DNI', 'Familiar', '000000',
    true, true, '2026-01-01', 100, 10)
$$, '23505', null, 'el alta transaccional también rechaza duplicados');
select is((select count(*) from family_contacts
  where resident_id in ('20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002')), 0::bigint,
  'el alta rechazada no agrega contactos');

reset role;
select * from finish();
rollback;
