begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, email) values
  ('91000000-0000-4000-8000-000000000001', 'gestion-manual@example.invalid'),
  ('91000000-0000-4000-8000-000000000002', 'lectura-manual@example.invalid');
insert into public.user_access (user_id, role) values
  ('91000000-0000-4000-8000-000000000001', 'management'),
  ('91000000-0000-4000-8000-000000000002', 'readonly');

select ok(not has_function_privilege('anon',
  'public.create_manual_consultation(text,text,text,text,text,boolean)', 'execute'),
  'anon no puede registrar consultas manuales');
select ok(has_function_privilege('authenticated',
  'public.create_manual_consultation(text,text,text,text,text,boolean)', 'execute'),
  'la sesión autenticada puede usar la función protegida');
select ok(not has_table_privilege('authenticated', 'public.consulta', 'insert'),
  'no se abre INSERT directo sobre los datos de familias');

set local role authenticated;
select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000001', true);
select create_manual_consultation('Ana ficticia', '11 5555-1234', 'Consulta por vacante',
  'telefono', 'indistinto')->>'created_id' as consulta_id \gset
select ok(:'consulta_id'::uuid is not null, 'Gestión registra una consulta telefónica');
select is((select origen from public.consulta where id = :'consulta_id'::uuid),
  'telefono', 'el origen queda visible en el mismo circuito de Admisión');
select is((create_manual_consultation('Ana ficticia', '(11) 5555 1234', 'Otra llamada',
  'telefono', 'tarde')->>'duplicate_id')::uuid, :'consulta_id'::uuid,
  'el mismo teléfono con otro formato señala la consulta abierta');
select is((select count(*) from public.consulta where telefono like '%5555%'), 1::bigint,
  'la advertencia no crea una fila duplicada');
select ok((create_manual_consultation('Otra familia ficticia', '11 5555 1234',
  'Otra familia comparte teléfono', 'presencial', 'tarde', true)->>'created_id')::uuid is not null,
  'el operador puede confirmar que se trata de otra familia');
select is((select count(*) from public.consulta where telefono like '%5555%'), 2::bigint,
  'la segunda consulta queda separada y trazable');

select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000002', true);
select throws_ok($$select create_manual_consultation('Prueba', '1155559999',
  'Motivo ficticio', 'telefono', 'indistinto')$$,
  '42501', 'permission_denied', 'Solo lectura no puede crear consultas');
select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000001', true);
select throws_ok($$select create_manual_consultation('Prueba', '123',
  'Motivo ficticio', 'telefono', 'indistinto')$$,
  '22023', 'invalid_manual_consultation', 'el servidor también valida datos incompletos');

reset role;
select * from finish();
rollback;
