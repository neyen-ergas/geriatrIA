"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import type { EstadoEntrevista } from "@/lib/entrevistas";
import {
  cancelarEntrevistaAction,
  completarEntrevistaAction,
  type ResultadoEntrevista,
} from "../actions";

type AccionesRapidasEntrevistaProps = {
  id: string;
  estado: EstadoEntrevista;
  version: string;
};

export function AccionesRapidasEntrevista({
  id,
  estado,
  version,
}: AccionesRapidasEntrevistaProps): React.ReactElement | null {
  const [pendiente, iniciarTransicion] = useTransition();
  const [resultado, setResultado] = useState<ResultadoEntrevista | null>(null);
  const [versionEnviada, setVersionEnviada] = useState<string | null>(null);

  const cambiarEstado = (destino: "completed" | "cancelled") => {
    const confirmacion =
      destino === "completed"
        ? "¿Marcar la entrevista como realizada?"
        : "¿Desea cancelar esta entrevista programada?";
    if (!window.confirm(confirmacion)) return;
    setResultado(null);
    setVersionEnviada(version);
    iniciarTransicion(async () => {
      try {
        const accion =
          destino === "completed" ? completarEntrevistaAction : cancelarEntrevistaAction;
        setResultado(await accion(id, version));
      } catch {
        setResultado({
          ok: false,
          error:
            "No pudimos confirmar el cambio. Recargá la entrevista para comprobar su estado antes de reintentar.",
        });
      }
    });
  };

  if (estado !== "scheduled" && !resultado) return null;

  return (
    <div className="space-y-2" aria-busy={pendiente}>
      {estado === "scheduled" && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={pendiente || (resultado?.ok && versionEnviada === version)}
            onClick={() => cambiarEstado("completed")}
            className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            ✓ Marcar realizada
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={pendiente || (resultado?.ok && versionEnviada === version)}
            onClick={() => cambiarEstado("cancelled")}
            className="text-slate-500 hover:bg-rose-50 hover:text-rose-700"
          >
            Cancelar entrevista
          </Button>
        </div>
      )}
      {pendiente && (
        <p role="status" className="text-sm">
          Guardando cambio…
        </p>
      )}
      {resultado?.ok && (
        <p role="status" className="text-sm text-emerald-700">
          {resultado.mensaje}
        </p>
      )}
      {resultado?.error && (
        <div role="alert" className="text-sm text-rose-700">
          <p>{resultado.error}</p>
          <a href={`/entrevistas/${id}`} className="underline">
            Recargar entrevista
          </a>
        </div>
      )}
    </div>
  );
}
