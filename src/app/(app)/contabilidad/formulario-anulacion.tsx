"use client";

import { useActionState, useId } from "react";
import { Button, Label, Textarea } from "@/components/ui";
import type { EstadoAnulacion } from "@/lib/anular-pagos";

export function FormularioAnulacion({ tipo, formAction }: {
  tipo: "pago" | "cuota";
  formAction: (anterior: EstadoAnulacion, datos: FormData) => Promise<EstadoAnulacion>;
}): React.ReactElement {
  const id = useId();
  const [estado, action, pendiente] = useActionState(formAction, {
    motivo: "", error: null,
  } as EstadoAnulacion);
  return (
    <details className="mt-4 rounded-lg border border-red-200 p-4">
      <summary className="cursor-pointer text-sm font-medium text-red-700">
        Anular {tipo === "pago" ? "pago" : "cuota"}
      </summary>
      <form action={action} className="mt-4 space-y-3">
        <p className="text-sm text-slate-600">
          {tipo === "pago"
            ? "El pago dejará de descontarse del saldo. Esta acción corrige el registro; no realiza una devolución de dinero."
            : "La cuota dejará de generar deuda. Su historial permanecerá disponible."}
        </p>
        {estado.error && <p role="alert" id={`${id}-error`} className="text-sm text-red-700">{estado.error}</p>}
        <fieldset disabled={pendiente || estado.bloqueado} className="space-y-3">
          <Label htmlFor={id}>Motivo de la anulación *</Label>
          <Textarea id={id} name="motivo" required defaultValue={estado.motivo}
            aria-describedby={estado.error ? `${id}-error` : undefined} />
          <Button type="submit" variant="danger">
            {pendiente ? "Anulando…" : `Confirmar anulación ${tipo === "pago" ? "del pago" : "de la cuota"}`}
          </Button>
        </fieldset>
        {estado.bloqueado && (
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Volver a cargar el detalle
          </Button>
        )}
      </form>
    </details>
  );
}
