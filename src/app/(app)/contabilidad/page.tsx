import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { listarCuentas } from "@/lib/pagos-datos";
import { listarCuotasSinCrear } from "@/lib/cuotas-sin-crear";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { enlaceContabilidad, formatearFechaPago } from "@/lib/pagos";
import { cn } from "@/lib/utils";
import { busquedaPersonas } from "@/lib/busqueda-personas";

export const metadata: Metadata = { title: "Contabilidad · geriatrIA" };

export default async function ContabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{
    estado?: string;
    pagina?: string | string[];
    buscar?: string | string[];
  }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.read");
  const parametros = await searchParams;
  const bajas = parametros.estado === "bajas";
  const busqueda = busquedaPersonas(parametros.buscar);
  const { cuentas, total, pagina } = await listarCuentas(
    bajas,
    parametros.pagina,
    busqueda,
  );
  let sinCrear = new Set<string>();
  let errorCuotas = false;
  if (!bajas) {
    try {
      sinCrear = new Set(
        (await listarCuotasSinCrear(hoyEnArgentina().slice(0, 7))).map(
          cuota => cuota.admissionId,
        ),
      );
    } catch {
      errorCuotas = true;
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Módulo Financiero
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Contabilidad
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Elegí una estadía para consultar sus cuotas, pagos acumulados y saldos.
          </p>
        </div>
        <Link
          href="/contabilidad/vencimientos"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98]"
        >
          Vencimientos del mes
        </Link>
      </div>

      {!bajas && (errorCuotas || sinCrear.size > 0) && (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900"
        >
          {errorCuotas
            ? "No pudimos comprobar si faltan cuotas por crear este mes. Revisá cada cuenta."
            : `${sinCrear.size} ${sinCrear.size === 1 ? "cuenta necesita" : "cuentas necesitan"} crear la cuota de este mes. Una cuota sin crear no aparece entre las vencidas.`}
        </p>
      )}

      <div>
        <nav
          aria-label="Estado de las estadías"
          className="inline-flex rounded-xl bg-slate-200/70 p-1 text-xs font-semibold shadow-inner"
        >
          {[false, true].map(finalizada => (
            <Link
              key={String(finalizada)}
              href={enlaceContabilidad(1, finalizada, busqueda)}
              aria-current={bajas === finalizada ? "page" : undefined}
              className={`rounded-lg px-4 py-2 transition-all ${
                bajas === finalizada
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {finalizada ? "Estadías finalizadas" : "Residentes activos"}
            </Link>
          ))}
        </nav>
      </div>

      <form
        action="/contabilidad"
        className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3"
      >
        {bajas && <input type="hidden" name="estado" value="bajas" />}
        <label className="flex-1 text-xs font-semibold text-slate-700">
          Buscar cuenta por nombre, apellido o DNI
          <input
            name="buscar"
            maxLength={80}
            defaultValue={busqueda}
            placeholder="Nombre o DNI"
            className="mt-1 block h-10 w-full min-w-0 rounded-lg border border-slate-300 px-3 text-sm"
          />
        </label>
        <button
          type="submit"
          className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
        >
          Buscar
        </button>
        {busqueda && (
          <Link
            href={enlaceContabilidad(1, bajas)}
            className="px-2 py-2 text-sm font-semibold text-emerald-800 underline"
          >
            Limpiar
          </Link>
        )}
      </form>

      <Card className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
        {cuentas.length === 0 ? (
          <p className="p-12 text-center text-sm text-slate-500">
            {busqueda
              ? `No encontramos cuentas para “${busqueda}”. Probá con otro nombre o DNI.`
              : `No hay estadías ${bajas ? "finalizadas" : "activas"} para consultar.`}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {cuentas.map(cuenta => (
              <li key={cuenta.id}>
                <Link
                  href={`/contabilidad/${cuenta.id}`}
                  className="group flex flex-wrap items-center justify-between gap-3 p-5 transition-colors hover:bg-slate-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-xs font-bold text-white shadow-sm ring-2 ring-emerald-50 group-hover:scale-105 transition-transform">
                      {cuenta.residents.last_name.slice(0, 1)}
                      {cuenta.residents.first_name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {cuenta.residents.last_name}, {cuenta.residents.first_name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        DNI {cuenta.residents.dni}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 font-medium">
                        Ingreso {formatearFechaPago(cuenta.admitted_at)}
                        {cuenta.discharged_at &&
                          ` · Baja ${formatearFechaPago(cuenta.discharged_at)}`}
                      </p>
                      {sinCrear.has(cuenta.id) && (
                        <p className="mt-2 text-xs font-bold text-amber-800">
                          Falta crear la cuota de este mes
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-700 shadow-2xs group-hover:border-emerald-300 group-hover:bg-emerald-50/50 group-hover:text-emerald-800 transition-all">
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
        anterior={enlaceContabilidad(pagina - 1, bajas, busqueda)}
        siguiente={enlaceContabilidad(pagina + 1, bajas, busqueda)}
      />
    </div>
  );
}
