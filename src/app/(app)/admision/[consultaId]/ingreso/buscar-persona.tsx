"use client";

import { useActionState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { buscarPersonaIngreso } from "./actions";

export function BuscarPersona({
  consultaId,
}: {
  consultaId: string;
}): React.ReactElement {
  const [estado, action, pendiente] = useActionState(
    buscarPersonaIngreso.bind(null, consultaId),
    { error: null },
  );
  return (
    <Card className="mt-6 p-5">
      <h2 className="font-semibold text-slate-900">¿La persona ya tiene ficha?</h2>
      <form action={action} className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="buscar-dni">DNI del residente</Label>
          <Input id="buscar-dni" name="dni" required />
        </div>
        <Button variant="outline" disabled={pendiente}>
          {pendiente ? "Buscando…" : "Buscar ficha existente"}
        </Button>
      </form>
      {estado.error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {estado.error}
        </p>
      )}
    </Card>
  );
}
