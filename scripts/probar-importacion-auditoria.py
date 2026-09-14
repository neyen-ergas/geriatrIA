"""Regresión de migración sobre historia previa sintética. Solo CI aislado.

DDL, fixtures y nueva aplicación de la migración se revierten juntos.
"""
import os
from pathlib import Path
import runpy

if os.environ.get("CI") != "true":
    raise SystemExit("Esta prueba se ejecuta únicamente en la base aislada de CI.")

ejecutar = runpy.run_path(str(Path(__file__).with_name("probar-concurrencia-estadias.py")))["ejecutar"]
migracion = (Path(__file__).resolve().parents[1] / "supabase/migrations/20260914020000_operational_audit.sql").read_text(encoding="utf-8")
cuerpo = migracion.partition("begin;")[2].rsplit("commit;", 1)[0]
assert cuerpo and "create table public.audit_events" in cuerpo

preparar = r"""
begin;
drop function public.capture_operational_audit() cascade;
drop table public.audit_events;
insert into auth.users(id,email) values
 ('85000000-0000-4000-8000-000000000001','historia@example.invalid'),
 ('85000000-0000-4000-8000-000000000002','cuenta@example.invalid');
insert into public.user_access(user_id,role) values ('85000000-0000-4000-8000-000000000001','admin');
set local role authenticated;
select set_config('request.jwt.claim.sub','85000000-0000-4000-8000-000000000001',true) \gset
select public.set_user_access('85000000-0000-4000-8000-000000000002','management',true,null);
select public.save_employee(null,null,'Empleado ficticio','Importado','TEST-AUD-IMPORT','Cuidador','2025-01-01') as empleado \gset
select public.save_employee(:'empleado',(select updated_at from public.employees where id = :'empleado'),
 'Empleado ficticio','Importado','TEST-AUD-IMPORT','Administrativo','2025-01-01');
select public.set_employee_account('85000000-0000-4000-8000-000000000002',
 (select updated_at from public.user_access where user_id = '85000000-0000-4000-8000-000000000002'),:'empleado');
insert into public.residents(id,first_name,last_name,dni,birth_date) values
 ('85000000-0000-4000-8000-000000000010','Persona ficticia','Importada','TEST-AUD-IMPORT','1940-01-01');
insert into public.admissions(id,resident_id,admitted_at,monthly_fee,due_day) values
 ('85000000-0000-4000-8000-000000000011','85000000-0000-4000-8000-000000000010','2025-01-01',100,10);
select public.create_monthly_charge('85000000-0000-4000-8000-000000000011','2025-01-01','2025-01-10',100) as cuota \gset
select public.record_payment(:'cuota','2025-01-05',25,'cash') as pago \gset
select public.void_payment(:'pago','Motivo anterior de pago');
select public.cancel_monthly_charge(:'cuota','Motivo anterior de cuota');
reset role;
insert into public.consulta(id,nombre,telefono,estado) values
 ('85000000-0000-4000-8000-000000000020','Familia ficticia','0000000','ingreso');
insert into public.visit_events(consultation_id,action,actor_id,previous_date,previous_slot,previous_state,new_state)
 values ('85000000-0000-4000-8000-000000000020','closed','85000000-0000-4000-8000-000000000001','2025-01-01','manana','visita_agendada','ingreso');
insert into public.consultation_admissions(consultation_id,admission_id,converted_by) values
 ('85000000-0000-4000-8000-000000000020','85000000-0000-4000-8000-000000000011','85000000-0000-4000-8000-000000000001');
"""

comprobar = r"""
do $$ begin
 if (select count(*) from public.audit_events where actor_id = '85000000-0000-4000-8000-000000000001' and origin = 'historical') <> 10 then
   raise exception 'Debe importar exactamente diez hechos existentes'; end if;
 if exists (select 1 from public.audit_events where table_name = 'residents' and record_id = '85000000-0000-4000-8000-000000000010') then
   raise exception 'No debe inventar un alta histórica de residente'; end if;
 if (select count(*) from public.audit_events where actor_id = '85000000-0000-4000-8000-000000000001'
   and source_key like 'payment-created:%' and new_values = '{}'::jsonb and old_values is null and changed_fields = array[]::text[]) <> 1 then
   raise exception 'No debe convertir el pago actual en un snapshot del pasado'; end if;
 if (select count(*) from public.audit_events where actor_id = '85000000-0000-4000-8000-000000000001'
   and source_key like 'payment-voided:%' and new_values->>'voided_reason' = 'Motivo anterior de pago') <> 1 then
   raise exception 'Debe conservar el motivo verificable'; end if;
 if exists (select 1 from public.audit_events where actor_id = '85000000-0000-4000-8000-000000000001'
   and (actor_label is distinct from 'historia@example.invalid' or record_label is null or source_key is null)) then
   raise exception 'Debe importar referencias y procedencia de cada hecho'; end if;
 if (select count(*) from public.audit_events where actor_id = '85000000-0000-4000-8000-000000000001'
   and source_key like 'visit:%' and new_values->'visita_fecha' = 'null'::jsonb and old_values->>'visita_fecha' = '2025-01-01') <> 1 then
   raise exception 'Debe distinguir vacío confirmado de fecha anterior'; end if;
end; $$;
set local role authenticated;
update public.residents set notes = 'Cambio posterior' where id = '85000000-0000-4000-8000-000000000010';
do $$ begin
 if (select count(*) from public.audit_events where table_name = 'residents' and record_id = '85000000-0000-4000-8000-000000000010'
   and origin = 'live' and old_values->'notes' = 'null'::jsonb and new_values->>'notes' = 'Cambio posterior') <> 1 then
   raise exception 'Debe capturar cambios posteriores a la importación'; end if;
end; $$;
rollback;
"""
ejecutar(preparar + cuerpo + comprobar)
print("OK: diez hechos históricos importados, valores desconocidos conservados y captura posterior activa; rollback completo")
