import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { enlaceEmpleados } from "@/lib/empleados";
import { listarEmpleados } from "@/lib/empleados-datos";
import { formatearFechaPago } from "@/lib/pagos";

export const metadata: Metadata = { title: "Empleados · geriatrIA" };
export default async function EmpleadosPage({ searchParams }: {
  searchParams: Promise<{ estado?: string | string[]; pagina?: string | string[] }>;
}): Promise<React.ReactElement> {
  await requerirSesion();
  const parametros = await searchParams;
  const bajas = parametros.estado === "bajas";
  const { empleados, total, pagina } = await listarEmpleados(bajas, parametros.pagina);
  return <div>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-slate-900">Empleados</h1><p className="mt-2 text-sm text-slate-600">Fichas del personal y sus datos laborales.</p></div>
      <Link href="/empleados/nuevo" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Registrar empleado</Link>
    </div>
    <nav aria-label="Estado del personal" className="mt-5 flex gap-4 text-sm text-sky-800">
      <Link href="/empleados" aria-current={!bajas ? "page" : undefined} className="underline">Activos</Link>
      <Link href="/empleados?estado=bajas" aria-current={bajas ? "page" : undefined} className="underline">Bajas</Link>
    </nav>
    <h2 className="mt-5 font-semibold">{bajas ? "Personal dado de baja" : "Personal activo"}</h2>
    {empleados.length === 0 && <Card className="mt-4 p-6 text-sm text-slate-600">No hay empleados en este grupo.</Card>}
    <ul className="mt-4 space-y-3">{empleados.map(empleado => <li key={empleado.id}><Card className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div><h3 className="font-semibold">{empleado.last_name}, {empleado.first_name}</h3>
        <p className="mt-1 text-sm text-slate-600">{empleado.job_title} · DNI {empleado.dni}</p>
        <p className="mt-1 text-xs text-slate-500">Alta {formatearFechaPago(empleado.hired_at)}{empleado.terminated_at && ` · Baja ${formatearFechaPago(empleado.terminated_at)}`}</p></div>
      <Link href={`/empleados/${empleado.id}`} className="text-sm font-medium text-sky-800 underline">Ver ficha</Link>
    </Card></li>)}</ul>
    <PaginacionListado pagina={pagina} total={total} etiqueta="empleados" anterior={enlaceEmpleados(pagina - 1, bajas)} siguiente={enlaceEmpleados(pagina + 1, bajas)} />
  </div>;
}
