-- Admisión: consultas que entran desde la landing.
--
-- Esta migración reproduce el esquema que ya está aplicado en el proyecto remoto.
-- El script original se ejecutó a mano en el editor SQL antes de que existiera el
-- flujo de migraciones, así que todo acá es idempotente: aplicarla contra la base
-- actual no cambia nada y sirve como punto de partida versionado.
--
-- La landing solo escribe el lead: nombre, teléfono, cuándo llamar y un mensaje
-- libre. La visita presencial no la reserva la familia: la agenda admisión desde
-- este CRM después de llamar, y se guarda en esta misma fila (`visita_fecha` /
-- `visita_franja`).
--
-- Ver docs/admision-consultas-modelo.md.

create extension if not exists pgcrypto;

create table if not exists public.consulta (
  id             uuid primary key default gen_random_uuid(),
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  -- ── lo que deja la familia en el formulario de la landing ────────────────
  nombre   text not null check (length(btrim(nombre)) between 2 and 80),
  telefono text not null check (length(btrim(telefono)) between 6 and 30),
  -- Cuándo le queda cómodo atender el llamado.
  momento_llamado text not null default 'indistinto'
                  check (momento_llamado in ('manana','tarde','indistinto')),
  mensaje  text check (mensaje is null or length(mensaje) <= 1000),
  origen   text not null default 'landing',

  -- ── gestión de admisión, desde el CRM ────────────────────────────────────
  estado text not null default 'nuevo'
         check (estado in ('nuevo','contactado','visita_agendada','ingreso','descartada')),
  notas_internas text,

  -- Visita presencial que sale de esta consulta. Las carga el CRM, nunca la
  -- landing: van juntas o no van (no sirve una fecha sin franja).
  visita_fecha  date,
  visita_franja text check (visita_franja in ('manana','tarde')),
  constraint consulta_visita_completa
    check ((visita_fecha is null) = (visita_franja is null))
);

comment on table public.consulta is
  'Leads de la landing. La landing inserta el contacto; el CRM los gestiona vía estado y les agenda la visita.';

-- ── Un solo turno de visita por día y franja ────────────────────────────────
-- Índice único parcial: la garantía real de que no se agenden dos visitas al
-- mismo tiempo. Al vivir en la base resiste dos operadores agendando en simultáneo,
-- cosa que una validación desde la app no puede asegurar. Solo cuenta mientras la
-- visita está vigente, así que cambiar el estado libera el turno.
create unique index if not exists consulta_visita_unica
  on public.consulta (visita_fecha, visita_franja)
  where estado = 'visita_agendada';

-- Bandeja de entrada del CRM: lo que todavía hay que trabajar, lo más nuevo arriba.
create index if not exists consulta_pendientes_idx
  on public.consulta (creado_en desc)
  where estado in ('nuevo', 'contactado');

-- Agenda de visitas del CRM.
create index if not exists consulta_agenda_idx
  on public.consulta (visita_fecha, visita_franja)
  where estado = 'visita_agendada';

-- ── actualizado_en automático ───────────────────────────────────────────────
create or replace function public.consulta_tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

drop trigger if exists consulta_actualizado_en on public.consulta;
create trigger consulta_actualizado_en
  before update on public.consulta
  for each row execute function public.consulta_tocar_actualizado_en();

-- ── Seguridad ───────────────────────────────────────────────────────────────
-- RLS activada y sin políticas: nadie con la clave pública (anon/authenticated)
-- puede leer ni escribir esta tabla. El único acceso es con la service role key,
-- que bypassea RLS y vive solo del lado del servidor (Server Action de la landing
-- y Server Components/Actions del CRM). Así los datos personales de las familias
-- nunca quedan expuestos desde el navegador.
alter table public.consulta enable row level security;

revoke all on public.consulta from anon, authenticated;
