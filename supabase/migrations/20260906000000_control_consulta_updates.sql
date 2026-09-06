begin;

-- Control de concurrencia y transiciones de Admisión.
-- Ver docs/admision-consultas-modelo.md: la landing conserva INSERT; el CRM
-- modifica consultas exclusivamente mediante esta función.

create or replace function public.consulta_tocar_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- now() es constante dentro de una transacción. Cada escritura necesita una
  -- versión distinta, incluso si el estado cambia y vuelve al valor original.
  new.actualizado_en := greatest(
    clock_timestamp(),
    old.actualizado_en + interval '1 microsecond'
  );
  return new;
end;
$$;

create function public.update_consulta(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_expected_state text,
  p_action text,
  p_state text default null,
  p_visit_date date default null,
  p_visit_slot text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_consulta public.consulta%rowtype;
  v_allowed boolean;
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  -- El bloqueo cubre lectura, validación y escritura. Un segundo operador
  -- espera y compara su versión con la fila ya modificada por el primero.
  select * into v_consulta
  from public.consulta
  where id = p_id
  for update;

  if not found then
    raise exception 'consulta_not_found' using errcode = 'P0002';
  end if;

  if p_expected_updated_at is distinct from v_consulta.actualizado_en
    or p_expected_state is distinct from v_consulta.estado then
    raise exception 'consulta_changed' using errcode = '40001';
  end if;

  case p_action
    when 'change_state' then
      v_allowed := case v_consulta.estado
        when 'nuevo' then p_state in ('contactado', 'descartada')
        when 'contactado' then p_state in ('nuevo', 'descartada')
        when 'visita_agendada' then p_state in ('ingreso', 'descartada')
        when 'ingreso' then p_state = 'contactado'
        when 'descartada' then p_state = 'nuevo'
        else false
      end;

      if v_allowed is not true then
        raise exception 'invalid_consulta_transition' using errcode = '22023';
      end if;

      update public.consulta set estado = p_state where id = p_id;

    when 'schedule_visit' then
      if v_consulta.estado not in ('nuevo', 'contactado', 'visita_agendada') then
        raise exception 'invalid_consulta_transition' using errcode = '22023';
      end if;
      if p_visit_date is null or p_visit_date < v_today
        or p_visit_slot is null or p_visit_slot not in ('manana', 'tarde') then
        raise exception 'invalid_consulta_visit' using errcode = '22023';
      end if;

      update public.consulta
      set estado = 'visita_agendada',
          visita_fecha = p_visit_date,
          visita_franja = p_visit_slot
      where id = p_id;

    when 'cancel_visit' then
      if v_consulta.estado <> 'visita_agendada' then
        raise exception 'invalid_consulta_transition' using errcode = '22023';
      end if;

      update public.consulta
      set estado = 'contactado', visita_fecha = null, visita_franja = null
      where id = p_id;

    when 'save_notes' then
      update public.consulta
      set notas_internas = nullif(btrim(p_notes), '')
      where id = p_id;

    else
      raise exception 'invalid_consulta_action' using errcode = '22023';
  end case;

  return v_consulta.id;
end;
$$;

comment on function public.update_consulta(
  uuid, timestamptz, text, text, text, date, text, text
) is 'Actualiza una consulta si su estado y versión coinciden con los vistos por el operador.';

-- Se mantiene el acceso administrativo heredado, limitado al servidor. No se
-- habilita esta función a usuarios del navegador ni se cambia la landing.
revoke all on function public.update_consulta(
  uuid, timestamptz, text, text, text, date, text, text
) from public, anon, authenticated;
grant execute on function public.update_consulta(
  uuid, timestamptz, text, text, text, date, text, text
) to service_role;

revoke update on public.consulta from public, anon, authenticated, service_role;
grant select, insert on public.consulta to service_role;

commit;
