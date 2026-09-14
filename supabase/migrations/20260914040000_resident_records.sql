-- Ficha integral: documentos privados, salud y pertenencias. docs/ficha-integral.md.
begin;

create table public.resident_documents (
  id uuid primary key,
  resident_id uuid not null references public.residents(id) on delete restrict,
  title text not null check (btrim(title) <> ''),
  document_type text not null check (btrim(document_type) <> ''),
  file_path text not null unique,
  issued_on date, notes text,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  archived_at timestamptz, archived_reason text,
  constraint resident_documents_archive_complete check (
    (archived_at is null and archived_reason is null) or
    (archived_at is not null and nullif(btrim(archived_reason),'') is not null))
);
alter table public.resident_documents enable row level security;
revoke all on public.resident_documents from public, anon, authenticated, service_role;
grant select on public.resident_documents to authenticated;
create policy resident_documents_read on public.resident_documents for select to authenticated
using ((select public.has_permission('operational.read')));
create index resident_documents_resident_time on public.resident_documents (resident_id, created_at desc, id desc);

create table public.medical_indications (
  id uuid primary key,
  resident_id uuid not null references public.residents(id) on delete restrict,
  title text not null check (btrim(title) <> ''),
  instructions text not null check (btrim(instructions) <> ''),
  professional text not null check (btrim(professional) <> ''),
  starts_on date not null, ends_on date,
  check (ends_on is null or ends_on >= starts_on),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  archived_at timestamptz, archived_reason text,
  constraint medical_indications_archive_complete check (
    (archived_at is null and archived_reason is null) or
    (archived_at is not null and nullif(btrim(archived_reason),'') is not null))
);
alter table public.medical_indications enable row level security;
revoke all on public.medical_indications from public, anon, authenticated, service_role;
grant select on public.medical_indications to authenticated;
create policy medical_indications_read on public.medical_indications for select to authenticated
using ((select public.has_permission('operational.read')));
create index medical_indications_resident_time on public.medical_indications (resident_id, created_at desc, id desc);

create table public.medications (
  id uuid primary key,
  resident_id uuid not null references public.residents(id) on delete restrict,
  name text not null check (btrim(name) <> ''),
  dose text not null check (btrim(dose) <> ''),
  frequency text not null check (btrim(frequency) <> ''),
  schedule text not null check (btrim(schedule) <> ''),
  professional text not null check (btrim(professional) <> ''),
  starts_on date not null, ends_on date, notes text,
  check (ends_on is null or ends_on >= starts_on),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  archived_at timestamptz, archived_reason text,
  constraint medications_archive_complete check (
    (archived_at is null and archived_reason is null) or
    (archived_at is not null and nullif(btrim(archived_reason),'') is not null))
);
alter table public.medications enable row level security;
revoke all on public.medications from public, anon, authenticated, service_role;
grant select on public.medications to authenticated;
create policy medications_read on public.medications for select to authenticated
using ((select public.has_permission('operational.read')));
create index medications_resident_time on public.medications (resident_id, created_at desc, id desc);

create table public.special_needs (
  id uuid primary key,
  resident_id uuid not null references public.residents(id) on delete restrict,
  category text not null check (category in ('diet','allergy','mobility','care')),
  details text not null check (btrim(details) <> ''),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  archived_at timestamptz, archived_reason text,
  constraint special_needs_archive_complete check (
    (archived_at is null and archived_reason is null) or
    (archived_at is not null and nullif(btrim(archived_reason),'') is not null))
);
alter table public.special_needs enable row level security;
revoke all on public.special_needs from public, anon, authenticated, service_role;
grant select on public.special_needs to authenticated;
create policy special_needs_read on public.special_needs for select to authenticated
using ((select public.has_permission('operational.read')));
create index special_needs_resident_time on public.special_needs (resident_id, created_at desc, id desc);

create table public.inventory_items (
  id uuid primary key,
  resident_id uuid not null references public.residents(id) on delete restrict,
  admission_id uuid not null references public.admissions(id) on delete restrict,
  description text not null check (btrim(description) <> ''),
  quantity integer not null check (quantity between 1 and 100000),
  received_on date not null, returned_on date, notes text,
  check (returned_on is null or returned_on >= received_on),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  archived_at timestamptz, archived_reason text,
  constraint inventory_items_archive_complete check (
    (archived_at is null and archived_reason is null) or
    (archived_at is not null and nullif(btrim(archived_reason),'') is not null))
);
alter table public.inventory_items enable row level security;
revoke all on public.inventory_items from public, anon, authenticated, service_role;
grant select on public.inventory_items to authenticated;
create policy inventory_items_read on public.inventory_items for select to authenticated
using ((select public.has_permission('operational.read')));
create index inventory_items_resident_time on public.inventory_items (resident_id, created_at desc, id desc);

create function public.resident_record_fields(p_section text)
returns text[] language sql immutable set search_path = '' as $$
  select case p_section
    when 'resident_documents' then string_to_array('title,document_type,file_path,issued_on,notes',',')
    when 'medical_indications' then string_to_array('title,instructions,professional,starts_on,ends_on',',')
    when 'medications' then string_to_array('name,dose,frequency,schedule,professional,starts_on,ends_on,notes',',')
    when 'special_needs' then string_to_array('category,details',',')
    when 'inventory_items' then string_to_array('admission_id,description,quantity,received_on,returned_on,notes',',')
    else null end;
$$;
revoke all on function public.resident_record_fields(text) from public, anon, authenticated, service_role;

create function public.save_resident_record(
  p_section text, p_resident_id uuid, p_id uuid,
  p_values jsonb default '{}'::jsonb,
  p_expected_updated_at timestamptz default null, p_archive_reason text default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_fields text[];
  v_previous jsonb;
  v_typed jsonb;
  v_columns text;
  v_select text;
  v_assign text;
  v_now timestamptz;
begin
  perform public.require_permission('operational.write');
  v_fields := public.resident_record_fields(p_section);
  if v_fields is null or p_id is null or p_resident_id is null or p_values is null
    or jsonb_typeof(p_values) <> 'object' then
    raise exception 'invalid_resident_record' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_object_keys(p_values) k where not k = any(v_fields)) then
    raise exception 'invalid_record_field' using errcode = '22023';
  end if;
  perform 1 from public.residents where id = p_resident_id for update;
  if not found then raise exception 'resident_not_found' using errcode = 'P0002'; end if;
  -- Nombres de tablas/campos proceden exclusivamente de la lista cerrada anterior.
  execute format('select to_jsonb(t) from public.%I t where id = $1 for update', p_section)
    into v_previous using p_id;
  if v_previous is not null then
    if (v_previous->>'resident_id')::uuid <> p_resident_id then
      raise exception 'resident_record_not_found' using errcode = 'P0002';
    end if;
    if (v_previous->>'updated_at')::timestamptz is distinct from p_expected_updated_at then
      raise exception 'resident_record_changed' using errcode = '40001';
    end if;
    if v_previous->>'archived_at' is not null then
      raise exception 'resident_record_archived' using errcode = '23514';
    end if;
  elsif p_expected_updated_at is not null or p_archive_reason is not null then
    raise exception 'resident_record_not_found' using errcode = 'P0002';
  end if;
  v_now := greatest(clock_timestamp(), (v_previous->>'updated_at')::timestamptz + interval '1 microsecond');
  if p_archive_reason is not null then
    if nullif(btrim(p_archive_reason),'') is null then
      raise exception 'archive_reason_required' using errcode = '23514';
    end if;
    execute format('update public.%I set archived_at=$1, archived_reason=$2, updated_at=$1, updated_by=$3 where id=$4', p_section)
      using v_now, btrim(p_archive_reason), auth.uid(), p_id;
    return p_id;
  end if;
  execute format('select to_jsonb(jsonb_populate_record(null::public.%I, $1))', p_section)
    into v_typed using p_values;
  if p_section = 'inventory_items' then
    if not exists (select 1 from public.admissions where id = (v_typed->>'admission_id')::uuid
      and resident_id = p_resident_id and (v_typed->>'received_on')::date >= admitted_at) then
      raise exception 'inventory_admission_mismatch' using errcode = '23514';
    end if;
    if v_previous is not null and v_previous->>'admission_id' is distinct from v_typed->>'admission_id' then
      raise exception 'inventory_admission_immutable' using errcode = '23514';
    end if;
    if (v_typed->>'received_on')::date > (current_timestamp at time zone 'America/Argentina/Buenos_Aires')::date
      or (v_typed->>'returned_on')::date > (current_timestamp at time zone 'America/Argentina/Buenos_Aires')::date then
      raise exception 'inventory_future_date' using errcode = '23514';
    end if;
  end if;
  if p_section = 'resident_documents' then
    if v_previous is not null and v_previous->>'file_path' is distinct from v_typed->>'file_path' then
      raise exception 'document_file_immutable' using errcode = '23514';
    end if;
    if v_previous is null and (
      (storage.foldername(v_typed->>'file_path'))[1] is distinct from auth.uid()::text or
      (storage.foldername(v_typed->>'file_path'))[2] is distinct from p_resident_id::text or
      array_length(storage.foldername(v_typed->>'file_path'),1) is distinct from 2 or
      not exists (select 1 from storage.objects where bucket_id = 'resident-documents' and name = v_typed->>'file_path')
    ) then raise exception 'invalid_resident_document' using errcode = '23514'; end if;
  end if;
  select string_agg(format('%I',f),','), string_agg(format('x.%I',f),','),
    string_agg(format('%I=x.%I',f,f),',') into v_columns,v_select,v_assign from unnest(v_fields) f;
  if v_previous is null then
    execute format('insert into public.%I (id,resident_id,created_by,updated_by,created_at,updated_at,%s)
      select $2,$3,$4,$4,$5,$5,%s from jsonb_populate_record(null::public.%I,$1) x', p_section,v_columns,v_select,p_section)
      using p_values,p_id,p_resident_id,auth.uid(),v_now;
  else
    execute format('update public.%I t set %s,updated_at=$3,updated_by=$4
      from jsonb_populate_record(null::public.%I,$1) x where t.id=$2',p_section,v_assign,p_section)
      using p_values,p_id,v_now,auth.uid();
  end if;
  return p_id;
end;
$$;
revoke all on function public.save_resident_record(text,uuid,uuid,jsonb,timestamptz,text)
from public, anon, service_role;
grant execute on function public.save_resident_record(text,uuid,uuid,jsonb,timestamptz,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('resident-documents','resident-documents',false,3145728,array['image/jpeg','image/png','application/pdf']);
create policy resident_documents_upload on storage.objects for insert to authenticated
with check (bucket_id = 'resident-documents' and (select public.has_permission('operational.write'))
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and array_length(storage.foldername(name),1) = 2
  and storage.extension(name) in ('jpg','png','pdf')
  and exists (select 1 from public.residents where id::text = (storage.foldername(name))[2]));
create policy resident_documents_download on storage.objects for select to authenticated
using (bucket_id = 'resident-documents' and (select public.has_permission('operational.read'))
  and ((storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.resident_documents where file_path = name)));

alter table public.audit_events drop constraint audit_table_valid;
alter table public.audit_events add constraint audit_table_valid check (table_name in
 ('consulta','residents','family_contacts','admissions','monthly_charges','payments','employees','user_access','consultation_admissions',
  'resident_documents','medical_indications','medications','special_needs','inventory_items'));
create or replace function public.capture_operational_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_row jsonb;
  v_fields text[] := string_to_array(tg_argv[1], ',');
  v_changed text[];
  v_label text;
  v_actor_label text;
begin
  if tg_op <> 'INSERT' then
    select coalesce(jsonb_object_agg(key,value), '{}'::jsonb) into v_before
    from jsonb_each(to_jsonb(old)) where key = any(v_fields);
  end if;
  if tg_op <> 'DELETE' then
    select coalesce(jsonb_object_agg(key,value), '{}'::jsonb) into v_after
    from jsonb_each(to_jsonb(new)) where key = any(v_fields);
  end if;
  -- Ignora cambios de reloj/bloqueo y reenvíos sin cambios funcionales.
  if tg_op = 'UPDATE' and v_before = v_after then return new; end if;
  select array_agg(field order by field) into v_changed from unnest(v_fields) field
  where (v_before -> field) is distinct from (v_after -> field);
  v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  select email into v_actor_label from auth.users where id = auth.uid();
  case tg_table_name
    when 'consulta' then v_label := v_row ->> 'nombre';
    when 'residents', 'family_contacts', 'employees' then
      v_label := (v_row ->> 'last_name') || ', ' || (v_row ->> 'first_name');
    when 'admissions', 'resident_documents', 'medical_indications', 'medications', 'special_needs', 'inventory_items' then
      select last_name || ', ' || first_name into v_label from public.residents where id = (v_row ->> 'resident_id')::uuid;
    when 'monthly_charges' then
      select r.last_name || ', ' || r.first_name into v_label from public.admissions a
      join public.residents r on r.id = a.resident_id where a.id = (v_row ->> 'admission_id')::uuid;
    when 'payments' then
      select r.last_name || ', ' || r.first_name into v_label from public.monthly_charges c
      join public.admissions a on a.id = c.admission_id join public.residents r on r.id = a.resident_id
      where c.id = (v_row ->> 'monthly_charge_id')::uuid;
    when 'user_access' then select email into v_label from auth.users where id = (v_row ->> 'user_id')::uuid;
    when 'consultation_admissions' then select nombre into v_label from public.consulta where id = (v_row ->> 'consultation_id')::uuid;
    else raise exception 'unsupported_audit_table';
  end case;
  insert into public.audit_events (table_name, record_id, action, actor_id, actor_label, record_label, old_values, new_values, changed_fields)
  values (tg_table_name, (v_row ->> tg_argv[0])::uuid, lower(tg_op), auth.uid(), v_actor_label, v_label,
    v_before, v_after, coalesce(v_changed, array[]::text[]));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger resident_documents_audit after insert or update or delete on public.resident_documents
for each row execute function public.capture_operational_audit('id','resident_id,title,document_type,file_path,issued_on,notes,archived_at,archived_reason');

create trigger medical_indications_audit after insert or update or delete on public.medical_indications
for each row execute function public.capture_operational_audit('id','resident_id,title,instructions,professional,starts_on,ends_on,archived_at,archived_reason');

create trigger medications_audit after insert or update or delete on public.medications
for each row execute function public.capture_operational_audit('id','resident_id,name,dose,frequency,schedule,professional,starts_on,ends_on,notes,archived_at,archived_reason');

create trigger special_needs_audit after insert or update or delete on public.special_needs
for each row execute function public.capture_operational_audit('id','resident_id,category,details,archived_at,archived_reason');

create trigger inventory_items_audit after insert or update or delete on public.inventory_items
for each row execute function public.capture_operational_audit('id','resident_id,admission_id,description,quantity,received_on,returned_on,notes,archived_at,archived_reason');

commit;
