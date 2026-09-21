import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SoloGestion } from "@/components/permisos";
import { Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { listarCuotas, obtenerCuenta } from "@/lib/pagos-datos";
import { enlaceContabilidad, formatearFechaPago } from "@/lib/pagos";
import { TablaCuotas } from "./tabla-cuotas";

export const metadata: Metadata = { title: "Cuenta corriente · geriatrIA" };

export default async function CuentaPage({
  params,
  searchParams,
}: {
  params: Promise<{ admissionId: string }>;
  searchParams: Promise<{ pagina?: string | string[]; cuota?: string; pago?: string }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.read");
  const { admissionId } = await params;
  const cuenta = await obtenerCuenta(admissionId);
  if (!cuenta) notFound();
  const parametros = await searchParams;
  const { cuotas, pagina, total } = await listarCuotas(admissionId, parametros.pagina);
  const ruta = `/contabilidad/${cuenta.id}`;
  return (
    <div className="space-y-6">
      <div>
        <Link
          href={enlaceContabilidad(1, cuenta.discharged_at !== null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-800"
        >
          <span>←</span> Volver a Contabilidad
        </Link>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-lg font-bold text-white shadow-sm ring-4 ring-emerald-50">
              {cuenta.residents.first_name[0]}
              {cuenta.residents.last_name[0]}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Cuenta corriente
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    cuenta.discharged_at
                      ? "border border-slate-200 bg-slate-100 text-slate-600"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  }`}
                >
                  <span
                    className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                      cuenta.discharged_at ? "bg-slate-400" : "bg-emerald-500"
                    }`}
                  />
                  {cuenta.discharged_at
                    ? `Baja ${formatearFechaPago(cuenta.discharged_at)}`
                    : "Estadía activa"}
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {cuenta.residents.last_name}, {cuenta.residents.first_name}
              </h1>
              <p className="mt-1.5 text-xs text-slate-500">
                <span className="font-medium text-slate-700">DNI: {cuenta.residents.dni}</span>
                <span className="mx-1.5">·</span>
                <span>Ingreso: {formatearFechaPago(cuenta.admitted_at)}</span>
              </p>
            </div>
          </div>

          <SoloGestion>
            <Link
              href={`${ruta}/nueva-cuota`}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 active:scale-[0.98]"
            >
              + Crear cuota
            </Link>
          </SoloGestion>
        </div>
      </div>

      {(parametros.cuota === "1" || parametros.pago === "1") && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm font-medium text-emerald-800 shadow-sm"
        >
          {parametros.pago === "1"
            ? "Pago registrado. El saldo está actualizado."
            : "Cuota creada."}
        </div>
      )}

      {cuotas.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            $
          </div>
          <h2 className="mt-3 text-base font-bold text-slate-800">
            Todavía no hay cuotas registradas
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Esta cuenta mostrará las cuotas y los pagos correspondientes a esta estadía.
          </p>
        </Card>
      ) : (
        <TablaCuotas cuotas={cuotas} admissionId={admissionId} />
      )}
      <PaginacionListado
        pagina={pagina}
        total={total}
        etiqueta="cuotas"
        anterior={pagina > 2 ? `${ruta}?pagina=${pagina - 1}` : ruta}
        siguiente={`${ruta}?pagina=${pagina + 1}`}
      />
    </div>
  );
}
