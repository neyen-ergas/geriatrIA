begin;

-- El primer ingreso afecta tres tablas. Encapsularlo en una función hace que
-- Postgres confirme las tres inserciones juntas o revierta todas si una falla.
create or replace function public.create_initial_admission(
  p_resident_first_name text,
  p_resident_last_name text,
  p_resident_dni text,
  p_resident_birth_date date,
  p_contact_first_name text,
  p_contact_last_name text,
  p_contact_relationship text,
  p_contact_phone text,
  p_contact_is_emergency_contact boolean,
  p_contact_is_payment_responsible boolean,
  p_admitted_at date,
  p_monthly_fee numeric,
  p_due_day integer,
  p_resident_phone text default null,
  p_resident_address text default null,
  p_resident_notes text default null,
  p_contact_notes text default null,
  p_room text default null,
  p_administrative_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_resident_id uuid;
begin
  insert into public.residents (
    first_name,
    last_name,
    dni,
    birth_date,
    phone,
    address,
    notes
  )
  values (
    btrim(p_resident_first_name),
    btrim(p_resident_last_name),
    btrim(p_resident_dni),
    p_resident_birth_date,
    nullif(btrim(p_resident_phone), ''),
    nullif(btrim(p_resident_address), ''),
    nullif(btrim(p_resident_notes), '')
  )
  returning id into v_resident_id;

  insert into public.family_contacts (
    resident_id,
    first_name,
    last_name,
    relationship,
    phone,
    is_emergency_contact,
    is_payment_responsible,
    notes
  )
  values (
    v_resident_id,
    btrim(p_contact_first_name),
    btrim(p_contact_last_name),
    btrim(p_contact_relationship),
    btrim(p_contact_phone),
    p_contact_is_emergency_contact,
    p_contact_is_payment_responsible,
    nullif(btrim(p_contact_notes), '')
  );

  insert into public.admissions (
    resident_id,
    admitted_at,
    room,
    monthly_fee,
    currency,
    due_day,
    administrative_notes
  )
  values (
    v_resident_id,
    p_admitted_at,
    nullif(btrim(p_room), ''),
    p_monthly_fee,
    'ARS',
    p_due_day,
    nullif(btrim(p_administrative_notes), '')
  );

  return v_resident_id;
end;
$$;

comment on function public.create_initial_admission(
  text,
  text,
  text,
  date,
  text,
  text,
  text,
  text,
  boolean,
  boolean,
  date,
  numeric,
  integer,
  text,
  text,
  text,
  text,
  text,
  text
) is 'Crea un residente, su primer contacto y su primer ingreso en una única operación.';

-- Las políticas RLS de las tablas siguen vigentes porque la función se ejecuta
-- con los permisos del usuario autenticado, no como un usuario administrador.
revoke all on function public.create_initial_admission(
  text,
  text,
  text,
  date,
  text,
  text,
  text,
  text,
  boolean,
  boolean,
  date,
  numeric,
  integer,
  text,
  text,
  text,
  text,
  text,
  text
) from public, anon;

grant execute on function public.create_initial_admission(
  text,
  text,
  text,
  date,
  text,
  text,
  text,
  text,
  boolean,
  boolean,
  date,
  numeric,
  integer,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;

commit;
