import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { listarCuentas } from "@/lib/pagos-datos";
import { enlaceContabilidad, formatearFechaPago } from "@/lib/pagos";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Contabilidad · geriatrIA" };

export default async function ContabilidadPage({ searchParams }: {
  searchParams: Promise<{ estado?: string; pagina?: string | string[] }>;
}): Promise<React.ReactElement> {
  await requerirSesion();
  const parametros = await searchParams;
  const bajas = parametros.estado === "bajas";
  const { cuentas, total, pagina } = await listarCuentas(bajas, parametros.pagina);
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Contabilidad</h1>
      <p className="mt-1 text-sm text-slate-500">
        Elegí una estadía para consultar sus cuotas, pagos acumulados y saldos.
      </p>
      <nav aria-label="Estado de las estadías" className="mt-6 flex gap-2">
        {[false, true].map(finalizada => (
          <Link key={String(finalizada)} href={enlaceContabilidad(1, finalizada)}
            aria-current={bajas === finalizada ? "page" : undefined}
            className={cn("rounded-lg px-4 py-2 text-sm font-medium",
              bajas === finalizada ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600")}
          >{finalizada ? "Estadías finalizadas" : "Residentes activos"}</Link>
        ))}
      </nav>
      <Card className="mt-4 overflow-hidden">
        {cuentas.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No hay estadías {bajas ? "finalizadas" : "activas"} para consultar.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {cuentas.map(cuenta => (
              <li key={cuenta.id}>
                <Link href={`/contabilidad/${cuenta.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-5 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {cuenta.residents.last_name}, {cuenta.residents.first_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">DNI {cuenta.residents.dni}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Ingreso {formatearFechaPago(cuenta.admitted_at)}
                      {cuenta.discharged_at && ` · Baja ${formatearFechaPago(cuenta.discharged_at)}`}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-sky-700">Ver cuenta →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <PaginacionListado pagina={pagina} total={total} etiqueta="cuentas"
        anterior={enlaceContabilidad(pagina - 1, bajas)}
        siguiente={enlaceContabilidad(pagina + 1, bajas)} />
    </div>
  );
}
