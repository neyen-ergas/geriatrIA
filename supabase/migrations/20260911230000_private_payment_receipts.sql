begin;

-- Comprobantes privados; ver docs/comprobantes-privados.md.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-receipts', 'payment-receipts', false, 3145728,
  array['image/jpeg', 'image/png', 'application/pdf']);

-- Cada carga usa usuario/estadía/cuota/archivo. No se permite sobrescribir ni
-- borrar: un comprobante sigue formando parte del historial tras una anulación.
create policy "Upload own payment receipts"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-receipts'
  and (select auth.uid()) is not null
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and array_length(storage.foldername(name), 1) = 3
  and storage.extension(name) in ('jpg', 'png', 'pdf')
  and exists (
    select 1 from public.monthly_charges c
    where c.id::text = (storage.foldername(name))[3]
      and c.admission_id::text = (storage.foldername(name))[2]
      and c.cancelled_at is null
  )
);

create policy "Read own uploads or recorded receipts"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-receipts'
  and (select auth.uid()) is not null
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.payments p where p.receipt_path = name)
  )
);

-- La comprobación ocurre dentro de record_payment: no se vinculan rutas
-- inexistentes, de otra cuota o cargadas por otra persona.
create unique index payments_receipt_path_unique
on public.payments (receipt_path) where receipt_path is not null;

create function public.validate_payment_receipt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admission_id uuid;
begin
  if new.receipt_path is null then return new; end if;
  select admission_id into v_admission_id from public.monthly_charges
  where id = new.monthly_charge_id;
  if auth.uid() is null
    or (storage.foldername(new.receipt_path))[1] is distinct from auth.uid()::text
    or (storage.foldername(new.receipt_path))[2] is distinct from v_admission_id::text
    or (storage.foldername(new.receipt_path))[3] is distinct from new.monthly_charge_id::text
    or array_length(storage.foldername(new.receipt_path), 1) is distinct from 3
    or not exists (
      select 1 from storage.objects o
      where o.bucket_id = 'payment-receipts' and o.name = new.receipt_path
    ) then
    raise exception 'invalid_payment_receipt' using errcode = '22023';
  end if;
  if exists (select 1 from public.payments p where p.receipt_path = new.receipt_path) then
    raise exception 'payment_receipt_already_used' using errcode = '22023';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_payment_receipt() from public, anon, authenticated;
create trigger payments_validate_receipt
before insert on public.payments
for each row execute function public.validate_payment_receipt();

commit;
