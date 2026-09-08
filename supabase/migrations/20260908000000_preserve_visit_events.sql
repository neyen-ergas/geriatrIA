-- Conserva cambios de agenda y autor verificado en la misma transacción.
-- Ver docs/admision-historial.md. No reconstruye eventos anteriores.
begin;

create table public.visit_events (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consulta(id) on delete restrict,
  action text not null check (action in ('scheduled', 'rescheduled', 'cancelled', 'closed')),
  occurred_at timestamptz not null default clock_timestamp(),
  actor_id uuid not null references auth.users(id) on delete restrict,
  previous_date date,
  previous_slot text check (previous_slot in ('manana', 'tarde')),
  new_date date,
  new_slot text check (new_slot in ('manana', 'tarde')),
  previous_state text not null,
  new_state text not null,
  constraint visit_events_previous_complete check (
    (previous_date is null) = (previous_slot is null)
  ),
  constraint visit_events_new_complete check (
    (new_date is null) = (new_slot is null)
  )
);
create index visit_events_consultation_time_idx
  on public.visit_events (consultation_id, occurred_at, id);
alter table public.visit_events enable row level security;
revoke all on public.visit_events from public, anon, authenticated, service_role;
grant select on public.visit_events to authenticated;
create policy visit_events_read on public.visit_events
  for select to authenticated using ((select auth.uid()) is not null);

create or replace function public.update_consulta(
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
  v_actor uuid := auth.uid();
  v_after public.consulta%rowtype;
  v_action text;
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if v_actor is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
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

  if p_action in ('schedule_visit', 'cancel_visit')
    or (p_action = 'change_state' and v_consulta.estado = 'visita_agendada') then
    select * into v_after from public.consulta where id = p_id;
    v_action := case
      when p_action = 'cancel_visit' then 'cancelled'
      when p_action = 'change_state' then 'closed'
      when v_consulta.estado = 'visita_agendada' then 'rescheduled'
      else 'scheduled'
    end;
    insert into public.visit_events (
      consultation_id, action, actor_id, previous_date, previous_slot,
      new_date, new_slot, previous_state, new_state
    ) values (
      p_id, v_action, v_actor, v_consulta.visita_fecha, v_consulta.visita_franja,
      v_after.visita_fecha, v_after.visita_franja,
      v_consulta.estado, v_after.estado
    );
  end if;

  return v_consulta.id;
end;
$$;


-- La identidad proviene del JWT del cliente autenticado, nunca del formulario.
grant execute on function public.update_consulta(
  uuid, timestamptz, text, text, text, date, text, text
) to authenticated;
commit;

