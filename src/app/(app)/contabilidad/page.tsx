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
          <h1 className="text-3xl font-bold text-piedra-950">Contabilidad</h1>
          <p className="mt-1 text-base text-piedra-700">
            Elegí una estadía para consultar sus cuotas, pagos acumulados y saldos.
          </p>
        </div>
        <Link
          href="/contabilidad/vencimientos"
          className="min-h-11 inline-flex items-center justify-center gap-2 rounded-md bg-casona-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-casona-800"
        >
          Vencimientos del mes
        </Link>
      </div>

      {!bajas && (errorCuotas || sinCrear.size > 0) && (
        <p
          role="alert"
          className="rounded-md border border-ocre-200 bg-ocre-50 p-4 text-sm font-semibold text-ocre-900"
        >
          {errorCuotas
            ? "No pudimos comprobar si faltan cuotas por crear este mes. Revisá cada cuenta."
            : `${sinCrear.size} ${sinCrear.size === 1 ? "cuenta necesita" : "cuentas necesitan"} crear la cuota de este mes. Una cuota sin crear no aparece entre las vencidas.`}
        </p>
      )}

      <div>
        <nav
          aria-label="Estado de las estadías"
          className="inline-flex rounded-md bg-piedra-200/70 p-1 text-sm font-semibold shadow-inner"
        >
          {[false, true].map(finalizada => (
            <Link
              key={String(finalizada)}
              href={enlaceContabilidad(1, finalizada, busqueda)}
              aria-current={bajas === finalizada ? "page" : undefined}
              className={`rounded-md px-4 py-2 transition-colors ${
                bajas === finalizada
                  ? "bg-white text-piedra-900 font-bold"
                  : "text-piedra-600 hover:text-piedra-900"
              }`}
            >
              {finalizada ? "Estadías finalizadas" : "Residentes activos"}
            </Link>
          ))}
        </nav>
      </div>

      <form
        action="/contabilidad"
        className="flex flex-wrap items-end gap-2 rounded-md border border-piedra-200 bg-white p-3"
      >
        {bajas && <input type="hidden" name="estado" value="bajas" />}
        <label className="flex-1 text-sm font-semibold text-piedra-700">
          Buscar cuenta por nombre, apellido o DNI
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
            href={enlaceContabilidad(1, bajas)}
            className="px-2 py-2 text-sm font-semibold text-casona-800 underline"
          >
            Limpiar
          </Link>
        )}
      </form>

      <Card className="overflow-hidden rounded-md border border-piedra-200/80">
        {cuentas.length === 0 ? (
          <p className="p-12 text-center text-sm text-piedra-500">
            {busqueda
              ? `No encontramos cuentas para “${busqueda}”. Probá con otro nombre o DNI.`
              : `No hay estadías ${bajas ? "finalizadas" : "activas"} para consultar.`}
          </p>
        ) : (
          <ul className="divide-y divide-piedra-100">
            {cuentas.map(cuenta => (
              <li key={cuenta.id}>
                <Link
                  href={`/contabilidad/${cuenta.id}`}
                  className="group flex flex-wrap items-center justify-between gap-3 p-5 transition-colors hover:bg-piedra-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-piedra-900"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-casona-500 text-sm font-bold text-white ring-2 ring-casona-50 group-hover:scale-105 transition-transform">
                      {cuenta.residents.last_name.slice(0, 1)}
                      {cuenta.residents.first_name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-piedra-900 group-hover:text-casona-700 transition-colors">
                        {cuenta.residents.last_name}, {cuenta.residents.first_name}
                      </p>
                      <p className="mt-0.5 text-sm text-piedra-500">
                        DNI {cuenta.residents.dni}
                      </p>
                      <p className="mt-1 text-sm text-piedra-500 font-medium">
                        Ingreso {formatearFechaPago(cuenta.admitted_at)}
                        {cuenta.discharged_at &&
                          ` · Baja ${formatearFechaPago(cuenta.discharged_at)}`}
                      </p>
                      {sinCrear.has(cuenta.id) && (
                        <p className="mt-2 text-sm font-bold text-ocre-800">
                          Falta crear la cuota de este mes
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-piedra-200/90 bg-white px-3.5 py-2 text-sm font-semibold text-casona-700 group-hover:border-casona-300 group-hover:bg-casona-50/50 group-hover:text-casona-800 transition-colors">
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
