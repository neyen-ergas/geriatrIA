begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id) values ('40000000-0000-4000-8000-000000000099');
insert into residents (id, first_name, last_name, dni, birth_date)
values ('40000000-0000-4000-8000-000000000001', 'Prueba ficticia', 'Anulaciones', 'TEST-ANULACIONES', '1940-01-01');
insert into admissions (id, resident_id, admitted_at, monthly_fee, due_day)
values ('40000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', '2025-01-01', 100, 10);
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$ select void_payment(gen_random_uuid(), 'Motivo') $$,
  '42501', 'authentication_required', 'anular pago exige identidad');
select throws_ok($$ select cancel_monthly_charge(gen_random_uuid(), 'Motivo') $$,
  '42501', 'authentication_required', 'cancelar cuota exige identidad');
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000099', true);
select create_monthly_charge('40000000-0000-4000-8000-000000000002',
  '2025-01-01', '2025-01-10', 100) as cuota \gset
select record_payment(:'cuota', '2025-01-10', 40, 'cash') as pago \gset

select throws_ok(format($$ select void_payment(%L, '  ') $$, :'pago'),
  '22023', 'void_reason_required', 'pago requiere motivo no vacío');
select throws_ok(format($$ select cancel_monthly_charge(%L, '  ') $$, :'cuota'),
  '22023', 'cancellation_reason_required', 'cuota requiere motivo no vacío');
select throws_ok(format($$ select cancel_monthly_charge(%L, 'Error') $$, :'cuota'),
  '23514', 'monthly_charge_has_active_payments', 'cuota con pagos vigentes no se cancela');
select lives_ok(format($$ select void_payment(%L, '  Error de carga  ') $$, :'pago'),
  'anula el pago vigente');
select is((select balance from monthly_charge_balances where id = :'cuota'), 100::numeric,
  'anular pago devuelve su importe al saldo');
select is((select paid_amount from monthly_charge_balances where id = :'cuota'), 0::numeric,
  'pago anulado no cuenta como pagado');
select is((select amount from payments where id = :'pago'), 40::numeric,
  'conserva importe original del pago');
select is((select voided_reason from payments where id = :'pago'), 'Error de carga',
  'persiste el motivo normalizado');
select is((select voided_by from payments where id = :'pago'),
  '40000000-0000-4000-8000-000000000099'::uuid, 'persiste autor de la anulación');
select ok((select voided_at is not null from payments where id = :'pago'), 'persiste momento de anulación');
select throws_ok(format($$ select void_payment(%L, 'Otro motivo') $$, :'pago'),
  'P0002', 'active_payment_not_found', 'no anula dos veces ni sobrescribe el motivo');
select is((select voided_reason from payments where id = :'pago'), 'Error de carga',
  'segundo intento conserva el motivo original');
select lives_ok(format($$ select cancel_monthly_charge(%L, '  Cuota incorrecta  ') $$, :'cuota'),
  'permite cancelar tras anular todos los pagos');
select is((select balance from monthly_charge_balances where id = :'cuota'), 0::numeric,
  'cuota anulada no genera deuda');
select is((select payment_status from monthly_charge_balances where id = :'cuota'), 'cancelled',
  'el estado refleja la anulación');
select is((select cancelled_reason from monthly_charges where id = :'cuota'), 'Cuota incorrecta',
  'conserva motivo de cuota');
select is((select cancelled_by from monthly_charges where id = :'cuota'),
  '40000000-0000-4000-8000-000000000099'::uuid, 'conserva autor de cancelación');
select throws_ok(format($$ select cancel_monthly_charge(%L, 'Otro motivo') $$, :'cuota'),
  'P0002', 'current_monthly_charge_not_found', 'no cancela una cuota dos veces');
select lives_ok($$ select create_monthly_charge('40000000-0000-4000-8000-000000000002',
  '2025-01-01', '2025-01-10', 120) $$, 'permite cuota de reemplazo del mismo período');
select is((select count(*) from monthly_charges where admission_id =
  '40000000-0000-4000-8000-000000000002'), 2::bigint, 'conserva la cuota anulada y el reemplazo');
select is((select count(*) from payments where monthly_charge_id = :'cuota'), 1::bigint,
  'conserva el historial de pagos');
select throws_ok($$ update payments set voided_reason = 'Modificado' $$, '42501', null,
  'no permite sobrescribir pagos directamente');
select throws_ok($$ delete from payments $$, '42501', null, 'no permite borrar pagos');
reset role;
select * from finish();
rollback;
