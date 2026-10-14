import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { enlaceEmpleados } from "@/lib/empleados";
import { busquedaPersonas } from "@/lib/busqueda-personas";
import { listarEmpleados } from "@/lib/empleados-datos";
import { formatearFechaPago } from "@/lib/pagos";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Empleados · geriatrIA" };
export default async function EmpleadosPage({
  searchParams,
}: {
  searchParams: Promise<{
    estado?: string | string[];
    pagina?: string | string[];
    buscar?: string | string[];
  }>;
}): Promise<React.ReactElement> {
  await requerirSesion("administration");
  const parametros = await searchParams;
  const bajas = parametros.estado === "bajas";
  const busqueda = busquedaPersonas(parametros.buscar);
  const { empleados, total, pagina } = await listarEmpleados(
    bajas,
    parametros.pagina,
    busqueda,
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-piedra-950">Empleados</h1>
          <p className="mt-1 text-base text-piedra-700">
            Fichas del personal, roles profesionales y sus datos laborales.
          </p>
        </div>
        <Link
          href="/empleados/nuevo"
          className="min-h-11 inline-flex items-center justify-center gap-2 rounded-md bg-casona-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-casona-800"
        >
          Registrar empleado
        </Link>
      </div>

      <nav aria-label="Estado del personal" className="flex gap-2">
        <Link
          href={enlaceEmpleados(1, false, busqueda)}
          aria-current={!bajas ? "page" : undefined}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
            !bajas
              ? "bg-ocre-300 text-casona-950"
              : "bg-white border border-piedra-200/80 text-piedra-600 hover:bg-piedra-50 hover:text-piedra-900",
          )}
        >
          Activos
        </Link>
        <Link
          href={enlaceEmpleados(1, true, busqueda)}
          aria-current={bajas ? "page" : undefined}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
            bajas
              ? "bg-ocre-300 text-casona-950"
              : "bg-white border border-piedra-200/80 text-piedra-600 hover:bg-piedra-50 hover:text-piedra-900",
          )}
        >
          Bajas
        </Link>
      </nav>

      <form
        action="/empleados"
        className="flex flex-wrap items-end gap-2 rounded-md border border-piedra-200 bg-white p-3"
      >
        {bajas && <input type="hidden" name="estado" value="bajas" />}
        <label className="flex-1 text-sm font-semibold text-piedra-700">
          Buscar empleado por nombre, apellido o DNI
          <input
            name="buscar"
            maxLength={80}
            defaultValue={busqueda}
            placeholder="Nombre o DNI"
            className="mt-1 block h-10 w-full min-w-0 rounded-md border border-piedra-300 px-3 text-sm"
          />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-casona-700 px-4 text-sm font-semibold text-white"
        >
          Buscar
        </button>
        {busqueda && (
          <Link
            href={enlaceEmpleados(1, bajas)}
            className="px-2 py-2 text-sm font-semibold text-casona-800 underline"
          >
            Limpiar
          </Link>
        )}
      </form>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-piedra-900">
          {bajas ? "Personal dado de baja" : "Personal activo"}
        </h2>
        <span className="text-sm font-medium text-piedra-500 tabular-nums">
          {total} {total === 1 ? "registro" : "registros"}
        </span>
      </div>

      {empleados.length === 0 && (
        <Card className="flex min-h-48 flex-col items-center justify-center p-8 text-center text-sm text-piedra-500">
          {busqueda
            ? `No encontramos empleados para “${busqueda}”. Probá con otro nombre o DNI.`
            : "No hay empleados en este grupo."}
        </Card>
      )}
      {empleados.length > 0 && (
        <Card className="overflow-hidden border border-piedra-200/80">
          <ul className="divide-y divide-piedra-100/80">
            {empleados.map(empleado => (
              <li key={empleado.id}>
                <Link
                  href={`/empleados/${empleado.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-5 transition-colors hover:bg-piedra-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-piedra-900"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-piedra-100 text-sm font-bold text-piedra-700">
                      {empleado.first_name.slice(0, 1)}
                      {empleado.last_name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="font-bold text-piedra-900 text-sm">
                        {empleado.last_name}, {empleado.first_name}
                      </p>
                      <p className="mt-0.5 text-sm text-piedra-500">
                        {empleado.job_title} · DNI {empleado.dni}
                      </p>
                      <p className="mt-1 text-sm text-piedra-500">
                        Ingreso {formatearFechaPago(empleado.hired_at)}
                        {empleado.terminated_at &&
                          ` · Baja ${formatearFechaPago(empleado.terminated_at)}`}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-piedra-200/90 bg-white px-3 py-1.5 text-sm font-semibold text-cobalto-800 hover:border-piedra-300 hover:text-cobalto-950 transition-colors">
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
        anterior={enlaceEmpleados(pagina - 1, bajas, busqueda)}
        siguiente={enlaceEmpleados(pagina + 1, bajas, busqueda)}
      />
    </div>
  );
}
