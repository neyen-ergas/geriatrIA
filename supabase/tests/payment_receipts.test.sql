begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select is((select public from storage.buckets where id = 'payment-receipts'), false,
  'el bucket es privado');
select is((select file_size_limit from storage.buckets where id = 'payment-receipts'),
  3145728::bigint, 'limita comprobantes a 3 MiB');
insert into auth.users (id) values
  ('50000000-0000-4000-8000-000000000098'), ('50000000-0000-4000-8000-000000000099');
insert into residents (id, first_name, last_name, dni, birth_date) values
  ('50000000-0000-4000-8000-000000000001', 'Prueba ficticia', 'Adjuntos', 'TEST-ADJUNTOS', '1940-01-01');
insert into admissions (id, resident_id, admitted_at, monthly_fee, due_day) values
  ('50000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000001', '2025-01-01', 100, 10);
set local role authenticated;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000099', true);
select create_monthly_charge('50000000-0000-4000-8000-000000000002',
  '2025-01-01', '2025-01-10', 100) as cuota \gset
select create_monthly_charge('50000000-0000-4000-8000-000000000002',
  '2025-02-01', '2025-02-10', 100) as otra_cuota \gset
select '50000000-0000-4000-8000-000000000099/50000000-0000-4000-8000-000000000002/'
  || :'cuota' || '/50000000-0000-4000-8000-000000000003.pdf' as ruta \gset

select lives_ok(format($$ insert into storage.objects (bucket_id, name)
  values ('payment-receipts', %L) $$, :'ruta'), 'permite subir a cuota propia');
select throws_ok(format($$ insert into storage.objects (bucket_id, name)
  values ('payment-receipts', %L) $$, replace(:'ruta', '000000000099/', '000000000098/')),
  '42501', null, 'rechaza subir en carpeta de otro usuario');
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('payment-receipts', '50000000-0000-4000-8000-000000000099/invalida/invalida/archivo.pdf') $$,
  '42501', null, 'rechaza carpeta sin cuota existente');
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000098', true);
select is((select count(*) from storage.objects where name = :'ruta'), 0::bigint,
  'otro usuario no ve un archivo sin vincular');
select throws_ok(format($$ select record_payment(%L, '2025-01-01', 10, 'cash', null, %L) $$,
  :'cuota', :'ruta'), '22023', 'invalid_payment_receipt', 'otro usuario no vincula una carga ajena');
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000099', true);
select throws_ok(format($$ select record_payment(%L, '2025-01-01', 10, 'cash', null, %L) $$,
  :'otra_cuota', :'ruta'), '22023', 'invalid_payment_receipt', 'no vincula comprobante de otra cuota');
select throws_ok(format($$ select record_payment(%L, '2025-01-01', 10, 'cash', null, %L) $$,
  :'cuota', replace(:'ruta', '.pdf', '-ausente.pdf')), '22023', 'invalid_payment_receipt',
  'rechaza comprobante inexistente');
select is((select count(*) from payments where monthly_charge_id = :'cuota'), 0::bigint,
  'rechazos no registran pagos parciales');
select record_payment(:'cuota', '2025-01-01', 40, 'cash', null, :'ruta') as pago \gset
select is((select receipt_path from payments where id = :'pago'), :'ruta', 'vincula archivo y pago');
select throws_ok(format($$ select record_payment(%L, '2025-01-01', 10, 'cash', null, %L) $$,
  :'cuota', :'ruta'), '22023', 'payment_receipt_already_used', 'no reutiliza un comprobante en dos pagos');
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000098', true);
select is((select count(*) from storage.objects where name = :'ruta'), 1::bigint,
  'un usuario autenticado puede leer el comprobante registrado');
select void_payment(:'pago', 'Prueba ficticia') as anulado \gset
select is((select count(*) from storage.objects where name = :'ruta'), 1::bigint,
  'se conserva el comprobante después de anular');
with cambio as (
  update storage.objects set name = name || '.nuevo' where name = :'ruta' returning id
)
select is(count(*), 0::bigint, 'no permite sobrescribir comprobantes') from cambio;
select set_config('request.jwt.claim.sub', '', true);
select is((select count(*) from storage.objects where bucket_id = 'payment-receipts'), 0::bigint,
  'sin identidad no se leen comprobantes');
reset role;
select * from finish();
rollback;
