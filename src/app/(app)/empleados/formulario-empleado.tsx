"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import type { CampoEmpleado, EstadoEmpleado } from "@/lib/empleados";

const CAMPOS: {
  campo: CampoEmpleado;
  etiqueta: string;
  tipo?: string;
  obligatorio?: boolean;
  maximo?: number;
}[] = [
  { campo: "first_name", etiqueta: "Nombre", obligatorio: true, maximo: 80 },
  { campo: "last_name", etiqueta: "Apellido", obligatorio: true, maximo: 80 },
  { campo: "dni", etiqueta: "DNI", obligatorio: true, maximo: 40 },
  { campo: "birth_date", etiqueta: "Fecha de nacimiento (opcional)", tipo: "date" },
  { campo: "phone", etiqueta: "Teléfono (opcional)", tipo: "tel", maximo: 40 },
  { campo: "email", etiqueta: "Correo (opcional)", tipo: "email", maximo: 254 },
  { campo: "job_title", etiqueta: "Puesto o función", obligatorio: true, maximo: 100 },
  { campo: "hired_at", etiqueta: "Fecha de alta", tipo: "date", obligatorio: true },
];

export function FormularioEmpleado({
  action,
  valores,
  hoy,
  volver,
  baja = false,
}: {
  action: (previo: EstadoEmpleado, datos: FormData) => Promise<EstadoEmpleado>;
  valores: EstadoEmpleado["valores"];
  hoy: string;
  volver: string;
  baja?: boolean;
}): React.ReactElement {
  const [estado, enviar, pendiente] = useActionState(action, {
    valores,
    errores: {},
    mensaje: null,
  } satisfies EstadoEmpleado);
  return (
    <form action={enviar} noValidate className="mt-6 space-y-5">
      {estado.mensaje && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {estado.mensaje}
        </p>
      )}
      <Card className="grid gap-5 p-6 sm:grid-cols-2">
        {(baja
          ? [
              {
                campo: "terminated_at" as const,
                etiqueta: "Fecha de baja",
                tipo: "date",
                obligatorio: true,
              },
            ]
          : CAMPOS
        ).map(campo => (
          <div key={campo.campo}>
            <Label htmlFor={campo.campo}>{campo.etiqueta}</Label>
            <Input
              id={campo.campo}
              name={campo.campo}
              type={campo.tipo ?? "text"}
              required={campo.obligatorio}
              maxLength={"maximo" in campo ? campo.maximo : undefined}
              max={campo.tipo === "date" ? hoy : undefined}
              min={campo.campo === "terminated_at" ? valores.hired_at : undefined}
              defaultValue={estado.valores[campo.campo] ?? ""}
              aria-invalid={Boolean(estado.errores[campo.campo])}
              aria-describedby={
                estado.errores[campo.campo] ? `${campo.campo}-error` : undefined
              }
            />
            {estado.errores[campo.campo] && (
              <p id={`${campo.campo}-error`} className="mt-1 text-sm text-red-700">
                {estado.errores[campo.campo]}
              </p>
            )}
          </div>
        ))}
        <div className="sm:col-span-2">
          <Label htmlFor={baja ? "termination_reason" : "notes"}>
            {baja ? "Motivo de la baja" : "Observaciones (opcional)"}
          </Label>
          <Textarea
            id={baja ? "termination_reason" : "notes"}
            name={baja ? "termination_reason" : "notes"}
            defaultValue={estado.valores[baja ? "termination_reason" : "notes"] ?? ""}
            required={baja}
            maxLength={baja ? 1000 : 2000}
            rows={3}
            aria-describedby="notas-error"
          />
          <p id="notas-error" className="mt-1 text-sm text-red-700">
            {estado.errores[baja ? "termination_reason" : "notes"]}
          </p>
        </div>
      </Card>
      {baja && (
        <p className="text-sm text-slate-600">
          La ficha quedará guardada en Bajas y será solo de consulta.
        </p>
      )}
      <div className="flex items-center gap-4">
        <Button disabled={pendiente} variant={baja ? "danger" : "primary"}>
          {pendiente ? "Guardando…" : baja ? "Confirmar baja" : "Guardar empleado"}
        </Button>
        <Link href={volver} className="text-sm underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
