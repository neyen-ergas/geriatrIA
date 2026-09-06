begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- Fuerza el control diferido dentro del subbloque que pgTAP puede revertir.
create function pg_temp.comprobar(p_sql text)
returns void language plpgsql as $$
begin
  execute p_sql;
  set constraints all immediate;
  set constraints all deferred;
end;
$$;

insert into residents (id, first_name, last_name, dni, birth_date) values
  ('10000000-0000-4000-8000-000000000001', 'Persona ficticia', 'Uno', 'TEST-FECHAS-1', '1940-01-01'),
  ('10000000-0000-4000-8000-000000000002', 'Persona ficticia', 'Dos', 'TEST-FECHAS-2', '1940-01-01');
insert into family_contacts (id, resident_id, first_name, last_name, relationship, phone)
values ('10000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001',
  'Contacto ficticio', 'Uno', 'Familiar', '000000');
insert into admissions (id, resident_id, admitted_at, discharged_at, monthly_fee, due_day)
values ('10000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000001',
  '2026-01-01', '2026-02-01', 100, 10);
set constraints all immediate;
set constraints all deferred;

select ok(not has_function_privilege('authenticated',
  'public.serialize_resident_stays()', 'execute'), 'no se expone el bloqueo interno');
select ok(not has_function_privilege('anon',
  'public.validate_resident_stays()', 'execute'), 'anon no invoca el validador');
select ok(not has_table_privilege('authenticated', 'public.admissions', 'delete'),
  'se conserva la prohibición de borrar estadías');
select ok((select bool_and(relrowsecurity) from pg_class
  where oid in ('public.residents'::regclass, 'public.admissions'::regclass,
    'public.family_contacts'::regclass)), 'RLS continúa activada');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000099', true);

select throws_ok($$select pg_temp.comprobar($q$
  insert into admissions (resident_id, admitted_at, monthly_fee, due_day)
  values ('10000000-0000-4000-8000-000000000002', '1939-12-31', 100, 10)
$q$)$$, '23514', 'admissions_birth_date_valid', 'rechaza ingreso anterior al nacimiento');
select throws_ok($$select pg_temp.comprobar($q$
  insert into admissions (resident_id, admitted_at, monthly_fee, due_day)
  values ('10000000-0000-4000-8000-000000000002',
    (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date + 1, 100, 10)
$q$)$$, '23514', null, 'rechaza ingreso futuro por escritura directa');
select throws_ok($$select pg_temp.comprobar($q$
  update residents set birth_date = 'infinity'
  where id = '10000000-0000-4000-8000-000000000002'
$q$)$$, '23514', null, 'rechaza nacimiento infinito');
select throws_ok($$select pg_temp.comprobar($q$
  update residents set birth_date = current_date + 2
  where id = '10000000-0000-4000-8000-000000000002'
$q$)$$, '23514', null, 'rechaza nacimiento futuro');
select throws_ok($$select pg_temp.comprobar($q$
  update residents set birth_date = '2026-01-02'
  where id = '10000000-0000-4000-8000-000000000001'
$q$)$$, '23514', 'admissions_birth_date_valid', 'nacimiento respeta estadías históricas');

select throws_ok($$select pg_temp.comprobar($q$
  insert into admissions (resident_id, admitted_at, discharged_at, monthly_fee, due_day)
  values ('10000000-0000-4000-8000-000000000001', '2026-01-15', '2026-02-15', 100, 10)
$q$)$$, '23P01', 'admissions_stays_overlap', 'rechaza superposición parcial');
select throws_ok($$select pg_temp.comprobar($q$
  insert into admissions (resident_id, admitted_at, discharged_at, monthly_fee, due_day)
  values ('10000000-0000-4000-8000-000000000001', '2025-12-01', '2026-03-01', 100, 10)
$q$)$$, '23P01', 'admissions_stays_overlap', 'rechaza una estadía que contiene a otra');
select throws_ok($$select pg_temp.comprobar($q$
  insert into admissions (resident_id, admitted_at, discharged_at, monthly_fee, due_day)
  values ('10000000-0000-4000-8000-000000000001', '2026-01-15', '2026-01-15', 100, 10)
$q$)$$, '23P01', 'admissions_stays_overlap', 'duración cero dentro de otra también se rechaza');
select lives_ok($$select pg_temp.comprobar($q$
  insert into admissions (resident_id, admitted_at, discharged_at, monthly_fee, due_day)
  values ('10000000-0000-4000-8000-000000000001', '2026-02-01', '2026-02-01', 100, 10),
    ('10000000-0000-4000-8000-000000000001', '2026-02-01', '2026-02-01', 100, 10),
    ('10000000-0000-4000-8000-000000000001', '2026-01-01', '2026-01-01', 100, 10)
$q$)$$, 'acepta estadías de duración cero en extremos, incluso sucesivas');
select lives_ok($$select pg_temp.comprobar($q$
  insert into admissions (id, resident_id, admitted_at, monthly_fee, due_day)
  values ('10000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000001',
    '2026-02-01', 100, 10)
$q$)$$, 'acepta reingreso el mismo día de la baja');
select throws_ok($$select pg_temp.comprobar($q$
  update admissions set admitted_at = '2026-01-31'
  where id = '10000000-0000-4000-8000-000000000012'
$q$)$$, '23P01', 'admissions_stays_overlap', 'editar ingreso activo no invade la estadía anterior');
select throws_ok($$select pg_temp.comprobar($q$
  update admissions set discharged_at = current_date + 2
  where id = '10000000-0000-4000-8000-000000000012'
$q$)$$, '23514', null, 'rechaza baja futura');
select throws_ok($$select pg_temp.comprobar($q$
  update admissions set discharged_at = '2026-01-31'
  where id = '10000000-0000-4000-8000-000000000012'
$q$)$$, '23514', null, 'rechaza baja anterior al ingreso');
select throws_ok($$select pg_temp.comprobar($q$
  update admissions set discharged_at = '2026-02-02'
  where id = '10000000-0000-4000-8000-000000000011'
$q$)$$, '23P01', 'admissions_stays_overlap', 'editar baja histórica no invade el reingreso');
select throws_ok($$select pg_temp.comprobar($q$
  insert into admissions (resident_id, admitted_at, monthly_fee, due_day)
  values ('10000000-0000-4000-8000-000000000001', '2026-03-01', 100, 10)
$q$)$$, '23505', null, 'conserva un solo ingreso abierto por persona');

-- La función de edición conserva atomicidad al fallar la comprobación diferida.
select throws_ok($$select pg_temp.comprobar($q$
  select update_active_admission(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000012',
    'Nombre cambiado', 'Uno', 'TEST-FECHAS-1', '1940-01-01',
    'Contacto cambiado', 'Uno', 'Familiar', '000000', true, true,
    '2026-01-15', 200, 10)
$q$)$$, '23P01', 'admissions_stays_overlap', 'RPC de edición rechaza historia superpuesta');
select is((select first_name from residents where dni = 'TEST-FECHAS-1'),
  'Persona ficticia', 'la edición fallida revierte la persona');
select is((select first_name from family_contacts
  where id = '10000000-0000-4000-8000-000000000010'),
  'Contacto ficticio', 'la edición fallida revierte el contacto');
select is((select monthly_fee from admissions
  where id = '10000000-0000-4000-8000-000000000012'), 100::numeric,
  'la edición fallida revierte la cuota');

select throws_ok($$select pg_temp.comprobar($q$
  select create_initial_admission('Alta ficticia', 'Tres', 'TEST-FECHAS-3',
    '1940-01-01', 'Contacto ficticio', 'Tres', 'Familiar', '000000', true, true,
    '1939-12-31', 100, 10)
$q$)$$, '23514', 'admissions_birth_date_valid', 'RPC de alta valida nacimiento');
select is((select count(*) from residents where dni = 'TEST-FECHAS-3'),
  0::bigint, 'el alta fallida no deja una persona parcial');
select is((select count(*) from family_contacts where last_name = 'Tres'),
  0::bigint, 'el alta fallida no deja un contacto parcial');

select lives_ok($$select pg_temp.comprobar($q$
  insert into admissions (resident_id, admitted_at, discharged_at, monthly_fee, due_day)
  values ('10000000-0000-4000-8000-000000000002', '1940-01-01', '1940-01-01', 100, 10)
$q$)$$, 'acepta ingreso y baja el día del nacimiento');
select lives_ok($$select pg_temp.comprobar($q$
  update residents set birth_date = '1941-01-01'
  where id = '10000000-0000-4000-8000-000000000002';
  update admissions set admitted_at = '1941-01-01', discharged_at = '1941-01-01'
  where resident_id = '10000000-0000-4000-8000-000000000002'
$q$)$$, 'valida nacimiento e ingreso contra el estado final de la transacción');

set constraints all immediate;
select throws_ok($$
  insert into admissions (resident_id, admitted_at, discharged_at, monthly_fee, due_day)
  values ('10000000-0000-4000-8000-000000000001', '2026-01-15', '2026-01-15', 100, 10)
$$, '23P01', 'admissions_stays_overlap', 'SET CONSTRAINTS IMMEDIATE no permite eludir el control');
set constraints all deferred;

select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$
  insert into admissions (resident_id, admitted_at, monthly_fee, due_day)
  values ('10000000-0000-4000-8000-000000000002', '2026-03-01', 100, 10)
$$, '42501', null, 'sin sesión RLS rechaza la escritura');
reset role;
select * from finish();
rollback;
