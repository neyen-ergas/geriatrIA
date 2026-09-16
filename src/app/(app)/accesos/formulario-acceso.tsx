"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import { Button, Card, Label } from "@/components/ui";
import { ETIQUETAS_ROL, ROLES, esRol } from "@/lib/permisos";
import type { Acceso } from "@/lib/accesos-datos";
import { guardarAcceso } from "./actions";

export function FormularioAcceso({ acceso }: { acceso: Acceso }) {
  const id = useId();
  const [estado, action, pendiente] = useActionState(
    guardarAcceso.bind(null, acceso.user_id, acceso.updated_at),
    { error: null, ok: false },
  );
  return (
    <Card className="p-5">
      <h2 className="break-all font-semibold">{acceso.email || "Cuenta sin correo"}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {esRol(acceso.role) ? ETIQUETAS_ROL[acceso.role] : "Sin perfil asignado"} ·{" "}
        {acceso.enabled ? "Habilitado" : "Sin acceso"}
      </p>
      {acceso.employee_id ? (
        <p className="mt-2 text-sm">
          Empleado:{" "}
          <Link
            href={`/empleados/${acceso.employee_id}`}
            className="text-sky-800 underline"
          >
            {acceso.employee_name}
          </Link>
          {acceso.employee_terminated_at && (
            <span className="ml-2 text-slate-500">· Dado de baja</span>
          )}
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          Sin ficha vinculada.{" "}
          <Link href="/empleados" className="underline">
            Vincular desde Empleados
          </Link>
        </p>
      )}
      <form action={action} className="mt-4">
        <fieldset disabled={pendiente} className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor={`${id}-rol`}>Perfil</Label>
            <select
              id={`${id}-rol`}
              name="rol"
              defaultValue={acceso.role || "readonly"}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              {ROLES.map(rol => (
                <option key={rol} value={rol}>
                  {ETIQUETAS_ROL[rol]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor={`${id}-estado`}>Acceso</Label>
            <select
              id={`${id}-estado`}
              name="habilitado"
              defaultValue={acceso.enabled ? "si" : "no"}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="si" disabled={Boolean(acceso.employee_terminated_at)}>
                Habilitado
              </option>
              <option value="no">Suspendido</option>
            </select>
          </div>
          <Button type="submit">{pendiente ? "Guardando…" : "Guardar acceso"}</Button>
        </fieldset>
        {acceso.employee_terminated_at && (
          <p className="mt-3 text-sm text-slate-600">
            La cuenta debe permanecer suspendida mientras esté vinculada a un empleado
            dado de baja.
          </p>
        )}
        {estado.error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {estado.error}
          </p>
        )}
        {estado.ok && (
          <p role="status" className="mt-3 text-sm text-emerald-700">
            Acceso guardado.
          </p>
        )}
      </form>
    </Card>
  );
}
