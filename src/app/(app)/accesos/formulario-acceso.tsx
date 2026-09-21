"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import { Button, Card, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
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
    <Card className="p-6 transition-all hover:border-slate-300/80 shadow-2xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="break-all text-base font-bold text-slate-900">{acceso.email || "Cuenta sin correo"}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {esRol(acceso.role) ? ETIQUETAS_ROL[acceso.role] : "Sin perfil asignado"}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border shadow-2xs",
            acceso.enabled
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
              : "bg-slate-100 text-slate-600 border-slate-200/80",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              acceso.enabled ? "bg-emerald-500" : "bg-slate-400",
            )}
          />
          {acceso.enabled ? "Habilitado" : "Sin acceso"}
        </span>
      </div>

      {acceso.employee_id ? (
        <p className="mt-3 text-xs text-slate-600">
          Empleado:{" "}
          <Link
            href={`/empleados/${acceso.employee_id}`}
            className="font-semibold text-sky-800 hover:text-sky-950 underline"
          >
            {acceso.employee_name}
          </Link>
          {acceso.employee_terminated_at && (
            <span className="ml-2 text-rose-600 font-medium">· Dado de baja</span>
          )}
        </p>
      ) : (
        <p className="mt-3 text-xs text-slate-400">
          Sin ficha vinculada.{" "}
          <Link href="/empleados" className="text-sky-700 underline font-medium">
            Vincular desde Empleados
          </Link>
        </p>
      )}
      <form action={action} className="mt-5 border-t border-slate-100 pt-4">
        <fieldset disabled={pendiente} className="flex flex-wrap items-end gap-3.5">
          <div>
            <Label htmlFor={`${id}-rol`}>Perfil</Label>
            <select
              id={`${id}-rol`}
              name="rol"
              defaultValue={acceso.role || "readonly"}
              className="h-10 rounded-xl border border-slate-200/90 bg-white/90 px-3.5 text-xs text-slate-900 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
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
              className="h-10 rounded-xl border border-slate-200/90 bg-white/90 px-3.5 text-xs text-slate-900 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
            >
              <option value="si" disabled={Boolean(acceso.employee_terminated_at)}>
                Habilitado
              </option>
              <option value="no">Suspendido</option>
            </select>
          </div>
          <Button type="submit" disabled={pendiente} className="h-10">
            {pendiente ? "Guardando…" : "Guardar acceso"}
          </Button>
        </fieldset>
        {acceso.employee_terminated_at && (
          <p className="mt-3 text-xs text-slate-500">
            La cuenta debe permanecer suspendida mientras esté vinculada a un empleado
            dado de baja.
          </p>
        )}
        {estado.error && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {estado.error}
          </p>
        )}
        {estado.ok && (
          <p role="status" className="mt-3 text-xs text-emerald-700">
            Acceso guardado.
          </p>
        )}
      </form>
    </Card>
  );
}
