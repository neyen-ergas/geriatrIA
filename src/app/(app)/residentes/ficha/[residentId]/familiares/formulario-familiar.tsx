"use client";

import { useActionState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import type { EstadoFamiliar, FamiliarEditable } from "@/lib/familiares";
import { guardarFamiliar } from "./actions";

export function FormularioFamiliar({ residenteId, contactoId, contacto }: {
  residenteId: string; contactoId: string; contacto: FamiliarEditable | null;
}): React.ReactElement {
  const inicial: EstadoFamiliar = { errores: {}, mensaje: null, valores: {
    first_name: contacto?.first_name ?? "", last_name: contacto?.last_name ?? "",
    relationship: contacto?.relationship ?? "", phone: contacto?.phone ?? "",
    notes: contacto?.notes ?? "",
    is_emergency_contact: contacto?.is_emergency_contact ?? false,
    is_payment_responsible: contacto?.is_payment_responsible ?? false,
  } };
  const [estado, accion, pendiente] = useActionState(
    guardarFamiliar.bind(null, residenteId, contactoId, contacto?.updated_at ?? null), inicial,
  );
  return <Card className="mt-5 p-5"><form action={accion}>
    <fieldset disabled={pendiente} className="grid gap-4 sm:grid-cols-2">
      <legend className="sr-only">Datos del contacto</legend>
      {([ ["first_name", "Nombre"], ["last_name", "Apellido"],
        ["relationship", "Parentesco o vínculo"], ["phone", "Teléfono"] ] as const)
        .map(([campo, etiqueta]) => <div key={campo}>
          <Label htmlFor={campo}>{etiqueta}</Label>
          <Input id={campo} name={campo} required
            type={campo === "phone" ? "tel" : "text"}
            defaultValue={estado.valores[campo]}
            aria-invalid={!!estado.errores[campo]}
            aria-describedby={estado.errores[campo] ? `${campo}-error` : undefined} />
          {estado.errores[campo] && <p id={`${campo}-error`}
            className="mt-1 text-sm text-red-700">{estado.errores[campo]}</p>}
        </div>)}
      <div className="space-y-3 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_emergency_contact"
            defaultChecked={estado.valores.is_emergency_contact} />
          Contacto de emergencia
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_payment_responsible"
            defaultChecked={estado.valores.is_payment_responsible} />
          Responsable de pago
        </label>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="notes">Observaciones (opcional)</Label>
        <textarea id="notes" name="notes" rows={4}
          defaultValue={estado.valores.notes}
          className="w-full rounded-lg border border-slate-300 p-3 text-sm" />
      </div>
    </fieldset>
    {estado.mensaje && <p role="alert" className="mt-4 text-sm text-red-700">
      {estado.mensaje}
    </p>}
    <Button type="submit" disabled={pendiente} className="mt-5">
      {pendiente ? "Guardando…" : "Guardar contacto"}
    </Button>
  </form></Card>;
}
