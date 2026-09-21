"use client";

import Link from "next/link";

import { useActionState, useEffect, useState } from "react";
import { CalendarCheck, Phone } from "lucide-react";
import { SoloAdmin, SoloGestion, usePuedeGestionar } from "@/components/permisos";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  COLORES_ESTADO,
  ETIQUETAS_ESTADO,
  FRANJAS,
  MOMENTOS_LLAMADO,
  TRANSICIONES,
  formatearDia,
  type Consulta,
  type EstadoDirecto,
} from "@/lib/admision";
import {
  agendarVisita,
  cambiarEstado,
  cancelarVisita,
  guardarNotas,
  type Resultado,
} from "./actions";

const estadoInicial: Resultado = { error: null, ok: false };

const ACCION_ESTADO: Record<EstadoDirecto, string> = {
  nuevo: "Reabrir",
  contactado: "Marcar contactada",
  ingreso: "Registró ingreso",
  descartada: "Descartar",
};

const fechaHora = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function ConsultaCard({ consulta }: { consulta: Consulta }) {
  const puedeGestionar = usePuedeGestionar();
  const [resEstado, enviarEstado, cambiandoEstado] = useActionState(
    cambiarEstado,
    estadoInicial,
  );
  const [resAgenda, enviarAgenda, agendando] = useActionState(
    agendarVisita,
    estadoInicial,
  );
  const [resCancelar, enviarCancelar, cancelando] = useActionState(
    cancelarVisita,
    estadoInicial,
  );
  const [resNotas, enviarNotas, guardando] = useActionState(guardarNotas, estadoInicial);

  const [reprogramando, setReprogramando] = useState(false);

  // El mínimo del selector de fecha se calcula en el navegador: hacerlo al
  // renderizar en el servidor daría un día distinto según la zona horaria y
  // React marcaría un desajuste de hidratación.
  const [hoy, setHoy] = useState("");
  useEffect(() => {
    setHoy(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(new Date()),
    );
  }, []);

  const agendada = consulta.estado === "visita_agendada";
  const cerrada = consulta.estado === "ingreso" || consulta.estado === "descartada";
  const mostrarFormulario = puedeGestionar && !cerrada && (!agendada || reprogramando);

  // La key por versión renueva también los campos no controlados al refrescar
  // los datos: nunca combina valores viejos con un token de escritura nuevo.
  return (
    <Card className="p-6 transition-all hover:border-slate-300/80 shadow-2xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900">{consulta.nombre}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Prefiere que la llamen: {MOMENTOS_LLAMADO[consulta.momento_llamado]}
          </p>
        </div>
        <Badge className={COLORES_ESTADO[consulta.estado]}>
          {ETIQUETAS_ESTADO[consulta.estado]}
        </Badge>
      </div>

      <div className="mt-3.5">
        <a
          href={`tel:${consulta.telefono.replace(/\s/g, "")}`}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-50/90 border border-slate-200/70 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 transition-all shadow-2xs"
        >
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          {consulta.telefono}
        </a>
      </div>

      {consulta.mensaje && (
        <div className="mt-4 rounded-xl border-l-4 border-emerald-500 bg-slate-50/70 px-4 py-3 text-xs text-slate-700 shadow-2xs">
          <p className="whitespace-pre-wrap leading-relaxed">{consulta.mensaje}</p>
        </div>
      )}


      {/* ── Visita presencial ─────────────────────────────────────────── */}

      {agendada && consulta.visita_fecha && consulta.visita_franja && (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <CalendarCheck className="h-4 w-4 shrink-0" />
            <span>
              Visita el{" "}
              <span className="font-semibold">{formatearDia(consulta.visita_fecha)}</span>{" "}
              · {FRANJAS[consulta.visita_franja]}
            </span>
          </div>
          <SoloGestion>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2.5 text-sm"
                onClick={() => setReprogramando(v => !v)}
              >
                {reprogramando ? "No reprogramar" : "Reprogramar"}
              </Button>
              <form key={`cancelar-${consulta.actualizado_en}`} action={enviarCancelar}>
                <VersionConsulta consulta={consulta} />
                <Button
                  type="submit"
                  variant="ghost"
                  className="h-8 px-2.5 text-sm"
                  disabled={cancelando}
                >
                  Cancelar visita
                </Button>
              </form>
            </div>
          </SoloGestion>
          {resCancelar.error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {resCancelar.error}
            </p>
          )}
        </div>
      )}

      {cerrada && consulta.visita_fecha && (
        <p className="mt-4 text-sm text-slate-400">
          Se le había agendado visita el {formatearDia(consulta.visita_fecha)}.
        </p>
      )}

      {mostrarFormulario && (
        <form
          key={`agenda-${consulta.actualizado_en}`}
          action={enviarAgenda}
          className="mt-5"
        >
          <VersionConsulta consulta={consulta} />
          <Label>{agendada ? "Nuevo día y franja" : "Agendar visita"}</Label>
          <div className="flex flex-wrap items-start gap-2">
            <Input
              type="date"
              name="visita_fecha"
              min={hoy || undefined}
              defaultValue={consulta.visita_fecha ?? ""}
              required
              disabled={agendando}
              className="w-auto"
            />
            <select
              name="visita_franja"
              defaultValue={consulta.visita_franja ?? "manana"}
              disabled={agendando}
              className={cn(
                "h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none",
                "focus:border-slate-500 focus:ring-2 focus:ring-slate-200",
              )}
            >
              {Object.entries(FRANJAS).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={agendando}>
              {agendando ? "Guardando…" : agendada ? "Reprogramar" : "Agendar"}
            </Button>
          </div>
          {resAgenda.error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {resAgenda.error}
            </p>
          )}
        </form>
      )}

      {/* ── Estado ────────────────────────────────────────────────────── */}

      <div className="mt-5">
        <SoloGestion>
          <form
            key={`estado-${consulta.actualizado_en}`}
            action={enviarEstado}
            className="flex flex-wrap gap-2"
          >
            <VersionConsulta consulta={consulta} />
            {!consulta.ingreso_id &&
              TRANSICIONES[consulta.estado]
                .filter(destino => destino !== "ingreso")
                .map(destino => (
                  <Button
                    key={destino}
                    type="submit"
                    name="estado"
                    value={destino}
                    variant={destino === "descartada" ? "ghost" : "outline"}
                    className="h-9 px-3 text-sm"
                    disabled={cambiandoEstado}
                  >
                    {ACCION_ESTADO[destino]}
                  </Button>
                ))}
          </form>
        </SoloGestion>
        {resEstado.error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {resEstado.error}
          </p>
        )}
        {consulta.ingreso_id ? (
          <Link
            className="mt-3 inline-block text-sm font-medium underline"
            href={`/contabilidad/${consulta.ingreso_id}`}
          >
            Ver cuenta del ingreso
          </Link>
        ) : (
          (consulta.estado === "visita_agendada" || consulta.estado === "ingreso") && (
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <SoloGestion>
                <Link
                  className="text-sm font-medium underline"
                  href={`/admision/${consulta.id}/ingreso`}
                >
                  Registrar ingreso
                </Link>
              </SoloGestion>
              <SoloAdmin>
                <Link
                  className="text-sm font-medium text-sky-700 underline hover:text-sky-900"
                  href={`/entrevistas/nueva?consulta_id=${consulta.id}`}
                >
                  Programar entrevista
                </Link>
              </SoloAdmin>
            </div>
          )
        )}
      </div>

      {/* ── Notas internas ────────────────────────────────────────────── */}

      {puedeGestionar ? (
        <form
          key={`notas-${consulta.actualizado_en}`}
          action={enviarNotas}
          className="mt-5"
        >
          <VersionConsulta consulta={consulta} />
          <Label htmlFor={`notas-${consulta.id}`}>Notas internas</Label>
          <textarea
            id={`notas-${consulta.id}`}
            name="notas_internas"
            rows={2}
            defaultValue={consulta.notas_internas ?? ""}
            placeholder="Qué se habló, con quién, qué falta definir…"
            className={cn(
              "w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-xs text-slate-800 outline-none shadow-2xs placeholder:text-slate-400 transition-all",
              "focus:border-slate-500 focus:ring-2 focus:ring-slate-200",
            )}
          />
          <div className="mt-2 flex items-center gap-3">
            <Button
              type="submit"
              variant="secondary"
              className="h-9 px-3 text-sm"
              disabled={guardando}
            >
              {guardando ? "Guardando…" : "Guardar notas"}
            </Button>
            {resNotas.ok && !guardando && (
              <span className="text-sm text-emerald-700">Guardado.</span>
            )}
            {resNotas.error && (
              <span role="alert" className="text-sm text-red-600">
                {resNotas.error}
              </span>
            )}
          </div>
        </form>
      ) : (
        <div className="mt-5">
          <p className="text-sm font-medium">Notas internas</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
            {consulta.notas_internas || "Sin notas."}
          </p>
        </div>
      )}

      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
        Recibida el {fechaHora.format(new Date(consulta.creado_en))} · origen{" "}
        {consulta.origen}
      </p>
    </Card>
  );
}

/** Estado y versión viajan con los valores que muestra cada formulario. */
function VersionConsulta({ consulta }: { consulta: Consulta }) {
  return (
    <>
      <input type="hidden" name="id" value={consulta.id} />
      <input type="hidden" name="estado_esperado" value={consulta.estado} />
      <input type="hidden" name="actualizado_en" value={consulta.actualizado_en} />
    </>
  );
}
