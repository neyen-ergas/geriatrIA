"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { Button, Card, Label } from "@/components/ui";
import type { Acceso } from "@/lib/accesos-datos";
import { ETIQUETAS_ROL, esRol } from "@/lib/permisos";
import { desvincularCuenta, vincularCuenta } from "./cuenta-actions";

const INICIAL = { error: null, ok: false };

export function CuentaEmpleado({ empleadoId, inactivo, cuentas }: {
  empleadoId: string; inactivo: boolean; cuentas: Acceso[];
}) {
  const vinculada = cuentas.find(cuenta => cuenta.employee_id === empleadoId);
  const disponibles = cuentas.filter(cuenta => !cuenta.employee_id && esRol(cuenta.role));
  return <Card className="mt-5 p-6">
    <h2 className="text-lg font-semibold">Cuenta de acceso</h2>
    {vinculada ? <CuentaVinculada key={`${vinculada.user_id}-${vinculada.updated_at}`} empleadoId={empleadoId} cuenta={vinculada} /> : <>
      <p className="mt-2 text-sm text-slate-600">Esta ficha no tiene una cuenta vinculada.</p>
      {!inactivo && <SelectorCuenta key={disponibles.map(cuenta => `${cuenta.user_id}-${cuenta.updated_at}`).join(",")} empleadoId={empleadoId} cuentas={disponibles} />}
      {inactivo && <p className="mt-3 text-sm text-slate-500">No se asignan cuentas nuevas a empleados dados de baja.</p>}
    </>}
    <Link href="/accesos" className="mt-4 inline-block text-sm text-sky-800 underline">Administrar perfiles y accesos</Link>
  </Card>;
}

function CuentaVinculada({ empleadoId, cuenta }: { empleadoId: string; cuenta: Acceso }) {
  const [estado, action, pendiente] = useActionState(
    desvincularCuenta.bind(null, empleadoId, cuenta.user_id, cuenta.updated_at), INICIAL,
  );
  return <>
    <p className="mt-2 break-all font-medium">{cuenta.email || "Cuenta sin correo"}</p>
    <p className="mt-1 text-sm text-slate-600">{esRol(cuenta.role) ? ETIQUETAS_ROL[cuenta.role] : "Sin perfil"} · {cuenta.enabled ? "Habilitada" : "Suspendida"}</p>
    {cuenta.enabled && <p className="mt-3 text-sm text-amber-800">Antes de dar de baja al empleado, suspendé esta cuenta desde Accesos.</p>}
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer text-slate-600 underline">Corregir vínculo</summary>
      <p className="my-3 text-slate-600">Desvincular separa la cuenta de esta ficha. No suspende el acceso ni cambia el perfil; el cambio queda registrado.</p>
      <form action={action}><Button type="submit" variant="outline" disabled={pendiente}>{pendiente ? "Guardando…" : "Desvincular cuenta"}</Button></form>
    </details>
    {estado.error && <p role="alert" className="mt-3 text-sm text-red-700">{estado.error}</p>}
  </>;
}

function SelectorCuenta({ empleadoId, cuentas }: { empleadoId: string; cuentas: Acceso[] }) {
  const id = useId();
  const [seleccion, setSeleccion] = useState("");
  const [estado, action, pendiente] = useActionState(vincularCuenta.bind(null, empleadoId), INICIAL);
  const cuenta = cuentas.find(candidata => candidata.user_id === seleccion);
  if (!cuentas.length) return <p className="mt-3 text-sm text-slate-600">No hay cuentas con perfil disponibles. Asigná primero un perfil desde Accesos; no hace falta habilitarlo para vincularlo.</p>;
  return <form action={action} className="mt-4">
    <p className="mb-3 text-sm text-slate-600">Elegí la cuenta de esta persona. Vincular no crea usuarios, no habilita el acceso ni cambia permisos.</p>
    <fieldset disabled={pendiente} className="space-y-3">
      <Label htmlFor={id}>Cuenta existente</Label>
      <select id={id} name="cuenta" required value={seleccion} onChange={evento => setSeleccion(evento.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
        <option value="">Elegir cuenta…</option>
        {cuentas.map(candidata => <option key={candidata.user_id} value={candidata.user_id}>{candidata.email || "Sin correo"} · {candidata.enabled ? "Habilitada" : "Suspendida"}</option>)}
      </select>
      <input type="hidden" name="version" value={cuenta?.updated_at || ""} />
      <Button type="submit" disabled={!cuenta}>Vincular cuenta</Button>
    </fieldset>
    {estado.error && <p role="alert" className="mt-3 text-sm text-red-700">{estado.error}</p>}
  </form>;
}
