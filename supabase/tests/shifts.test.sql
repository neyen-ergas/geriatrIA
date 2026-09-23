begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
insert into auth.users(id) values
 ('93000000-0000-4000-8000-000000000001'),
 ('93000000-0000-4000-8000-000000000002'),
 ('93000000-0000-4000-8000-000000000003');
insert into user_access(user_id,role) values
 ('93000000-0000-4000-8000-000000000001','admin'),
 ('93000000-0000-4000-8000-000000000002','management'),
 ('93000000-0000-4000-8000-000000000003','readonly');
set local role authenticated;
select set_config('request.jwt.claim.sub','93000000-0000-4000-8000-000000000001',true);
select save_employee(null,null,'Titular','Ficticio','TEST-SHIFT-A','Cuidador','2025-01-01') as a \gset
select save_employee(null,null,'Reemplazo','Ficticio','TEST-SHIFT-B','Cuidador','2025-01-01') as b \gset
select save_employee(null,null,'Otro','Ficticio','TEST-SHIFT-C','Cuidador','2025-01-01') as c \gset
select save_shift(null,:'a','2026-09-23','manana') as manana \gset
select save_shift(null,:'a','2026-09-23','tarde') as tarde \gset
select save_shift(null,:'a','2026-09-23','noche') as noche \gset
select lives_ok(format($$select save_shift(null,%L,'2026-09-24','manana')$$, :'a'),
 'límites contiguos no se superponen');
select throws_ok(format($$select save_shift(null,%L,'2026-09-23','guardia',null,'10:00')$$, :'a'),
 '23P01',null,'guardia choca con franjas distintas');
select throws_ok(format($$select save_shift(null,%L,'2026-09-24','franco')$$, :'a'),
 '23P01',null,'franco choca con la noche anterior');
select throws_ok(format($$select save_shift(null,%L,'2026-09-25','guardia')$$, :'a'),
 '23514',null,'guardia exige horario explícito');
select save_shift(null,:'b','2026-09-23','manana') as ocupado \gset
select updated_at as version from shifts where id = :'manana' \gset
select throws_ok(format($$select cover_shift(%L,%L,'Motivo ficticio',null,%L)$$, :'manana', :'b', :'version'),
 '23P01',null,'no cubre quien ya tiene turno');
select is((select status from shifts where id = :'manana'),'scheduled','conflicto revierte la ausencia');
select lives_ok(format($$select cover_shift(%L,%L,'Motivo ficticio',null,%L)$$, :'manana', :'c', :'version'),
 'reemplazante disponible puede cubrir');
select throws_ok(format($$select save_shift(null,%L,'2026-09-23','manana')$$, :'c'),
 '23P01',null,'cobertura también reserva el horario');
select updated_at as cubierta from shifts where id = :'manana' \gset
select throws_ok(format($$select cover_shift(%L,%L,'Motivo viejo',null,%L)$$, :'manana', :'b', :'version'),
 '40001','shift_changed','cobertura vieja no pisa la nueva');
select throws_ok(format($$select save_shift(%L,%L,'2026-09-23','tarde',null,null,%L)$$, :'manana', :'a', :'cubierta'),
 '23P01',null,'editar una ausencia también verifica horarios');
select is((select shift_type from shifts where id = :'manana'),'manana','edición fallida conserva turno');
select updated_at as ocupado_version from shifts where id = :'ocupado' \gset
select cancel_shift(:'ocupado', :'ocupado_version');
select lives_ok(format($$select cover_shift(%L,%L,'Motivo ficticio',null,%L)$$, :'manana', :'b', :'cubierta'),
 'cancelación libera horario y permite reasignar cobertura');
select lives_ok(format($$select save_shift(null,%L,'2026-09-23','manana')$$, :'c'),
 'reasignar cobertura libera reemplazante anterior');
select throws_ok(format($$select save_shift(%L,%L,'2026-09-23','manana')$$, :'tarde', :'a'),
 '40001','shift_changed','editar exige versión');
select throws_ok(format($$select cancel_shift(%L)$$, :'tarde'),
 '40001','shift_changed','cancelar exige versión');
select save_shift(null,:'b','2026-09-25','guardia',null,'19:00') as guardia \gset
select throws_ok(format($$select save_shift(null,%L,'2026-09-26','guardia',null,'06:00')$$, :'b'),
 '23P01',null,'dos guardias en días distintos también pueden superponerse');
select lives_ok(format($$select save_shift(null,%L,'2026-09-26','manana')$$, :'b'),
 'guardia nocturna termina a las 07:00 del día siguiente');
select save_shift(null,:'c','2026-09-27','franco') as franco \gset
select updated_at as franco_version from shifts where id = :'franco' \gset
select throws_ok(format($$select cover_shift(%L,%L,'Motivo ficticio',null,%L)$$, :'franco', :'b', :'franco_version'),
 '23514','franco_cannot_be_covered','un descanso no se cubre');
select ok(not has_table_privilege('authenticated','public.shifts','UPDATE'),'no concede escritura directa');
select throws_ok($$select * from shift_reservations$$,'42501',null,'reservas internas sin lectura directa');
select set_config('request.jwt.claim.sub','93000000-0000-4000-8000-000000000002',true);
select is((select count(*) from shifts),0::bigint,'Gestión no lee turnos ni motivos');
select throws_ok(format($$select cover_shift(%L,%L,'Motivo ficticio',null,%L)$$, :'franco', :'b', :'franco_version'),
 '42501','permission_denied','Gestión no modifica');
select set_config('request.jwt.claim.sub','93000000-0000-4000-8000-000000000003',true);
select is((select count(*) from shifts),0::bigint,'Solo lectura no lee turnos');
select throws_ok($$select save_shift()$$,'42501','permission_denied','Solo lectura no asigna');
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select save_shift()$$,'42501','authentication_required','requiere identidad');
set local role anon;
select throws_ok($$select * from shifts$$,'42501',null,'anónimo no lee turnos');
reset role;
update user_access set enabled = false where user_id = '93000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','93000000-0000-4000-8000-000000000001',true);
select is((select count(*) from shifts),0::bigint,'Administrador suspendido no lee');
select throws_ok($$select save_shift()$$,'42501','permission_denied','Administrador suspendido no escribe');
select * from finish();
rollback;
