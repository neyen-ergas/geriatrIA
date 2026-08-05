begin;

-- La persona se conserva aunque deje la institución. El estado activo se
-- obtiene a partir de admissions, no de una columna duplicada en residents.
create table public.residents (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  dni text not null unique,
  birth_date date not null,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint residents_first_name_not_blank
    check (btrim(first_name) <> ''),
  constraint residents_last_name_not_blank
    check (btrim(last_name) <> ''),
  constraint residents_dni_not_blank
    check (btrim(dni) <> '')
);

create table public.family_contacts (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null
    references public.residents (id) on delete restrict,
  first_name text not null,
  last_name text not null,
  relationship text not null,
  phone text not null,
  is_emergency_contact boolean not null default false,
  is_payment_responsible boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint family_contacts_first_name_not_blank
    check (btrim(first_name) <> ''),
  constraint family_contacts_last_name_not_blank
    check (btrim(last_name) <> ''),
  constraint family_contacts_relationship_not_blank
    check (btrim(relationship) <> ''),
  constraint family_contacts_phone_not_blank
    check (btrim(phone) <> '')
);

create table public.admissions (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null
    references public.residents (id) on delete restrict,
  admitted_at date not null,
  room text,
  monthly_fee numeric(12, 2) not null,
  currency text not null default 'ARS',
  due_day integer not null,
  administrative_notes text,
  discharged_at date,
  discharge_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint admissions_monthly_fee_not_negative
    check (monthly_fee >= 0),
  constraint admissions_currency_iso_format
    check (currency ~ '^[A-Z]{3}$'),
  constraint admissions_due_day_valid
    check (due_day between 1 and 31),
  constraint admissions_discharge_date_valid
    check (discharged_at is null or discharged_at >= admitted_at),
  constraint admissions_discharge_reason_not_blank
    check (discharge_reason is null or btrim(discharge_reason) <> '')
);

create index family_contacts_resident_id_idx
  on public.family_contacts (resident_id);

create index admissions_resident_id_idx
  on public.admissions (resident_id);

-- Un índice único parcial permite conservar ingresos históricos, pero impide
-- que una persona tenga dos estadías activas al mismo tiempo.
create unique index admissions_one_active_per_resident_idx
  on public.admissions (resident_id)
  where discharged_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger residents_set_updated_at
before update on public.residents
for each row execute function public.set_updated_at();

create trigger family_contacts_set_updated_at
before update on public.family_contacts
for each row execute function public.set_updated_at();

create trigger admissions_set_updated_at
before update on public.admissions
for each row execute function public.set_updated_at();

alter table public.residents enable row level security;
alter table public.family_contacts enable row level security;
alter table public.admissions enable row level security;

-- En esta etapa cada proyecto pertenece a un geriátrico y solo existen
-- usuarios creados manualmente. Los visitantes anónimos no reciben permisos y
-- tampoco se habilita DELETE: una baja debe conservar el historial.
revoke all on table public.residents from anon;
revoke all on table public.family_contacts from anon;
revoke all on table public.admissions from anon;

grant select, insert, update on table public.residents to authenticated;
grant select, insert, update on table public.family_contacts to authenticated;
grant select, insert, update on table public.admissions to authenticated;

create policy "Authenticated users can read residents"
on public.residents
for select
to authenticated
using ((select auth.uid()) is not null);

create policy "Authenticated users can create residents"
on public.residents
for insert
to authenticated
with check ((select auth.uid()) is not null);

create policy "Authenticated users can update residents"
on public.residents
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

create policy "Authenticated users can read family contacts"
on public.family_contacts
for select
to authenticated
using ((select auth.uid()) is not null);

create policy "Authenticated users can create family contacts"
on public.family_contacts
for insert
to authenticated
with check ((select auth.uid()) is not null);

create policy "Authenticated users can update family contacts"
on public.family_contacts
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

create policy "Authenticated users can read admissions"
on public.admissions
for select
to authenticated
using ((select auth.uid()) is not null);

create policy "Authenticated users can create admissions"
on public.admissions
for insert
to authenticated
with check ((select auth.uid()) is not null);

create policy "Authenticated users can update admissions"
on public.admissions
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

commit;
