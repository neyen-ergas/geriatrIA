"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarCheck, Phone } from "lucide-react";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  COLORES_ESTADO,
  ETIQUETAS_ESTADO,
  FRANJAS,
  MOMENTOS_LLAMADO,
  formatearDia,
  type Consulta,
  type Estado,
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

/** A qué estados se puede pasar desde cada uno, y con qué botón. */
const TRANSICIONES: Record<Estado, readonly EstadoDirecto[]> = {
  nuevo: ["contactado", "descartada"],
  contactado: ["nuevo", "descartada"],
  visita_agendada: ["ingreso", "descartada"],
  ingreso: ["contactado"],
  descartada: ["nuevo"],
};

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
  const [resNotas, enviarNotas, guardando] = useActionState(
    guardarNotas,
    estadoInicial,
  );

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
  const cerrada =
    consulta.estado === "ingreso" || consulta.estado === "descartada";
  const mostrarFormulario = (!agendada && !cerrada) || reprogramando;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">
            {consulta.nombre}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Prefiere que la llamen: {MOMENTOS_LLAMADO[consulta.momento_llamado]}
          </p>
        </div>
        <Badge className={COLORES_ESTADO[consulta.estado]}>
          {ETIQUETAS_ESTADO[consulta.estado]}
        </Badge>
      </div>

      <a
        href={`tel:${consulta.telefono.replace(/\s/g, "")}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-emerald-700"
      >
        <Phone className="h-4 w-4 text-slate-400" />
        {consulta.telefono}
      </a>

      {consulta.mensaje && (
        <p className="mt-4 whitespace-pre-wrap border-l-2 border-slate-200 pl-3 text-sm text-slate-600">
          {consulta.mensaje}
        </p>
      )}

      {/* ── Visita presencial ─────────────────────────────────────────── */}

      {agendada && consulta.visita_fecha && consulta.visita_franja && (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <CalendarCheck className="h-4 w-4 shrink-0" />
            <span>
              Visita el{" "}
              <span className="font-semibold">
                {formatearDia(consulta.visita_fecha)}
              </span>{" "}
              · {FRANJAS[consulta.visita_franja]}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 px-2.5 text-sm"
              onClick={() => setReprogramando((v) => !v)}
            >
              {reprogramando ? "No reprogramar" : "Reprogramar"}
            </Button>
            <form action={enviarCancelar}>
              <input type="hidden" name="id" value={consulta.id} />
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
        <form action={enviarAgenda} className="mt-5">
          <input type="hidden" name="id" value={consulta.id} />
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
        <form action={enviarEstado} className="flex flex-wrap gap-2">
          <input type="hidden" name="id" value={consulta.id} />
          {TRANSICIONES[consulta.estado].map((destino) => (
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
        {resEstado.error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {resEstado.error}
          </p>
        )}
      </div>

      {/* ── Notas internas ────────────────────────────────────────────── */}

      <form action={enviarNotas} className="mt-5">
        <input type="hidden" name="id" value={consulta.id} />
        <Label htmlFor={`notas-${consulta.id}`}>Notas internas</Label>
        <textarea
          id={`notas-${consulta.id}`}
          name="notas_internas"
          rows={2}
          defaultValue={consulta.notas_internas ?? ""}
          placeholder="Qué se habló, con quién, qué falta definir…"
          className={cn(
            "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none",
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

      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
        Recibida el {fechaHora.format(new Date(consulta.creado_en))} · origen{" "}
        {consulta.origen}
      </p>
    </Card>
  );
}
