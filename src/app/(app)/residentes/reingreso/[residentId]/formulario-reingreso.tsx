"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CircleDollarSign, LoaderCircle, LogIn } from "lucide-react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import type {
  EstadoReingreso,
  ValoresReingreso,
} from "@/lib/reingreso-residente";

type AccionReingreso = (
  estadoAnterior: EstadoReingreso,
  formData: FormData,
) => Promise<EstadoReingreso>;

function ErrorCampo({ id, mensaje }: { id: string; mensaje?: string }) {
  if (!mensaje) return null;

  return (
    <p id={id} className="mt-1.5 text-xs text-red-600">
      {mensaje}
    </p>
  );
}

function claseCampo(error?: string): string | undefined {
  return error
    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
    : undefined;
}

export function FormularioReingreso({
  formAction,
  hoy,
  ultimaBaja,
  valoresIniciales,
}: {
  formAction: AccionReingreso;
  hoy: string;
  ultimaBaja: string;
  valoresIniciales: Partial<ValoresReingreso>;
}) {
  const [estado, action, pendiente] = useActionState(
    formAction,
    {
      errores: {},
      mensaje: null,
      valores: { admitted_at: hoy, ...valoresIniciales },
    } satisfies EstadoReingreso,
  );

  return (
    <form action={action} className="mt-6 space-y-6" noValidate>
      {estado.mensaje && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {estado.mensaje}
        </div>
      )}

      <Card className="p-6">
        <h2 className="font-semibold text-slate-900">Nuevo ingreso</h2>
        <p className="mt-1 text-sm text-slate-500">
          Estos datos pertenecen a la nueva estadía. La ficha personal y los
          contactos existentes se conservan.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="admitted_at">Fecha de reingreso *</Label>
            <Input
              id="admitted_at"
              name="admitted_at"
              type="date"
              min={ultimaBaja}
              max={hoy}
              defaultValue={estado.valores.admitted_at ?? hoy}
              required
              aria-invalid={Boolean(estado.errores.admitted_at)}
              aria-describedby={
                estado.errores.admitted_at ? "admitted_at-error" : undefined
              }
              className={claseCampo(estado.errores.admitted_at)}
            />
            <ErrorCampo
              id="admitted_at-error"
              mensaje={estado.errores.admitted_at}
            />
          </div>

          <div>
            <Label htmlFor="room">Habitación</Label>
            <Input
              id="room"
              name="room"
              placeholder="Ej.: 12 A"
              defaultValue={estado.valores.room}
            />
          </div>

          <div>
            <Label htmlFor="monthly_fee">Cuota mensual (ARS) *</Label>
            <div className="relative">
              <CircleDollarSign className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <Input
                id="monthly_fee"
                name="monthly_fee"
                type="text"
                inputMode="decimal"
                placeholder="Ej.: 500000 o 500.000"
                defaultValue={estado.valores.monthly_fee}
                className={`${claseCampo(estado.errores.monthly_fee) ?? ""} pl-10`}
                required
                aria-invalid={Boolean(estado.errores.monthly_fee)}
                aria-describedby={
                  estado.errores.monthly_fee
                    ? "monthly_fee-error monthly_fee-help"
                    : "monthly_fee-help"
                }
              />
            </div>
            <ErrorCampo
              id="monthly_fee-error"
              mensaje={estado.errores.monthly_fee}
            />
            <p id="monthly_fee-help" className="mt-1.5 text-xs text-slate-500">
              Se propone la cuota anterior; confirmala o actualizala.
            </p>
          </div>

          <div>
            <Label htmlFor="due_day">Día de vencimiento *</Label>
            <Input
              id="due_day"
              name="due_day"
              type="number"
              min="1"
              max="31"
              step="1"
              defaultValue={estado.valores.due_day}
              required
              aria-invalid={Boolean(estado.errores.due_day)}
              aria-describedby={
                estado.errores.due_day ? "due_day-error" : undefined
              }
              className={claseCampo(estado.errores.due_day)}
            />
            <ErrorCampo
              id="due_day-error"
              mensaje={estado.errores.due_day}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="administrative_notes">
              Observaciones administrativas
            </Label>
            <Textarea
              id="administrative_notes"
              name="administrative_notes"
              rows={3}
              defaultValue={estado.valores.administrative_notes}
            />
          </div>
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/residentes?estado=bajas"
          className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Cancelar
        </Link>
        <Button type="submit" size="lg" disabled={pendiente}>
          {pendiente ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <LogIn className="h-5 w-5" />
          )}
          {pendiente ? "Registrando…" : "Confirmar reingreso"}
        </Button>
      </div>
    </form>
  );
}
