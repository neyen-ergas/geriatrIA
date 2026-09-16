"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import type { EstadoEntrevista } from "@/lib/entrevistas";
import { cancelarEntrevistaAction, completarEntrevistaAction } from "../actions";

interface AccionesRapidasEntrevistaProps {
  id: string;
  estado: EstadoEntrevista;
}

export function AccionesRapidasEntrevista({
  id,
  estado,
}: AccionesRapidasEntrevistaProps) {
  const [isPending, startTransition] = useTransition();

  const handleCompletar = () => {
    if (!window.confirm("¿Marcar la entrevista como realizada?")) return;
    startTransition(async () => {
      await completarEntrevistaAction(id);
    });
  };

  const handleCancelar = () => {
    if (!window.confirm("¿Desea cancelar esta entrevista programada?")) return;
    startTransition(async () => {
      await cancelarEntrevistaAction(id);
    });
  };

  if (estado !== "scheduled") {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="md"
        disabled={isPending}
        onClick={handleCompletar}
        className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
      >
        ✓ Marcar realizada
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="md"
        disabled={isPending}
        onClick={handleCancelar}
        className="text-slate-500 hover:bg-rose-50 hover:text-rose-700"
      >
        Cancelar entrevista
      </Button>
    </div>
  );
}
