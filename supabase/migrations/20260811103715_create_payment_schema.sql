begin;

-- Una cuota representa la obligación mensual de una estadía. Su importe queda
-- congelado para que los cambios futuros en admissions.monthly_fee no alteren
-- períodos históricos.
create table public.monthly_charges (
  id uuid primary key default gen_random_uuid(),
  admission_id uuid not null
    references public.admissions (id) on delete restrict,
  period date not null,
  due_date date not null,
  amount_due numeric(12, 2) not null,
  currency text not null default 'ARS',
  notes text,
  created_by uuid not null default auth.uid()
    references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancelled_reason text,
  cancelled_by uuid
    references auth.users (id) on delete restrict,

  constraint monthly_charges_period_first_day
    check (extract(day from period) = 1),
  constraint monthly_charges_due_date_in_period
    check (
      due_date >= period
      and due_date < (period + interval '1 month')::date
    ),
  constraint monthly_charges_amount_positive
    check (amount_due > 0),
  constraint monthly_charges_currency_iso_format
    check (currency ~ '^[A-Z]{3}$'),
  constraint monthly_charges_notes_not_blank
    check (notes is null or btrim(notes) <> ''),
  constraint monthly_charges_cancellation_consistent
    check (
      (
        cancelled_at is null
        and cancelled_reason is null
        and cancelled_by is null
      )
      or
      (
        cancelled_at is not null
        and cancelled_reason is not null
        and btrim(cancelled_reason) <> ''
        and cancelled_by is not null
      )
    )
);

-- Una cuota anulada puede reemplazarse por otra del mismo período, pero nunca
-- pueden coexistir dos cuotas vigentes para una misma estadía y mes.
create unique index monthly_charges_one_current_period_idx
  on public.monthly_charges (admission_id, period)
  where cancelled_at is null;

create index monthly_charges_admission_id_idx
  on public.monthly_charges (admission_id);

create index monthly_charges_current_due_date_idx
  on public.monthly_charges (due_date)
  where cancelled_at is null;

-- Cada pago es un movimiento independiente. Los errores se corrigen mediante
-- anulación para conservar la trazabilidad; la aplicación no elimina filas.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  monthly_charge_id uuid not null
    references public.monthly_charges (id) on delete restrict,
  paid_on date not null,
  amount numeric(12, 2) not null,
  payment_method text not null,
  reference text,
  receipt_path text,
  notes text,
  created_by uuid not null default auth.uid()
    references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_reason text,
  voided_by uuid
    references auth.users (id) on delete restrict,

  constraint payments_amount_positive
    check (amount > 0),
  constraint payments_method_valid
    check (
      payment_method in (
        'cash',
        'bank_transfer',
        'debit_card',
        'credit_card',
        'other'
      )
    ),
  constraint payments_reference_not_blank
    check (reference is null or btrim(reference) <> ''),
  constraint payments_receipt_path_not_blank
    check (receipt_path is null or btrim(receipt_path) <> ''),
  constraint payments_notes_not_blank
    check (notes is null or btrim(notes) <> ''),
  constraint payments_void_consistent
    check (
      (
        voided_at is null
        and voided_reason is null
        and voided_by is null
      )
      or
      (
        voided_at is not null
        and voided_reason is not null
        and btrim(voided_reason) <> ''
        and voided_by is not null
      )
    )
);

create index payments_monthly_charge_id_idx
  on public.payments (monthly_charge_id);

create index payments_paid_on_idx
  on public.payments (paid_on);

-- Las escrituras financieras pasan por funciones controladas. SECURITY DEFINER
-- permite retirar INSERT/UPDATE de las tablas, mientras las comprobaciones de
-- auth.uid() impiden que las funciones se usen sin una sesión autenticada.
create or replace function public.create_monthly_charge(
  p_admission_id uuid,
  p_period date,
  p_due_date date,
  p_amount_due numeric,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_admission public.admissions%rowtype;
  v_period_end date;
  v_charge_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if p_period is null or extract(day from p_period) <> 1 then
    raise exception 'period_must_be_first_day' using errcode = '22023';
  end if;

  v_period_end := (p_period + interval '1 month - 1 day')::date;

  if p_due_date is null
    or p_due_date < p_period
    or p_due_date > v_period_end then
    raise exception 'due_date_outside_period' using errcode = '22023';
  end if;

  if p_amount_due is null
    or p_amount_due <= 0
    or p_amount_due > 9999999999.99 then
    raise exception 'invalid_amount_due' using errcode = '22023';
  end if;

  select *
  into v_admission
  from public.admissions
  where id = p_admission_id;

  if not found then
    raise exception 'admission_not_found' using errcode = 'P0002';
  end if;

  if v_period_end < v_admission.admitted_at
    or (
      v_admission.discharged_at is not null
      and p_period > v_admission.discharged_at
    ) then
    raise exception 'period_outside_admission' using errcode = '23514';
  end if;

  insert into public.monthly_charges (
    admission_id,
    period,
    due_date,
    amount_due,
    currency,
    notes,
    created_by
  )
  values (
    p_admission_id,
    p_period,
    p_due_date,
    p_amount_due,
    v_admission.currency,
    nullif(btrim(p_notes), ''),
    v_user_id
  )
  returning id into v_charge_id;

  return v_charge_id;
end;
$$;

create or replace function public.record_payment(
  p_monthly_charge_id uuid,
  p_paid_on date,
  p_amount numeric,
  p_payment_method text,
  p_reference text default null,
  p_receipt_path text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_charge public.monthly_charges%rowtype;
  v_paid_amount numeric(12, 2);
  v_payment_id uuid;
  v_payment_method text := lower(btrim(p_payment_method));
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if p_paid_on is null or p_paid_on > v_today then
    raise exception 'invalid_payment_date' using errcode = '22023';
  end if;

  if p_amount is null
    or p_amount <= 0
    or p_amount > 9999999999.99 then
    raise exception 'invalid_payment_amount' using errcode = '22023';
  end if;

  if p_payment_method is null
    or v_payment_method not in (
      'cash',
      'bank_transfer',
      'debit_card',
      'credit_card',
      'other'
    ) then
    raise exception 'invalid_payment_method' using errcode = '22023';
  end if;

  -- El bloqueo serializa pagos concurrentes sobre la misma cuota.
  select *
  into v_charge
  from public.monthly_charges
  where id = p_monthly_charge_id
  for update;

  if not found then
    raise exception 'monthly_charge_not_found' using errcode = 'P0002';
  end if;

  if v_charge.cancelled_at is not null then
    raise exception 'monthly_charge_cancelled' using errcode = '23514';
  end if;

  select coalesce(sum(amount), 0)
  into v_paid_amount
  from public.payments
  where monthly_charge_id = p_monthly_charge_id
    and voided_at is null;

  if v_paid_amount + p_amount > v_charge.amount_due then
    raise exception 'payment_exceeds_balance' using errcode = '23514';
  end if;

  insert into public.payments (
    monthly_charge_id,
    paid_on,
    amount,
    payment_method,
    reference,
    receipt_path,
    notes,
    created_by
  )
  values (
    p_monthly_charge_id,
    p_paid_on,
    p_amount,
    v_payment_method,
    nullif(btrim(p_reference), ''),
    nullif(btrim(p_receipt_path), ''),
    nullif(btrim(p_notes), ''),
    v_user_id
  )
  returning id into v_payment_id;

  return v_payment_id;
end;
$$;

create or replace function public.void_payment(
  p_payment_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_payment_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'void_reason_required' using errcode = '22023';
  end if;

  update public.payments
  set
    voided_at = now(),
    voided_reason = btrim(p_reason),
    voided_by = v_user_id
  where id = p_payment_id
    and voided_at is null
  returning id into v_payment_id;

  if not found then
    raise exception 'active_payment_not_found' using errcode = 'P0002';
  end if;

  return v_payment_id;
end;
$$;

create or replace function public.cancel_monthly_charge(
  p_monthly_charge_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_charge_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'cancellation_reason_required' using errcode = '22023';
  end if;

  select id
  into v_charge_id
  from public.monthly_charges
  where id = p_monthly_charge_id
    and cancelled_at is null
  for update;

  if not found then
    raise exception 'current_monthly_charge_not_found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.payments
    where monthly_charge_id = p_monthly_charge_id
      and voided_at is null
  ) then
    raise exception 'monthly_charge_has_active_payments' using errcode = '23514';
  end if;

  update public.monthly_charges
  set
    cancelled_at = now(),
    cancelled_reason = btrim(p_reason),
    cancelled_by = v_user_id
  where id = p_monthly_charge_id;

  return v_charge_id;
end;
$$;

-- La vista concentra los cálculos que consumirá la interfaz y evita guardar un
-- estado redundante que podría quedar desactualizado.
create view public.monthly_charge_balances
with (security_invoker = true)
as
select
  charge.id,
  charge.admission_id,
  charge.period,
  charge.due_date,
  charge.amount_due,
  charge.currency,
  charge.notes,
  charge.created_by,
  charge.created_at,
  charge.cancelled_at,
  charge.cancelled_reason,
  charge.cancelled_by,
  totals.paid_amount,
  (
    case
      when charge.cancelled_at is not null then 0
      else greatest(charge.amount_due - totals.paid_amount, 0)
    end
  )::numeric(12, 2) as balance,
  case
    when charge.cancelled_at is not null then 'cancelled'
    when totals.paid_amount >= charge.amount_due then 'paid'
    when totals.paid_amount > 0 then 'partial'
    else 'pending'
  end as payment_status,
  (
    charge.cancelled_at is null
    and totals.paid_amount < charge.amount_due
    and charge.due_date
      < (now() at time zone 'America/Argentina/Buenos_Aires')::date
  ) as is_overdue
from public.monthly_charges as charge
cross join lateral (
  select coalesce(sum(payment.amount), 0)::numeric(12, 2) as paid_amount
  from public.payments as payment
  where payment.monthly_charge_id = charge.id
    and payment.voided_at is null
) as totals;

alter table public.monthly_charges enable row level security;
alter table public.payments enable row level security;

revoke all on table public.monthly_charges from anon, authenticated;
revoke all on table public.payments from anon, authenticated;
revoke all on table public.monthly_charge_balances from anon, authenticated;

grant select on table public.monthly_charges to authenticated;
grant select on table public.payments to authenticated;
grant select on table public.monthly_charge_balances to authenticated;

create policy "Authenticated users can read monthly charges"
on public.monthly_charges
for select
to authenticated
using ((select auth.uid()) is not null);

create policy "Authenticated users can read payments"
on public.payments
for select
to authenticated
using ((select auth.uid()) is not null);

comment on function public.create_monthly_charge(
  uuid,
  date,
  date,
  numeric,
  text
) is 'Crea una cuota mensual válida para una estadía existente.';

comment on function public.record_payment(
  uuid,
  date,
  numeric,
  text,
  text,
  text,
  text
) is 'Registra un pago sin permitir que la suma supere el saldo de la cuota.';

comment on function public.void_payment(uuid, text)
is 'Anula un pago sin eliminar el movimiento original.';

comment on function public.cancel_monthly_charge(uuid, text)
is 'Anula una cuota que no tenga pagos vigentes.';

revoke all on function public.create_monthly_charge(
  uuid,
  date,
  date,
  numeric,
  text
) from public, anon;

revoke all on function public.record_payment(
  uuid,
  date,
  numeric,
  text,
  text,
  text,
  text
) from public, anon;

revoke all on function public.void_payment(uuid, text) from public, anon;
revoke all on function public.cancel_monthly_charge(uuid, text)
  from public, anon;

grant execute on function public.create_monthly_charge(
  uuid,
  date,
  date,
  numeric,
  text
) to authenticated;

grant execute on function public.record_payment(
  uuid,
  date,
  numeric,
  text,
  text,
  text,
  text
) to authenticated;

grant execute on function public.void_payment(uuid, text) to authenticated;
grant execute on function public.cancel_monthly_charge(uuid, text)
  to authenticated;

commit;
