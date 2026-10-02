-- Permite registrar consultas telefónicas o presenciales desde el CRM.
-- Conserva el mismo circuito y la misma auditoría que las consultas de la web.
create or replace function public.create_manual_consultation(
  p_name text,
  p_phone text,
  p_message text,
  p_source text,
  p_call_window text,
  p_allow_duplicate boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone_digits text := pg_catalog.regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_existing_id uuid;
  v_created_id uuid;
begin
  perform public.require_permission('operational.write');
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if p_name is null or pg_catalog.char_length(pg_catalog.btrim(p_name)) not between 2 and 80
    or p_phone is null or pg_catalog.char_length(pg_catalog.btrim(p_phone)) not between 6 and 30
    or pg_catalog.char_length(v_phone_digits) < 6
    or p_message is null or pg_catalog.char_length(pg_catalog.btrim(p_message)) not between 2 and 1000
    or p_source is null or p_source not in ('telefono', 'presencial')
    or p_call_window is null or p_call_window not in ('manana', 'tarde', 'indistinto') then
    raise exception 'invalid_manual_consultation' using errcode = '22023';
  end if;

  -- Serializa dos altas simultáneas con el mismo teléfono. Es una advertencia,
  -- no una fusión: el operador puede registrar otra familia si corresponde.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_phone_digits, 0));
  select c.id into v_existing_id
  from public.consulta c
  where pg_catalog.regexp_replace(c.telefono, '[^0-9]', '', 'g') = v_phone_digits
    and c.estado in ('nuevo', 'contactado', 'visita_agendada')
  order by c.creado_en desc, c.id desc
  limit 1;

  if v_existing_id is not null and p_allow_duplicate is not true then
    return pg_catalog.jsonb_build_object('duplicate_id', v_existing_id);
  end if;

  insert into public.consulta (nombre, telefono, mensaje, origen, momento_llamado)
  values (
    pg_catalog.btrim(p_name), pg_catalog.btrim(p_phone), pg_catalog.btrim(p_message),
    p_source, p_call_window
  )
  returning id into v_created_id;
  return pg_catalog.jsonb_build_object('created_id', v_created_id);
end;
$$;

revoke all on function public.create_manual_consultation(text,text,text,text,text,boolean)
  from public, anon;
grant execute on function public.create_manual_consultation(text,text,text,text,text,boolean)
  to authenticated;
