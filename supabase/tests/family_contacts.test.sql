begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
insert into auth.users(id) values ('87000000-0000-4000-8000-000000000001'),('87000000-0000-4000-8000-000000000002');
insert into user_access(user_id,role) values
 ('87000000-0000-4000-8000-000000000001','management'),('87000000-0000-4000-8000-000000000002','readonly');
insert into residents(id,first_name,last_name,dni,birth_date) values
 ('87000000-0000-4000-8000-000000000010','Persona','Ficticia','TEST-FAMILY-A','1940-01-01'),
 ('87000000-0000-4000-8000-000000000011','Otra','Ficticia','TEST-FAMILY-B','1940-01-01');
insert into admissions(id,resident_id,admitted_at,monthly_fee,due_day) values
 ('87000000-0000-4000-8000-000000000030','87000000-0000-4000-8000-000000000010','2025-01-01',100,10);
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select save_family_contact('87000000-0000-4000-8000-000000000010','87000000-0000-4000-8000-000000000020')$$,
 '42501','authentication_required','requiere sesión antes de consultar');
select set_config('request.jwt.claim.sub','87000000-0000-4000-8000-000000000002',true);
select throws_ok($$select save_family_contact('87000000-0000-4000-8000-000000000010','87000000-0000-4000-8000-000000000020')$$,
 '42501','permission_denied','Solo lectura no modifica');
select set_config('request.jwt.claim.sub','87000000-0000-4000-8000-000000000001',true);
select save_family_contact('87000000-0000-4000-8000-000000000010','87000000-0000-4000-8000-000000000020',
 null,' Familiar ',' Ficticio ',' Hija ',' 0000000 ',true,false,' Nota ');
select updated_at as original from family_contacts where id = '87000000-0000-4000-8000-000000000020' \gset
select is((select first_name from family_contacts where id = '87000000-0000-4000-8000-000000000020'),'Familiar','normaliza espacios');
select lives_ok($$select save_family_contact('87000000-0000-4000-8000-000000000010','87000000-0000-4000-8000-000000000020',
 null,'Familiar','Ficticio','Hija','0000000',true,false,'Nota')$$,'reenviar alta confirmada no duplica');
select is((select count(*) from family_contacts where resident_id = '87000000-0000-4000-8000-000000000010'),1::bigint,'un solo contacto');
select save_family_contact('87000000-0000-4000-8000-000000000010','87000000-0000-4000-8000-000000000020',
 :'original','Familiar','Ficticio','Hija','1111111',false,true,null);
select ok((select updated_at > :'original'::timestamptz and notes is null and is_payment_responsible
 from family_contacts where id = '87000000-0000-4000-8000-000000000020'),'versión aumenta incluso dentro de la misma transacción');
select throws_ok(format($$select save_family_contact('87000000-0000-4000-8000-000000000010','87000000-0000-4000-8000-000000000020',
 %L,'Familiar','Ficticio','Hija','2222222')$$, :'original'),'40001','contact_changed','rechaza edición vieja');
select throws_ok($$select save_family_contact('87000000-0000-4000-8000-000000000011','87000000-0000-4000-8000-000000000020',
 null,'Familiar','Ficticio','Hija','1111111')$$,'P0002','contact_not_found','no traslada contacto a otra persona');
select throws_ok($$select save_family_contact('87000000-0000-4000-8000-000000000010','87000000-0000-4000-8000-000000000021',
 null,' ','Ficticio','Hija','1111111')$$,'23514','invalid_contact','datos obligatorios también en base');
-- El formulario anterior de ingreso también debe rechazar una versión vieja.
select throws_ok(format($$select update_active_admission(
 '87000000-0000-4000-8000-000000000010','87000000-0000-4000-8000-000000000020','87000000-0000-4000-8000-000000000030',
 'No guardar','Ficticia','TEST-FAMILY-A','1940-01-01','Familiar','Ficticio','Hija','2222222',true,true,'2025-01-01',100,10,
 p_expected_contact_updated_at := %L)$$, :'original'),'40001','contact_changed','edición de ingreso no pisa el familiar actualizado');
select is((select first_name from residents where id = '87000000-0000-4000-8000-000000000010'),'Persona','rechazo revierte también los datos personales');
select updated_at as actual from family_contacts where id = '87000000-0000-4000-8000-000000000020' \gset
select update_active_admission(
 '87000000-0000-4000-8000-000000000010','87000000-0000-4000-8000-000000000020','87000000-0000-4000-8000-000000000030',
 'Persona','Ficticia','TEST-FAMILY-A','1940-01-01','Familiar','Ficticio','Hija','3333333',true,true,'2025-01-01',100,10,
 p_expected_contact_updated_at := :'actual');
select throws_ok(format($$select save_family_contact('87000000-0000-4000-8000-000000000010','87000000-0000-4000-8000-000000000020',
 %L,'Familiar','Ficticio','Hija','2222222')$$, :'actual'),'40001','contact_changed','edición de ingreso invalida el formulario de familiar');
select lives_ok($$select save_family_contact('87000000-0000-4000-8000-000000000011','87000000-0000-4000-8000-000000000021',
 null,'Otro','Familiar','Hijo','0000000')$$,'contactos no dependen de tener estadía activa');
select lives_ok($$select update_active_admission(
 '87000000-0000-4000-8000-000000000010','87000000-0000-4000-8000-000000000020','87000000-0000-4000-8000-000000000030',
 'Persona','Ficticia','TEST-FAMILY-A','1940-01-01','Familiar','Ficticio','Hija','3333333',true,true,'2025-01-01',100,10)$$,
 'cliente anterior puede guardar si conserva exactamente el contacto actual');
select throws_ok($$select update_active_admission(
 '87000000-0000-4000-8000-000000000010','87000000-0000-4000-8000-000000000020','87000000-0000-4000-8000-000000000030',
 'Persona','Ficticia','TEST-FAMILY-A','1940-01-01','Familiar','Ficticio','Hija','4444444',true,true,'2025-01-01',100,10)$$,
 '40001','contact_changed','sin versión nunca puede modificar el contacto');
reset role;
select is((select count(*) from audit_events where table_name = 'family_contacts' and record_id = '87000000-0000-4000-8000-000000000020'),3::bigint,
 'auditoría registra alta y dos cambios, sin reenvíos ni fallos');
select ok((select bool_and(actor_id = '87000000-0000-4000-8000-000000000001') from audit_events
 where table_name = 'family_contacts' and record_id = '87000000-0000-4000-8000-000000000020'),'autor tomado de la sesión');
select * from finish();
rollback;
