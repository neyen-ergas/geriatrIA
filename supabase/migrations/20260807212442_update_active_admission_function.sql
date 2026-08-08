begin;

-- La edición modifica las mismas tres entidades que el alta. La función evita
-- que un error intermedio deje una ficha actualizada solo en parte.
create or replace function public.update_active_admission(
  p_resident_id uuid,
  p_contact_id uuid,
  p_admission_id uuid,
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
  v_affected_rows integer;
begin
  update public.residents
  set
    first_name = btrim(p_resident_first_name),
    last_name = btrim(p_resident_last_name),
    dni = btrim(p_resident_dni),
    birth_date = p_resident_birth_date,
    phone = nullif(btrim(p_resident_phone), ''),
    address = nullif(btrim(p_resident_address), ''),
    notes = nullif(btrim(p_resident_notes), '')
  where id = p_resident_id;

  get diagnostics v_affected_rows = row_count;
  if v_affected_rows <> 1 then
    raise exception 'resident_not_found' using errcode = 'P0002';
  end if;

  update public.family_contacts
  set
    first_name = btrim(p_contact_first_name),
    last_name = btrim(p_contact_last_name),
    relationship = btrim(p_contact_relationship),
    phone = btrim(p_contact_phone),
    is_emergency_contact = p_contact_is_emergency_contact,
    is_payment_responsible = p_contact_is_payment_responsible,
    notes = nullif(btrim(p_contact_notes), '')
  where id = p_contact_id
    and resident_id = p_resident_id;

  get diagnostics v_affected_rows = row_count;
  if v_affected_rows <> 1 then
    raise exception 'contact_not_found' using errcode = 'P0002';
  end if;

  update public.admissions
  set
    admitted_at = p_admitted_at,
    room = nullif(btrim(p_room), ''),
    monthly_fee = p_monthly_fee,
    due_day = p_due_day,
    administrative_notes = nullif(btrim(p_administrative_notes), '')
  where id = p_admission_id
    and resident_id = p_resident_id
    and discharged_at is null;

  get diagnostics v_affected_rows = row_count;
  if v_affected_rows <> 1 then
    raise exception 'active_admission_not_found' using errcode = 'P0002';
  end if;

  return p_resident_id;
end;
$$;

comment on function public.update_active_admission(
  uuid,
  uuid,
  uuid,
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
) is 'Actualiza un residente, su contacto inicial y su ingreso activo en una única operación.';

revoke all on function public.update_active_admission(
  uuid,
  uuid,
  uuid,
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

grant execute on function public.update_active_admission(
  uuid,
  uuid,
  uuid,
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
