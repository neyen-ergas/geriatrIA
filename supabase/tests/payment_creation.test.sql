begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id) values ('30000000-0000-4000-8000-000000000099');
insert into residents (id, first_name, last_name, dni, birth_date)
values ('30000000-0000-4000-8000-000000000001', 'Prueba ficticia', 'Pagos', 'TEST-PAGOS', '1940-01-01');
insert into admissions (id, resident_id, admitted_at, discharged_at, monthly_fee, due_day)
values ('30000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001',
  '2025-01-15', '2025-03-04', 100, 31);

set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$ select create_monthly_charge(
  '30000000-0000-4000-8000-000000000002', '2025-02-01', '2025-02-28', 100)
$$, '42501', 'authentication_required', 'crear cuota exige identidad');
select throws_ok($$ select record_payment(gen_random_uuid(), '2025-02-01', 10, 'cash')
$$, '42501', 'authentication_required', 'registrar pago exige identidad');
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000099', true);

select lives_ok($$ select create_monthly_charge(
  '30000000-0000-4000-8000-000000000002', '2025-02-01', '2025-02-28', 100)
$$, 'permite crear cuota histórica de estadía finalizada');
select is((select created_by from monthly_charges where admission_id =
  '30000000-0000-4000-8000-000000000002'),
  '30000000-0000-4000-8000-000000000099'::uuid, 'registra el autor de la cuota');
select throws_ok($$ select create_monthly_charge(
  '30000000-0000-4000-8000-000000000002', '2025-02-01', '2025-02-28', 100)
$$, '23505', null, 'rechaza duplicar estadía y mes');
select throws_ok($$ select create_monthly_charge(
  '30000000-0000-4000-8000-000000000002', '2025-04-01', '2025-04-10', 100)
$$, '23514', 'period_outside_admission', 'rechaza mes posterior a baja');
select throws_ok($$ select create_monthly_charge(
  '30000000-0000-4000-8000-000000000002', '2024-12-01', '2024-12-10', 100)
$$, '23514', 'period_outside_admission', 'rechaza mes anterior al ingreso');
select throws_ok($$ select create_monthly_charge(
  '30000000-0000-4000-8000-000000000002', '2025-01-01', '2025-02-01', 100)
$$, '22023', 'due_date_outside_period', 'vencimiento debe estar dentro del período');
select throws_ok($$ select create_monthly_charge(
  '30000000-0000-4000-8000-000000000002', '2025-01-01', '2025-01-31', 0)
$$, '22023', 'invalid_amount_due', 'rechaza importe cero');
select throws_ok($$ select create_monthly_charge(
  '30000000-0000-4000-8000-000000000002', '2025-01-01', '2025-01-31', 10000000000)
$$, '22023', 'invalid_amount_due', 'rechaza importe fuera de rango');

select id as cuota from monthly_charges where admission_id =
  '30000000-0000-4000-8000-000000000002' \gset
select lives_ok(format($$ select record_payment(%L, '2025-02-10', 40, 'cash') $$, :'cuota'),
  'registra pago parcial');
select is((select balance from monthly_charge_balances where id = :'cuota'), 60::numeric,
  'saldo descuenta pago parcial');
select is((select payment_status from monthly_charge_balances where id = :'cuota'), 'partial',
  'cuota queda parcial');
select is((select is_overdue from monthly_charge_balances where id = :'cuota'), true,
  'la cuota histórica con saldo también está vencida');
select throws_ok(format($$ select record_payment(%L, '2025-02-10', 60.01, 'cash') $$, :'cuota'),
  '23514', 'payment_exceeds_balance', 'rechaza exceso de saldo');
select throws_ok(format($$ select record_payment(%L, current_date + 2, 1, 'cash') $$, :'cuota'),
  '22023', 'invalid_payment_date', 'rechaza pago futuro');
select throws_ok(format($$ select record_payment(%L, '2025-02-10', 1, 'inventado') $$, :'cuota'),
  '22023', 'invalid_payment_method', 'rechaza medio inválido');
select is((select count(*) from payments where monthly_charge_id = :'cuota'), 1::bigint,
  'rechazos no agregan movimientos');
select lives_ok(format($$ select record_payment(%L, '2025-02-11', 60, 'bank_transfer', 'TEST') $$, :'cuota'),
  'segundo pago completa el saldo');
select is((select balance from monthly_charge_balances where id = :'cuota'), 0::numeric,
  'saldo final cero');
select is((select payment_status from monthly_charge_balances where id = :'cuota'), 'paid',
  'cuota pagada');
select is((select is_overdue from monthly_charge_balances where id = :'cuota'), false,
  'pagada no está vencida');
select ok((select bool_and(created_by = '30000000-0000-4000-8000-000000000099')
  from payments where monthly_charge_id = :'cuota'), 'pagos guardan autor de la sesión');

select lives_ok($$ select create_monthly_charge(
  '30000000-0000-4000-8000-000000000002', '2025-03-01', '2025-03-31', 100)
$$, 'permite cuota del mes de baja');
select id as anulada from monthly_charges where period = '2025-03-01' and admission_id =
  '30000000-0000-4000-8000-000000000002' \gset
select cancel_monthly_charge(:'anulada', 'Prueba ficticia') as descartado \gset
select throws_ok(format($$ select record_payment(%L, '2025-03-10', 1, 'cash') $$, :'anulada'),
  '23514', 'monthly_charge_cancelled', 'rechaza pagos sobre cuota anulada');
select throws_ok(format($$ insert into payments (monthly_charge_id, paid_on, amount, payment_method)
  values (%L, '2025-02-10', 1, 'cash') $$, :'cuota'), '42501', null,
  'no permite insertar pagos salteando la función');
select throws_ok($$ update monthly_charges set amount_due = 1 $$, '42501', null,
  'no permite cambiar cuotas directamente');
select set_config('request.jwt.claim.sub', '', true);
select is((select count(*) from monthly_charge_balances), 0::bigint,
  'la vista no revela cuotas sin identidad');
reset role;
select * from finish();
rollback;
