-- Familiares adicionales y edición con versión; docs/familiares.md.
begin;

create function public.version_family_contact()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond');
  else
    new.created_at := clock_timestamp();
    new.updated_at := new.created_at;
  end if;
  return new;
end;
$$;
revoke all on function public.version_family_contact() from public, anon, authenticated;
drop trigger family_contacts_set_updated_at on public.family_contacts;
create trigger family_contacts_set_updated_at before insert or update on public.family_contacts
for each row execute function public.version_family_contact();

create function public.save_family_contact(
  p_resident_id uuid, p_id uuid, p_expected_updated_at timestamptz default null,
  p_first_name text default null, p_last_name text default null,
  p_relationship text default null, p_phone text default null,
  p_is_emergency_contact boolean default false,
  p_is_payment_responsible boolean default false, p_notes text default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_previous public.family_contacts%rowtype;
begin
  perform public.require_permission('operational.write');
  if p_id is null or p_resident_id is null then
    raise exception 'invalid_contact' using errcode = '23514';
  end if;
  -- Mismo orden de bloqueo que la edición del ingreso: persona, luego contacto.
  perform 1 from public.residents where id = p_resident_id for update;
  if not found then raise exception 'resident_not_found' using errcode = 'P0002'; end if;
  if nullif(btrim(p_first_name),'') is null or nullif(btrim(p_last_name),'') is null
    or nullif(btrim(p_relationship),'') is null or nullif(btrim(p_phone),'') is null
    or p_is_emergency_contact is null or p_is_payment_responsible is null then
    raise exception 'invalid_contact' using errcode = '23514';
  end if;
  select * into v_previous from public.family_contacts where id = p_id for update;
  if found then
    if v_previous.resident_id <> p_resident_id then
      raise exception 'contact_not_found' using errcode = 'P0002';
    end if;
    -- El id de alta se genera al abrir el formulario: reenviar el mismo alta
    -- confirmada no duplica una persona ni genera otro evento de auditoría.
    if p_expected_updated_at is null and
      row(v_previous.first_name,v_previous.last_name,v_previous.relationship,v_previous.phone,
        v_previous.is_emergency_contact,v_previous.is_payment_responsible,v_previous.notes)
      is not distinct from row(btrim(p_first_name),btrim(p_last_name),btrim(p_relationship),btrim(p_phone),
        p_is_emergency_contact,p_is_payment_responsible,nullif(btrim(p_notes),'')) then return p_id; end if;
    if p_expected_updated_at is distinct from v_previous.updated_at then
      raise exception 'contact_changed' using errcode = '40001';
    end if;
    update public.family_contacts set first_name = btrim(p_first_name), last_name = btrim(p_last_name),
      relationship = btrim(p_relationship), phone = btrim(p_phone),
      is_emergency_contact = p_is_emergency_contact, is_payment_responsible = p_is_payment_responsible,
      notes = nullif(btrim(p_notes),'') where id = p_id;
  else
    if p_expected_updated_at is not null then
      raise exception 'contact_not_found' using errcode = 'P0002';
    end if;
    insert into public.family_contacts(id,resident_id,first_name,last_name,relationship,phone,
      is_emergency_contact,is_payment_responsible,notes)
    values (p_id,p_resident_id,btrim(p_first_name),btrim(p_last_name),btrim(p_relationship),btrim(p_phone),
      p_is_emergency_contact,p_is_payment_responsible,nullif(btrim(p_notes),''));
  end if;
  return p_id;
end;
$$;
revoke all on function public.save_family_contact(uuid,uuid,timestamptz,text,text,text,text,boolean,boolean,text)
from public, anon, service_role;
grant execute on function public.save_family_contact(uuid,uuid,timestamptz,text,text,text,text,boolean,boolean,text)
to authenticated;


-- Las ediciones del ingreso también presentan la versión del contacto inicial.
drop function public.update_active_admission(uuid,uuid,uuid,text,text,text,date,text,text,text,text,boolean,boolean,date,numeric,integer,text,text,text,text,text,text);
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
  p_administrative_notes text default null,
  p_expected_contact_updated_at timestamptz default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_affected_rows integer;
begin
  perform public.require_permission('operational.write');
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
    and resident_id = p_resident_id
    and updated_at = p_expected_contact_updated_at;

  get diagnostics v_affected_rows = row_count;
  if v_affected_rows <> 1 then
    raise exception 'contact_changed' using errcode = '40001';
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


revoke all on function public.update_active_admission(uuid,uuid,uuid,text,text,text,date,text,text,text,text,boolean,boolean,date,numeric,integer,text,text,text,text,text,text,timestamptz) from public, anon;
grant execute on function public.update_active_admission(uuid,uuid,uuid,text,text,text,date,text,text,text,text,boolean,boolean,date,numeric,integer,text,text,text,text,text,text,timestamptz) to authenticated;
commit;

