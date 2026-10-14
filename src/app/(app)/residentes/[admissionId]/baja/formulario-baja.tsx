"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import type { EstadoBajaResidente } from "@/lib/baja-residente";

type AccionBaja = (
  estadoAnterior: EstadoBajaResidente,
  formData: FormData,
) => Promise<EstadoBajaResidente>;

function ErrorCampo({ id, mensaje }: { id: string; mensaje?: string }) {
  if (!mensaje) return null;

  return (
    <p id={id} className="mt-1.5 text-sm text-oxido-600">
      {mensaje}
    </p>
  );
}

export function FormularioBaja({
  formAction,
  hoy,
}: {
  formAction: AccionBaja;
  hoy: string;
}) {
  const [estado, action, pendiente] = useActionState(formAction, {
    errores: {},
    mensaje: null,
    valores: { discharged_at: hoy },
  } satisfies EstadoBajaResidente);

  return (
    <form action={action} className="mt-6 space-y-6" noValidate>
      {estado.mensaje && (
        <div
          role="alert"
          className="rounded-md border border-oxido-200 bg-oxido-50 px-4 py-3 text-sm text-oxido-700"
        >
          {estado.mensaje}
        </div>
      )}

      <Card className="p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="discharged_at">Fecha de baja *</Label>
            <Input
              id="discharged_at"
              name="discharged_at"
              type="date"
              max={hoy}
              defaultValue={estado.valores.discharged_at ?? hoy}
              required
              aria-invalid={Boolean(estado.errores.discharged_at)}
              aria-describedby={
                estado.errores.discharged_at ? "discharged_at-error" : undefined
              }
              className={
                estado.errores.discharged_at
                  ? "border-oxido-300 focus:border-oxido-500 focus:ring-oxido-100"
                  : undefined
              }
            />
            <ErrorCampo id="discharged_at-error" mensaje={estado.errores.discharged_at} />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="discharge_reason">Motivo de la baja *</Label>
            <Textarea
              id="discharge_reason"
              name="discharge_reason"
              rows={4}
              placeholder="Explicá brevemente por qué finaliza el ingreso"
              defaultValue={estado.valores.discharge_reason}
              required
              aria-invalid={Boolean(estado.errores.discharge_reason)}
              aria-describedby={
                estado.errores.discharge_reason ? "discharge_reason-error" : undefined
              }
              className={
                estado.errores.discharge_reason
                  ? "border-oxido-300 focus:border-oxido-500 focus:ring-oxido-100"
                  : undefined
              }
            />
            <ErrorCampo
              id="discharge_reason-error"
              mensaje={estado.errores.discharge_reason}
            />
          </div>
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/residentes"
          className="inline-flex h-12 items-center justify-center rounded-md border border-piedra-300 bg-white px-6 text-base font-medium text-piedra-700 transition-colors hover:bg-piedra-50"
        >
          Cancelar
        </Link>
        <Button type="submit" size="lg" variant="danger" disabled={pendiente}>
          {pendiente ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          {pendiente ? "Registrando…" : "Confirmar baja"}
        </Button>
      </div>
    </form>
  );
}
