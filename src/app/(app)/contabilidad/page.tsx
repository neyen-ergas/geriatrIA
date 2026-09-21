import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { listarCuentas } from "@/lib/pagos-datos";
import { enlaceContabilidad, formatearFechaPago } from "@/lib/pagos";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Contabilidad · geriatrIA" };

export default async function ContabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; pagina?: string | string[] }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.read");
  const parametros = await searchParams;
  const bajas = parametros.estado === "bajas";
  const { cuentas, total, pagina } = await listarCuentas(bajas, parametros.pagina);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Contabilidad</h1>
          <p className="mt-1 text-sm text-slate-500">
            Elegí una estadía para consultar sus cuotas, pagos acumulados y saldos.
          </p>
        </div>
        <Link
          href="/contabilidad/vencimientos"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 hover:shadow-xs active:scale-[0.98]"
        >
          Vencimientos del mes
        </Link>
      </div>

      <nav aria-label="Estado de las estadías" className="flex gap-2">
        {[false, true].map(finalizada => (
          <Link
            key={String(finalizada)}
            href={enlaceContabilidad(1, finalizada)}
            aria-current={bajas === finalizada ? "page" : undefined}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-semibold transition-all shadow-2xs",
              bajas === finalizada
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            {finalizada ? "Estadías finalizadas" : "Residentes activos"}
          </Link>
        ))}
      </nav>

      <Card className="overflow-hidden border border-slate-200/80 shadow-2xs">
        {cuentas.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">
            No hay estadías {bajas ? "finalizadas" : "activas"} para consultar.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100/80">
            {cuentas.map(cuenta => (
              <li key={cuenta.id}>
                <Link
                  href={`/contabilidad/${cuenta.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-5 transition-colors hover:bg-slate-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-700 text-xs shadow-2xs">
                      {cuenta.residents.last_name.slice(0, 1)}
                      {cuenta.residents.first_name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {cuenta.residents.last_name}, {cuenta.residents.first_name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        DNI {cuenta.residents.dni}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Ingreso {formatearFechaPago(cuenta.admitted_at)}
                        {cuenta.discharged_at &&
                          ` · Baja ${formatearFechaPago(cuenta.discharged_at)}`}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 shadow-2xs hover:border-slate-300 hover:text-sky-950 transition-all">
                    Ver cuenta →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <PaginacionListado
        pagina={pagina}
        total={total}
        etiqueta="cuentas"
        anterior={enlaceContabilidad(pagina - 1, bajas)}
        siguiente={enlaceContabilidad(pagina + 1, bajas)}
      />
    </div>
  );
}
