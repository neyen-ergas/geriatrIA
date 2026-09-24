begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
insert into auth.users(id) values
 ('94000000-0000-4000-8000-000000000001'),
 ('94000000-0000-4000-8000-000000000002'),
 ('94000000-0000-4000-8000-000000000003');
insert into user_access(user_id,role) values
 ('94000000-0000-4000-8000-000000000001','admin'),
 ('94000000-0000-4000-8000-000000000002','admin'),
 ('94000000-0000-4000-8000-000000000003','management');
set local role authenticated;
select set_config('request.jwt.claim.sub','94000000-0000-4000-8000-000000000001',true);
select save_employee(null,null,'Ficticia','Persona','94000001','Cuidador','2025-01-01') as empleado \gset
select throws_ok($$select save_interview(p_candidate_name := 'Prueba ficticia', p_interview_date := '2026-09-24')$$,
 '22023','creation_request_required','el alta exige clave estable');
select save_interview(p_candidate_name := 'Prueba ficticia', p_interview_date := '2026-09-24',
 p_request_id := '94000000-0000-4000-8000-000000000010') as entrevista \gset
select is(save_interview(p_candidate_name := 'Prueba ficticia', p_interview_date := '2026-09-24',
 p_request_id := '94000000-0000-4000-8000-000000000010'),:'entrevista'::uuid,
 'reenvío de entrevista devuelve el mismo ID');
select is((select count(*) from interviews),1::bigint,'reenvío no duplica entrevista');
select throws_ok($$select save_interview(p_candidate_name := 'Datos distintos', p_interview_date := '2026-09-24',
 p_request_id := '94000000-0000-4000-8000-000000000010')$$,
 '23505','creation_request_reused','misma clave con otros datos se rechaza');
select throws_ok(format($$select save_shift(null,%L,'2026-09-25','manana')$$, :'empleado'),
 '22023','creation_request_required','turno exige clave estable');
select save_shift(null,:'empleado','2026-09-25','manana',
 p_request_id := '94000000-0000-4000-8000-000000000011') as turno \gset
select is(save_shift(null,:'empleado','2026-09-25','manana',
 p_request_id := '94000000-0000-4000-8000-000000000011'),:'turno'::uuid,
 'reenvío de turno devuelve el mismo ID');
select is((select count(*) from shifts),1::bigint,'reenvío no duplica turno');
select throws_ok(format($$select save_shift(null,%L,'2026-09-26','manana',
 p_request_id := '94000000-0000-4000-8000-000000000011')$$, :'empleado'),
 '23505','creation_request_reused','misma clave con otra fecha se rechaza');
select throws_ok($$select * from creation_requests$$,'42501',null,'claves internas no tienen lectura directa');
select updated_at as version from employees where id = :'empleado' \gset
select throws_ok(format($$select terminate_employee(%L,%L,'2026-09-24','Fin ficticio')$$, :'empleado', :'version'),
 '23514','employee_has_future_shifts','baja no deja turnos futuros de titular');
select updated_at as turno_version from shifts where id = :'turno' \gset
select cancel_shift(:'turno', :'turno_version');
select lives_ok(format($$select terminate_employee(%L,%L,'2026-09-24','Fin ficticio')$$, :'empleado', :'version'),
 'cancelar turno libera baja');
select throws_ok(format($$select save_shift(null,%L,'2026-09-25','tarde',
 p_request_id := '94000000-0000-4000-8000-000000000012')$$, :'empleado'),
 '23514','shift_outside_employment_dates','baja impide alta posterior');
select set_config('request.jwt.claim.sub','94000000-0000-4000-8000-000000000002',true);
select throws_ok($$select save_interview(p_candidate_name := 'Prueba ficticia', p_interview_date := '2026-09-24',
 p_request_id := '94000000-0000-4000-8000-000000000010')$$,
 '23505','creation_request_reused','otro administrador no reutiliza clave ajena');
select set_config('request.jwt.claim.sub','94000000-0000-4000-8000-000000000003',true);
select throws_ok($$select save_interview(p_candidate_name := 'Prueba ficticia', p_interview_date := '2026-09-24',
 p_request_id := '94000000-0000-4000-8000-000000000013')$$,
 '42501','permission_denied','Gestión no crea entrevista');
select * from finish();
rollback;
