begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users(id,email) values
 ('95000000-0000-4000-8000-000000000001','admin-audit@example.invalid'),
 ('95000000-0000-4000-8000-000000000002','gestion-audit@example.invalid'),
 ('95000000-0000-4000-8000-000000000003','lectura-audit@example.invalid');
insert into user_access(user_id,role) values
 ('95000000-0000-4000-8000-000000000001','admin'),
 ('95000000-0000-4000-8000-000000000002','management'),
 ('95000000-0000-4000-8000-000000000003','readonly');
select ok((select relrowsecurity from pg_class where oid = 'audit_events'::regclass),'RLS sigue activo');
select ok(not has_table_privilege('authenticated','audit_events','insert,update,delete'),'no se permite falsificar eventos');

set local role authenticated;
select set_config('request.jwt.claim.sub','95000000-0000-4000-8000-000000000001',true);
select save_employee(null,null,'Ficticia','Titular','95000001','Cuidador','2025-01-01') as titular \gset
select save_employee(null,null,'Ficticia','Reemplazo','95000002','Cuidador','2025-01-01') as reemplazo \gset

select save_interview(p_candidate_name := 'Persona ficticia', p_interview_date := '2026-09-26',
 p_medical_notes := 'Inicial', p_request_id := '95000000-0000-4000-8000-000000000010') as entrevista \gset
select ok((select action = 'insert' and old_values is null and new_values->>'medical_notes' = 'Inicial'
 and record_label = 'Persona ficticia' and actor_id = auth.uid()
 from audit_events where table_name = 'interviews' and record_id = :'entrevista'),'alta de entrevista conserva autor y datos finales');
select ok((select not (new_values ?| array['updated_at','created_by','request_id'])
 from audit_events where table_name = 'interviews' and record_id = :'entrevista'),'no serializa relojes ni claves de reintento');
select save_interview(p_candidate_name := 'Persona ficticia', p_interview_date := '2026-09-26',
 p_medical_notes := 'Inicial', p_request_id := '95000000-0000-4000-8000-000000000010');
select is((select count(*) from audit_events where table_name = 'interviews' and record_id = :'entrevista'),1::bigint,'reintento no duplica evento');
select updated_at as entrevista_version from interviews where id = :'entrevista' \gset
select save_interview(p_id := :'entrevista', p_candidate_name := 'Persona ficticia',
 p_interview_date := '2026-09-26', p_status := 'scheduled', p_medical_notes := 'Revisada',
 p_conclusion := 'no_apto', p_rejection_reason := 'Motivo ficticio',
 p_expected_updated_at := :'entrevista_version');
select ok((select old_values->>'medical_notes' = 'Inicial' and new_values->>'medical_notes' = 'Revisada'
 and old_values->>'conclusion' = 'pendiente' and new_values->>'conclusion' = 'no_apto'
 and new_values->>'rejection_reason' = 'Motivo ficticio'
 and changed_fields = array['conclusion','medical_notes','rejection_reason']
 from audit_events where table_name = 'interviews' and record_id = :'entrevista' and action = 'update'),
 'edición y dictamen conservan antes/después');
select transition_interview(:'entrevista',(select updated_at from interviews where id = :'entrevista'),'completed');
select ok((select old_values->>'status' = 'scheduled' and new_values->>'status' = 'completed'
 from audit_events where table_name = 'interviews' and record_id = :'entrevista' and new_values->>'status' = 'completed'),
 'acción rápida de entrevista queda auditada');
select save_interview(p_candidate_name := 'Otra persona ficticia', p_interview_date := '2026-09-27',
 p_request_id := '95000000-0000-4000-8000-000000000014') as suspendida \gset
select transition_interview(:'suspendida',(select updated_at from interviews where id = :'suspendida'),'cancelled');
select ok((select old_values->>'status' = 'scheduled' and new_values->>'status' = 'cancelled'
 from audit_events where table_name = 'interviews' and record_id = :'suspendida' and action = 'update'),
 'cancelación de entrevista conserva el estado anterior');

select save_shift(null,:'titular','2026-09-26','guardia',null,'09:00',
 p_request_id := '95000000-0000-4000-8000-000000000011') as turno \gset
select ok((select action = 'insert' and old_values is null and new_values->>'guard_start' = '09:00:00'
 and record_label = 'Titular, Ficticia' and actor_id = auth.uid()
 from audit_events where table_name = 'shifts' and record_id = :'turno'),'alta de guardia conserva horario y titular');
select save_shift(null,:'titular','2026-09-26','guardia',null,'09:00',
 p_request_id := '95000000-0000-4000-8000-000000000011');
select is((select count(*) from audit_events where table_name = 'shifts' and record_id = :'turno'),1::bigint,'reintento de turno no duplica evento');
select cover_shift(:'turno',:'reemplazo','Motivo ficticio',null,
 (select updated_at from shifts where id = :'turno'));
select ok((select old_values->>'status' = 'scheduled' and new_values->>'status' = 'absent'
 and new_values->>'absence_reason' = 'Motivo ficticio'
 and new_values->>'covered_by_employee_id' = :'reemplazo'
 and changed_fields = array['absence_reason','covered_by_employee_id','status']
 from audit_events where table_name = 'shifts' and record_id = :'turno' and action = 'update'),
 'ausencia y cobertura conservan antes/después');

select save_shift(null,:'titular','2026-09-27','manana',
 p_request_id := '95000000-0000-4000-8000-000000000012') as cancelable \gset
select cancel_shift(:'cancelable',(select updated_at from shifts where id = :'cancelable'));
select ok((select old_values->>'status' = 'scheduled' and new_values->>'status' = 'cancelled'
 from audit_events where table_name = 'shifts' and record_id = :'cancelable' and action = 'update'),
 'cancelación conserva el estado previo');
reset role;
update shifts set notes = notes where id = :'cancelable';
set local role authenticated;
select is((select count(*) from audit_events where table_name = 'shifts' and record_id = :'cancelable'),2::bigint,
 'cambio de reloj sin datos funcionales no inventa evento');

select set_config('request.jwt.claim.sub','95000000-0000-4000-8000-000000000002',true);
select is((select count(*) from audit_events where table_name in ('shifts','interviews')),0::bigint,
 'Gestión no lee auditoría de personal ni entrevistas');
select set_config('request.jwt.claim.sub','95000000-0000-4000-8000-000000000003',true);
select is((select count(*) from audit_events where table_name in ('shifts','interviews')),0::bigint,
 'Solo lectura tampoco accede');
select set_config('request.jwt.claim.sub','95000000-0000-4000-8000-000000000001',true);
select is((select count(*) from audit_events where table_name = 'shifts' and record_id = :'turno'),2::bigint,
 'Administrador recupera el historial del turno');

reset role;
create function pg_temp.fail_new_interview_audit() returns trigger language plpgsql as $$
begin raise exception 'simulated_interview_audit_failure'; end;$$;
create trigger fail_new_interview_audit before insert on audit_events for each row
when (new.table_name = 'interviews' and new.new_values->>'candidate_name' = 'Revertida')
execute function pg_temp.fail_new_interview_audit();
set local role authenticated;
select throws_ok($$select save_interview(p_candidate_name := 'Revertida', p_interview_date := '2026-09-26',
 p_request_id := '95000000-0000-4000-8000-000000000013')$$,
 'P0001','simulated_interview_audit_failure','fallo de auditoría revierte el alta');
select is((select count(*) from interviews where candidate_name = 'Revertida'),0::bigint,'sin entrevista incompleta');
reset role;
select is((select count(*) from creation_requests where request_id = '95000000-0000-4000-8000-000000000013'),0::bigint,
 'también se revierte la clave de reintento');

select * from finish();
rollback;
