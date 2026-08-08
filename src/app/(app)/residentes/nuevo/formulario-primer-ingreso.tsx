"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  Building2,
  CircleDollarSign,
  ContactRound,
  LoaderCircle,
  Save,
  UserRound,
} from "lucide-react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import {
  type EstadoFormularioIngreso,
  type ValoresPrimerIngreso,
} from "@/lib/primer-ingreso";

type AccionFormularioIngreso = (
  estadoAnterior: EstadoFormularioIngreso,
  formData: FormData,
) => Promise<EstadoFormularioIngreso>;

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

export function FormularioPrimerIngreso({
  hoy,
  formAction,
  modo = "crear",
  valoresIniciales = {},
}: {
  hoy: string;
  formAction: AccionFormularioIngreso;
  modo?: "crear" | "editar";
  valoresIniciales?: Partial<ValoresPrimerIngreso>;
}) {
  const [estado, action, pendiente] = useActionState(
    formAction,
    {
      errores: {},
      mensaje: null,
      valores: { admitted_at: hoy, ...valoresIniciales },
    } satisfies EstadoFormularioIngreso,
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
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Datos personales</h2>
            <p className="mt-1 text-sm text-slate-500">
              Información propia de la persona que permanecerá en su ficha.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="resident_first_name">Nombre *</Label>
            <Input
              id="resident_first_name"
              name="resident_first_name"
              defaultValue={estado.valores.resident_first_name}
              required
              aria-invalid={Boolean(estado.errores.resident_first_name)}
              aria-describedby={
                estado.errores.resident_first_name
                  ? "resident_first_name-error"
                  : undefined
              }
              className={claseCampo(estado.errores.resident_first_name)}
            />
            <ErrorCampo
              id="resident_first_name-error"
              mensaje={estado.errores.resident_first_name}
            />
          </div>

          <div>
            <Label htmlFor="resident_last_name">Apellido *</Label>
            <Input
              id="resident_last_name"
              name="resident_last_name"
              defaultValue={estado.valores.resident_last_name}
              required
              aria-invalid={Boolean(estado.errores.resident_last_name)}
              aria-describedby={
                estado.errores.resident_last_name
                  ? "resident_last_name-error"
                  : undefined
              }
              className={claseCampo(estado.errores.resident_last_name)}
            />
            <ErrorCampo
              id="resident_last_name-error"
              mensaje={estado.errores.resident_last_name}
            />
          </div>

          <div>
            <Label htmlFor="resident_dni">DNI *</Label>
            <Input
              id="resident_dni"
              name="resident_dni"
              defaultValue={estado.valores.resident_dni}
              inputMode="numeric"
              required
              aria-invalid={Boolean(estado.errores.resident_dni)}
              aria-describedby={
                estado.errores.resident_dni ? "resident_dni-error" : undefined
              }
              className={claseCampo(estado.errores.resident_dni)}
            />
            <ErrorCampo
              id="resident_dni-error"
              mensaje={estado.errores.resident_dni}
            />
          </div>

          <div>
            <Label htmlFor="resident_birth_date">Fecha de nacimiento *</Label>
            <Input
              id="resident_birth_date"
              name="resident_birth_date"
              type="date"
              defaultValue={estado.valores.resident_birth_date}
              max={hoy}
              required
              aria-invalid={Boolean(estado.errores.resident_birth_date)}
              aria-describedby={
                estado.errores.resident_birth_date
                  ? "resident_birth_date-error"
                  : undefined
              }
              className={claseCampo(estado.errores.resident_birth_date)}
            />
            <ErrorCampo
              id="resident_birth_date-error"
              mensaje={estado.errores.resident_birth_date}
            />
          </div>

          <div>
            <Label htmlFor="resident_phone">Teléfono</Label>
            <Input
              id="resident_phone"
              name="resident_phone"
              type="tel"
              defaultValue={estado.valores.resident_phone}
            />
          </div>

          <div>
            <Label htmlFor="resident_address">Domicilio anterior</Label>
            <Input
              id="resident_address"
              name="resident_address"
              defaultValue={estado.valores.resident_address}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="resident_notes">Observaciones generales</Label>
            <Textarea
              id="resident_notes"
              name="resident_notes"
              rows={3}
              defaultValue={estado.valores.resident_notes}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              No incluyas indicaciones médicas; tendrán su sección específica.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <ContactRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Contacto familiar</h2>
            <p className="mt-1 text-sm text-slate-500">
              Para el primer ingreso necesitamos al menos una persona de contacto.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="contact_first_name">Nombre *</Label>
            <Input
              id="contact_first_name"
              name="contact_first_name"
              defaultValue={estado.valores.contact_first_name}
              required
              aria-invalid={Boolean(estado.errores.contact_first_name)}
              aria-describedby={
                estado.errores.contact_first_name
                  ? "contact_first_name-error"
                  : undefined
              }
              className={claseCampo(estado.errores.contact_first_name)}
            />
            <ErrorCampo
              id="contact_first_name-error"
              mensaje={estado.errores.contact_first_name}
            />
          </div>

          <div>
            <Label htmlFor="contact_last_name">Apellido *</Label>
            <Input
              id="contact_last_name"
              name="contact_last_name"
              defaultValue={estado.valores.contact_last_name}
              required
              aria-invalid={Boolean(estado.errores.contact_last_name)}
              aria-describedby={
                estado.errores.contact_last_name
                  ? "contact_last_name-error"
                  : undefined
              }
              className={claseCampo(estado.errores.contact_last_name)}
            />
            <ErrorCampo
              id="contact_last_name-error"
              mensaje={estado.errores.contact_last_name}
            />
          </div>

          <div>
            <Label htmlFor="contact_relationship">Vínculo *</Label>
            <Input
              id="contact_relationship"
              name="contact_relationship"
              defaultValue={estado.valores.contact_relationship}
              placeholder="Ej.: hija, hermano, apoderada"
              required
              aria-invalid={Boolean(estado.errores.contact_relationship)}
              aria-describedby={
                estado.errores.contact_relationship
                  ? "contact_relationship-error"
                  : undefined
              }
              className={claseCampo(estado.errores.contact_relationship)}
            />
            <ErrorCampo
              id="contact_relationship-error"
              mensaje={estado.errores.contact_relationship}
            />
          </div>

          <div>
            <Label htmlFor="contact_phone">Teléfono *</Label>
            <Input
              id="contact_phone"
              name="contact_phone"
              type="tel"
              defaultValue={estado.valores.contact_phone}
              required
              aria-invalid={Boolean(estado.errores.contact_phone)}
              aria-describedby={
                estado.errores.contact_phone
                  ? "contact_phone-error"
                  : undefined
              }
              className={claseCampo(estado.errores.contact_phone)}
            />
            <ErrorCampo
              id="contact_phone-error"
              mensaje={estado.errores.contact_phone}
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="contact_is_emergency_contact"
                defaultChecked={estado.valores.contact_is_emergency_contact}
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
              />
              Es contacto de emergencia
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="contact_is_payment_responsible"
                defaultChecked={
                  estado.valores.contact_is_payment_responsible
                }
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
              />
              Es responsable del pago
            </label>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="contact_notes">Observaciones del contacto</Label>
            <Textarea
              id="contact_notes"
              name="contact_notes"
              rows={3}
              defaultValue={estado.valores.contact_notes}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Datos del ingreso</h2>
            <p className="mt-1 text-sm text-slate-500">
              Condiciones administrativas acordadas para esta estadía.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="admitted_at">Fecha de ingreso *</Label>
            <Input
              id="admitted_at"
              name="admitted_at"
              type="date"
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
              Podés usar formato argentino, con puntos de miles y coma decimal.
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
          href="/residentes"
          className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Cancelar
        </Link>
        <Button type="submit" size="lg" disabled={pendiente}>
          {pendiente ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {pendiente
            ? "Guardando…"
            : modo === "editar"
              ? "Guardar cambios"
              : "Registrar ingreso"}
        </Button>
      </div>
    </form>
  );
}
