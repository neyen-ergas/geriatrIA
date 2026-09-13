import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { requerirSesion } from "@/lib/auth";
import { obtenerEmpleado } from "@/lib/empleados-datos";
import { formatearFechaPago } from "@/lib/pagos";

export const metadata: Metadata = { title: "Ficha de empleado · geriatrIA" };
export default async function EmpleadoPage({ params }: { params: Promise<{ empleadoId: string }> }): Promise<React.ReactElement> {
  await requerirSesion();
  const empleado = await obtenerEmpleado((await params).empleadoId);
  if (!empleado) notFound();
  const campos = [
    ["DNI", empleado.dni], ["Puesto", empleado.job_title], ["Fecha de alta", formatearFechaPago(empleado.hired_at)],
    ["Nacimiento", empleado.birth_date ? formatearFechaPago(empleado.birth_date) : "Sin informar"],
    ["Teléfono", empleado.phone || "Sin informar"], ["Correo", empleado.email || "Sin informar"],
    ["Observaciones", empleado.notes || "Sin observaciones"],
    ...(empleado.terminated_at ? [["Fecha de baja", formatearFechaPago(empleado.terminated_at)], ["Motivo", empleado.termination_reason ?? ""]] : []),
  ];
  return <div className="mx-auto max-w-3xl">
    <Link href={empleado.terminated_at ? "/empleados?estado=bajas" : "/empleados"} className="text-sm text-sky-700">← Volver a Empleados</Link>
    <h1 className="mt-4 text-2xl font-bold">{empleado.last_name}, {empleado.first_name}</h1>
    <p className="mt-2 text-sm text-slate-600">{empleado.terminated_at ? "Baja · Ficha de consulta" : "Empleado activo"}</p>
    <Card className="mt-5 p-6"><dl className="grid gap-5 sm:grid-cols-2">{campos.map(([etiqueta, valor]) => <div key={etiqueta}>
      <dt className="text-xs font-medium text-slate-500">{etiqueta}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{valor}</dd>
    </div>)}</dl></Card>
    {!empleado.terminated_at && <nav className="mt-5 flex gap-5 text-sm font-medium">
      <Link href={`/empleados/${empleado.id}/editar`} className="text-sky-800 underline">Editar ficha</Link>
      <Link href={`/empleados/${empleado.id}/baja`} className="text-red-700 underline">Dar de baja</Link>
    </nav>}
  </div>;
}
