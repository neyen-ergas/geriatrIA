import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { enlaceEmpleados } from "@/lib/empleados";
import { listarEmpleados } from "@/lib/empleados-datos";
import { formatearFechaPago } from "@/lib/pagos";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Empleados · geriatrIA" };
export default async function EmpleadosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string | string[]; pagina?: string | string[] }>;
}): Promise<React.ReactElement> {
  await requerirSesion("administration");
  const parametros = await searchParams;
  const bajas = parametros.estado === "bajas";
  const { empleados, total, pagina } = await listarEmpleados(bajas, parametros.pagina);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Empleados
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Fichas del personal, roles profesionales y sus datos laborales.
          </p>
        </div>
        <Link
          href="/empleados/nuevo"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 hover:shadow-xs active:scale-[0.98]"
        >
          Registrar empleado
        </Link>
      </div>

      <nav aria-label="Estado del personal" className="flex gap-2">
        <Link
          href="/empleados"
          aria-current={!bajas ? "page" : undefined}
          className={cn(
            "rounded-xl px-4 py-2 text-xs font-semibold transition-all shadow-2xs",
            !bajas
              ? "bg-slate-900 text-white"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          )}
        >
          Activos
        </Link>
        <Link
          href="/empleados?estado=bajas"
          aria-current={bajas ? "page" : undefined}
          className={cn(
            "rounded-xl px-4 py-2 text-xs font-semibold transition-all shadow-2xs",
            bajas
              ? "bg-slate-900 text-white"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          )}
        >
          Bajas
        </Link>
      </nav>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">
          {bajas ? "Personal dado de baja" : "Personal activo"}
        </h2>
        <span className="text-xs font-medium text-slate-400 tabular-nums">
          {total} {total === 1 ? "registro" : "registros"}
        </span>
      </div>

      {empleados.length === 0 && (
        <Card className="flex min-h-48 flex-col items-center justify-center p-8 text-center text-sm text-slate-500 shadow-2xs">
          No hay empleados en este grupo.
        </Card>
      )}
      {empleados.length > 0 && (
        <Card className="overflow-hidden border border-slate-200/80 shadow-2xs">
          <ul className="divide-y divide-slate-100/80">
            {empleados.map(empleado => (
              <li key={empleado.id}>
                <Link
                  href={`/empleados/${empleado.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-5 transition-colors hover:bg-slate-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 shadow-2xs">
                      {empleado.first_name.slice(0, 1)}
                      {empleado.last_name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {empleado.last_name}, {empleado.first_name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {empleado.job_title} · DNI {empleado.dni}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Ingreso {formatearFechaPago(empleado.hired_at)}
                        {empleado.terminated_at &&
                          ` · Baja ${formatearFechaPago(empleado.terminated_at)}`}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 shadow-2xs hover:border-slate-300 hover:text-sky-950 transition-all">
                    Ver ficha →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <PaginacionListado
        pagina={pagina}
        total={total}
        etiqueta="empleados"
        anterior={enlaceEmpleados(pagina - 1, bajas)}
        siguiente={enlaceEmpleados(pagina + 1, bajas)}
      />
    </div>
  );
}
