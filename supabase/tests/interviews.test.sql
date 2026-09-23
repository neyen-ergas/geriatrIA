begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
insert into auth.users(id) values
 ('92000000-0000-4000-8000-000000000001'),
 ('92000000-0000-4000-8000-000000000002'),
 ('92000000-0000-4000-8000-000000000003');
insert into user_access(user_id,role) values
 ('92000000-0000-4000-8000-000000000001','admin'),
 ('92000000-0000-4000-8000-000000000002','management'),
 ('92000000-0000-4000-8000-000000000003','readonly');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select transition_interview(null,null,'completed')$$,
 '42501','authentication_required','requiere sesión');
select set_config('request.jwt.claim.sub','92000000-0000-4000-8000-000000000002',true);
select throws_ok($$select transition_interview(null,null,'completed')$$,
 '42501','permission_denied','Gestión no cambia entrevistas');
select set_config('request.jwt.claim.sub','92000000-0000-4000-8000-000000000003',true);
select throws_ok($$select transition_interview(null,null,'cancelled')$$,
 '42501','permission_denied','Solo lectura no cambia entrevistas');
select set_config('request.jwt.claim.sub','92000000-0000-4000-8000-000000000001',true);
select save_interview(null,null,'Persona ficticia',null,null,null,null,null,
 '2026-09-22',null,'scheduled',null,null,'Nota ficticia',null,'pendiente',null) as id \gset
select updated_at as original, created_at as creacion from interviews where id = :'id' \gset
select ok(not has_table_privilege('authenticated','public.interviews','UPDATE'),
 'la escritura directa sigue cerrada');
select throws_ok($$select transition_interview('92000000-0000-4000-8000-000000000099',now(),'completed')$$,
 'P0002','interview_not_found','identificador inexistente no informa éxito');
select throws_ok(format($$select transition_interview(%L,%L,'scheduled')$$, :'id', :'original'),
 '23514','invalid_interview_transition','la acción rápida no reabre');
select throws_ok(format($$select transition_interview(%L,null,'completed')$$, :'id'),
 '40001','interview_changed','exige versión');
select lives_ok(format($$select transition_interview(%L,%L,'completed')$$, :'id', :'original'),
 'Administrador puede completar');
select is((select status from interviews where id = :'id'),'completed','se guarda el estado');
select is((select medical_notes from interviews where id = :'id'),'Nota ficticia','preserva la evaluación');
select ok((select updated_at > :'original'::timestamptz and created_at = :'creacion'::timestamptz
 and updated_by = auth.uid() from interviews where id = :'id'),'versión y autor correctos');
select throws_ok(format($$select transition_interview(%L,%L,'cancelled')$$, :'id', :'original'),
 '40001','interview_changed','una segunda acción vieja no pisa la primera');
select updated_at as actual from interviews where id = :'id' \gset
select throws_ok(format($$select transition_interview(%L,%L,'cancelled')$$, :'id', :'actual'),
 '23514','invalid_interview_transition','no cancela una realizada');
select throws_ok(format($$select save_interview(%L,null,'Cambio viejo',null,null,null,null,null,
 '2026-09-22',null,'scheduled',null,null,null,null,'pendiente',null,%L)$$, :'id', :'original'),
 '40001','interview_changed','el formulario viejo no revierte una acción rápida');
select throws_ok(format($$select save_interview(%L,null,'Sin versión',null,null,null,null,null,
 '2026-09-22',null,'scheduled',null,null,null,null,'pendiente',null)$$, :'id'),
 '40001','interview_changed','clientes anteriores no editan sin versión');
select lives_ok(format($$select save_interview(%L,null,'Persona ficticia',null,null,null,null,null,
 '2026-09-22',null,'scheduled',null,null,'Nota editada',null,'pendiente',null,%L)$$, :'id', :'actual'),
 'la edición actual conserva los estados permitidos del formulario');
select updated_at as editada from interviews where id = :'id' \gset
select throws_ok(format($$select transition_interview(%L,%L,'cancelled')$$, :'id', :'actual'),
 '40001','interview_changed','una acción vieja no pisa el formulario actualizado');
select lives_ok(format($$select transition_interview(%L,%L,'cancelled')$$, :'id', :'editada'),
 'Administrador puede cancelar una programada actual');
select is((select status from interviews where id = :'id'),'cancelled','cancelación persistida');
select is((select medical_notes from interviews where id = :'id'),'Nota editada','cancelación preserva cambios');
select * from finish();
rollback;
