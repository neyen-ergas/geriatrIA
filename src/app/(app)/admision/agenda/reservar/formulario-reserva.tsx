"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui";
import type { CandidataVisita } from "@/lib/reserva-visita-datos";
import { reservarVisita } from "./actions";

export function FormularioReserva({
  consulta,
  fecha,
  franja,
}: {
  consulta: CandidataVisita;
  fecha: string;
  franja: string;
}): React.ReactElement {
  const [resultado, action, pendiente] = useActionState(
    reservarVisita.bind(null, fecha, franja),
    { ok: false, error: null },
  );
  return (
    <form action={action}>
      <input type="hidden" name="id" value={consulta.id} />
      <input type="hidden" name="estado_esperado" value={consulta.estado} />
      <input type="hidden" name="actualizado_en" value={consulta.actualizado_en} />
      <Button disabled={pendiente}>
        {pendiente ? "Reservando…" : "Reservar para esta familia"}
      </Button>
      {resultado.error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {resultado.error}
        </p>
      )}
    </form>
  );
}
