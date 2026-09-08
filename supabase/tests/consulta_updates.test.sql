begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id) values ('00000000-0000-4000-8000-000000000099');
select set_config('request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000099', true);

insert into public.consulta (
  id, nombre, telefono, estado, visita_fecha, visita_franja
) values
  ('00000000-0000-4000-8000-000000000001', 'Consulta ficticia', '000000', 'nuevo', null, null),
  ('00000000-0000-4000-8000-000000000002', 'Visita ficticia', '000000', 'visita_agendada',
    (now() at time zone 'America/Argentina/Buenos_Aires')::date + 7, 'manana'),
  ('00000000-0000-4000-8000-000000000003', 'Ingreso ficticio', '000000', 'ingreso', null, null),
  ('00000000-0000-4000-8000-000000000004', 'Descarte ficticio', '000000', 'descartada', null, null),
  ('00000000-0000-4000-8000-000000000005', 'Otra consulta ficticia', '000000', 'nuevo', null, null),
  ('00000000-0000-4000-8000-000000000006', 'Visita a cerrar', '000000', 'visita_agendada',
    (now() at time zone 'America/Argentina/Buenos_Aires')::date + 15, 'manana');

create temporary table versiones as
  select id, actualizado_en from public.consulta;
grant select on versiones to service_role;

select ok(not has_function_privilege('anon',
  'public.update_consulta(uuid,timestamptz,text,text,text,date,text,text)', 'execute'),
  'anon no puede ejecutar la función');
select ok(has_function_privilege('authenticated',
  'public.update_consulta(uuid,timestamptz,text,text,text,date,text,text)', 'execute'),
  'authenticated puede ejecutar con identidad verificada');
select ok(has_function_privilege('service_role',
  'public.update_consulta(uuid,timestamptz,text,text,text,date,text,text)', 'execute'),
  'service_role puede ejecutar la función');
select ok(not has_table_privilege('service_role', 'public.consulta', 'update'),
  'service_role no puede eludir la función con UPDATE directo');
select ok(has_table_privilege('service_role', 'public.consulta', 'insert'),
  'la landing conserva INSERT');

set local role service_role;

select lives_ok($$
  insert into public.consulta (nombre, telefono)
  values ('Landing ficticia', '000000')
$$, 'la landing sigue creando consultas');

select throws_ok($$
  update public.consulta set estado = 'ingreso'
  where id = '00000000-0000-4000-8000-000000000001'
$$, '42501', null, 'el UPDATE directo queda bloqueado');

select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000001',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000001'),
    'nuevo', 'change_state', 'ingreso'
  )
$$, '22023', 'invalid_consulta_transition', 'no se salta de nueva a ingreso');

select lives_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000001',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000001'),
    'nuevo', 'change_state', 'contactado'
  )
$$, 'el primer operador marca contactada');

select is((select estado from public.consulta
  where id = '00000000-0000-4000-8000-000000000001'), 'contactado',
  'se persiste el estado confirmado');

select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000001',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000001'),
    'nuevo', 'change_state', 'descartada'
  )
$$, '40001', 'consulta_changed', 'el segundo operador no sobrescribe con la versión anterior');

select lives_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000001',
    (select actualizado_en from public.consulta where id = '00000000-0000-4000-8000-000000000001'),
    'contactado', 'change_state', 'nuevo'
  )
$$, 'se permite reabrir con una versión actual');

select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000001',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000001'),
    'nuevo', 'change_state', 'descartada'
  )
$$, '40001', 'consulta_changed', 'volver al mismo estado no vuelve válida una versión antigua');

select lives_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000002',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000002'),
    'visita_agendada', 'schedule_visit', null,
    (now() at time zone 'America/Argentina/Buenos_Aires')::date + 8, 'tarde'
  )
$$, 'se reprograma una visita vigente');

select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000002',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000002'),
    'visita_agendada', 'cancel_visit'
  )
$$, '40001', 'consulta_changed', 'no se cancela desde una pestaña previa a la reprogramación');

select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000002',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000002'),
    'visita_agendada', 'schedule_visit', null,
    (now() at time zone 'America/Argentina/Buenos_Aires')::date + 9, 'manana'
  )
$$, '40001', 'consulta_changed', 'no se sobrescribe una reprogramación aunque el estado sea el mismo');

select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000005',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000005'),
    'nuevo', 'schedule_visit', null,
    (now() at time zone 'America/Argentina/Buenos_Aires')::date + 8, 'tarde'
  )
$$, '23505', null, 'dos consultas no ocupan la misma franja');

select is((select estado from public.consulta
  where id = '00000000-0000-4000-8000-000000000005'), 'nuevo',
  'el choque de turno no deja cambios parciales');

select lives_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000002',
    (select actualizado_en from public.consulta where id = '00000000-0000-4000-8000-000000000002'),
    'visita_agendada', 'cancel_visit'
  )
$$, 'se cancela la versión vigente');

select ok((select estado = 'contactado' and visita_fecha is null and visita_franja is null
  from public.consulta where id = '00000000-0000-4000-8000-000000000002'),
  'cancelar limpia los datos de la visita y cambia el estado juntos');

select lives_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000005',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000005'),
    'nuevo', 'schedule_visit', null,
    (now() at time zone 'America/Argentina/Buenos_Aires')::date + 8, 'tarde'
  )
$$, 'cancelar libera el turno para otra consulta');

select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000003',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000003'),
    'ingreso', 'cancel_visit'
  )
$$, '22023', 'invalid_consulta_transition', 'cancelar no reabre una consulta cerrada');

select lives_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000006',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000006'),
    'visita_agendada', 'change_state', 'ingreso'
  )
$$, 'un operador cierra la consulta como ingreso');

select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000006',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000006'),
    'visita_agendada', 'cancel_visit'
  )
$$, '40001', 'consulta_changed', 'una pantalla abierta antes del cierre no puede cancelar la visita');

select is((select estado from public.consulta
  where id = '00000000-0000-4000-8000-000000000006'), 'ingreso',
  'el cierre del primer operador se conserva');

select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000004',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000004'),
    'descartada', 'schedule_visit', null,
    (now() at time zone 'America/Argentina/Buenos_Aires')::date + 9, 'manana'
  )
$$, '22023', 'invalid_consulta_transition', 'agendar no reabre una consulta descartada');

select lives_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000004',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000004'),
    'descartada', 'save_notes', p_notes := ' Nota ficticia '
  )
$$, 'se pueden guardar notas en consultas cerradas');

select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000004',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000004'),
    'descartada', 'save_notes', p_notes := 'Nota vieja'
  )
$$, '40001', 'consulta_changed', 'las notas también rechazan una versión vieja');

select is((select notas_internas from public.consulta
  where id = '00000000-0000-4000-8000-000000000004'), 'Nota ficticia',
  'se conserva la nota del primer operador');

select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-999999999999', now(), 'nuevo', 'change_state', 'contactado'
  )
$$, 'P0002', 'consulta_not_found', 'una consulta inexistente no devuelve éxito');

select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000001', null, 'nuevo', 'change_state', 'contactado'
  )
$$, '40001', 'consulta_changed', 'omitir la versión no elude el control');

select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000001',
    (select actualizado_en from public.consulta where id = '00000000-0000-4000-8000-000000000001'),
    'nuevo', 'schedule_visit', null,
    (now() at time zone 'America/Argentina/Buenos_Aires')::date - 1, 'manana'
  )
$$, '22023', 'invalid_consulta_visit', 'la base también rechaza visitas pasadas');

reset role;
select is((select count(*) from public.visit_events), 4::bigint,
  'solo las cuatro operaciones de agenda confirmadas generan eventos');
select ok((select bool_and(actor_id = '00000000-0000-4000-8000-000000000099')
  from public.visit_events), 'el autor es la identidad del JWT');
select ok((select previous_date = (now() at time zone 'America/Argentina/Buenos_Aires')::date + 7
  and previous_slot = 'manana'
  and new_date = (now() at time zone 'America/Argentina/Buenos_Aires')::date + 8
  and new_slot = 'tarde' from public.visit_events where action = 'rescheduled'),
  'reprogramar conserva la fecha y franja anterior y nueva');
select ok((select previous_slot = 'tarde' and new_date is null
  and new_slot is null from public.visit_events where action = 'cancelled'),
  'cancelar conserva el turno anterior aunque la consulta lo borre');
select ok((select previous_state = 'visita_agendada' and new_state = 'ingreso'
  from public.visit_events where action = 'closed'),
  'cerrar registra también la liberación del turno');
select ok((select bool_and(occurred_at is not null) from public.visit_events),
  'cada evento tiene momento de ocurrencia');
select ok(not has_table_privilege('authenticated', 'public.visit_events', 'insert')
  and not has_table_privilege('authenticated', 'public.visit_events', 'update')
  and not has_table_privilege('authenticated', 'public.visit_events', 'delete')
  and not has_table_privilege('service_role', 'public.visit_events', 'insert'),
  'el historial no admite escrituras directas');

set local role authenticated;
select is((select count(*) from public.visit_events), 4::bigint,
  'el dueño autenticado puede consultar el historial');
reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role authenticated;
select is((select count(*) from public.visit_events), 0::bigint,
  'RLS no muestra eventos sin identidad');
select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000001', now(), 'nuevo', 'save_notes'
  )
$$, '42501', 'authentication_required', 'la función exige identidad en la base');
reset role;
select set_config('request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000099', true);

-- Si no puede conservarse el evento, tampoco se confirma la reprogramación.
create function pg_temp.rechazar_evento() returns trigger language plpgsql as $$
begin
  raise exception 'evento_fallido';
end;
$$;
create trigger rechazar_evento before insert on public.visit_events
for each row execute function pg_temp.rechazar_evento();
select throws_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000001',
    (select actualizado_en from public.consulta where id = '00000000-0000-4000-8000-000000000001'),
    'nuevo', 'schedule_visit', null,
    (now() at time zone 'America/Argentina/Buenos_Aires')::date + 20, 'manana'
  )
$$, 'P0001', 'evento_fallido', 'un fallo al guardar el evento rechaza la operación');
select is((select estado from public.consulta
  where id = '00000000-0000-4000-8000-000000000001'), 'nuevo',
  'el fallo del evento revierte el cambio de consulta');
select is((select count(*) from public.visit_events), 4::bigint,
  'el fallo tampoco deja eventos parciales');
drop trigger rechazar_evento on public.visit_events;
update versiones set actualizado_en = c.actualizado_en
from public.consulta c where versiones.id = c.id;
grant select on versiones to authenticated;
set local role authenticated;
select lives_ok($$
  select public.update_consulta(
    '00000000-0000-4000-8000-000000000001',
    (select actualizado_en from versiones where id = '00000000-0000-4000-8000-000000000001'),
    'nuevo', 'schedule_visit', null,
    (now() at time zone 'America/Argentina/Buenos_Aires')::date + 20, 'manana'
  )
$$, 'el cliente autenticado agenda sin permisos directos sobre consulta');
select is((select count(*) from public.visit_events), 5::bigint,
  'el agendado autenticado conserva su evento');
reset role;
select ok(not has_table_privilege('anon', 'public.visit_events', 'select'),
  'el historial no es público');
select * from finish();
rollback;
