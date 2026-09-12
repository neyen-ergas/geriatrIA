begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
insert into auth.users (id) values ('60000000-0000-4000-8000-000000000099');
insert into consulta (id, nombre, telefono, estado, visita_fecha, visita_franja) values
  ('60000000-0000-4000-8000-000000000001', 'Contacto ficticio', '0000000', 'visita_agendada', '2025-01-01', 'manana'),
  ('60000000-0000-4000-8000-000000000002', 'Contacto ficticio', '0000000', 'ingreso', null, null),
  ('60000000-0000-4000-8000-000000000003', 'Contacto ficticio', '0000000', 'nuevo', null, null);
select actualizado_en as version from consulta where id = '60000000-0000-4000-8000-000000000001' \gset
select actualizado_en as version2 from consulta where id = '60000000-0000-4000-8000-000000000002' \gset
select actualizado_en as version3 from consulta where id = '60000000-0000-4000-8000-000000000003' \gset
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$ select convert_consultation_admission(gen_random_uuid(), now(), '2025-01-01', 100, 10) $$,
  '42501', 'authentication_required', 'requiere sesión');
select set_config('request.jwt.claim.sub', '60000000-0000-4000-8000-000000000099', true);
select throws_ok(format($$ select convert_consultation_admission(
  '60000000-0000-4000-8000-000000000003', %L, '2025-01-01', 100, 10) $$, :'version3'),
  '22023', 'invalid_consulta_transition', 'no convierte una consulta nueva sin visita');
select throws_ok($$ select convert_consultation_admission(
  '60000000-0000-4000-8000-000000000001', '2000-01-01', '2025-01-01', 100, 10) $$,
  '40001', 'consulta_changed', 'rechaza formulario desactualizado');
select throws_ok(format($$ select convert_consultation_admission(
  '60000000-0000-4000-8000-000000000001', %L, '2025-01-01', 100, 10,
  p_resident_first_name => 'Ficticio', p_resident_last_name => 'Prueba',
  p_resident_dni => 'TEST-CONVERSION', p_resident_birth_date => '1940-01-01',
  p_contact_first_name => '', p_contact_last_name => 'Prueba',
  p_contact_relationship => 'Familiar', p_contact_phone => '0000000') $$, :'version'),
  '23514', null, 'un contacto inválido revierte el ingreso completo');
select is((select count(*) from residents where dni = 'TEST-CONVERSION'), 0::bigint, 'no deja residente parcial');
select is((select count(*) from consultation_admissions), 0::bigint, 'no deja vínculo parcial');
select convert_consultation_admission('60000000-0000-4000-8000-000000000001', :'version',
  '2025-01-01', 100, 10, p_resident_first_name => 'Ficticio', p_resident_last_name => 'Prueba',
  p_resident_dni => 'TEST-CONVERSION', p_resident_birth_date => '1940-01-01',
  p_contact_first_name => 'Familiar', p_contact_last_name => 'Prueba',
  p_contact_relationship => 'Familiar', p_contact_phone => '0000000') as ingreso \gset
select is(convert_consultation_admission('60000000-0000-4000-8000-000000000001', :'version',
  '2025-01-01', 100, 10), :'ingreso'::uuid, 'repetir devuelve la misma estadía');
select is((select count(*) from consultation_admissions), 1::bigint, 'solo un vínculo');
select is((select count(*) from visit_events where consultation_id = '60000000-0000-4000-8000-000000000001'
  and action = 'closed'), 1::bigint, 'conserva un único cierre de visita');
select resident_id as residente from admissions where id = :'ingreso' \gset
select throws_ok(format($$ select convert_consultation_admission(
  '60000000-0000-4000-8000-000000000002', %L, '2025-03-01', 100, 10, %L) $$,
  :'version2', :'residente'), '23514', 'resident_has_active_admission', 'no duplica estadía activa');
update admissions set discharged_at = '2025-02-01', discharge_reason = 'Prueba' where id = :'ingreso';
select convert_consultation_admission('60000000-0000-4000-8000-000000000002', :'version2',
  '2025-03-01', 100, 10, :'residente') as reingreso \gset
select isnt(:'ingreso'::uuid, :'reingreso'::uuid, 'reingreso tiene estadía propia');
select is((select count(*) from residents where dni = 'TEST-CONVERSION'), 1::bigint, 'reingreso conserva la persona');
select is((select count(*) from family_contacts where resident_id = :'residente'), 1::bigint, 'no duplica contactos');
select throws_ok($$ update consultation_admissions set converted_at = now() $$,
  '42501', null, 'vínculo no editable directamente');
reset role;
select is((select estado from consulta where id = '60000000-0000-4000-8000-000000000001'), 'ingreso', 'consulta queda en ingreso');
select throws_ok($$ update consulta set estado = 'contactado' where id = '60000000-0000-4000-8000-000000000001' $$,
  '22023', 'consultation_already_converted', 'no reabre una consulta vinculada');
select * from finish();
rollback;
