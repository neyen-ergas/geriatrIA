import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, DollarSign } from "lucide-react";
import { SoloGestion } from "@/components/permisos";
import { Badge, Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { listarMovimientos } from "@/lib/movimientos-datos";
import { obtenerCuenta, obtenerCuota } from "@/lib/pagos-datos";
import {
  COLORES_CUOTA,
  ETIQUETAS_CUOTA,
  formatearFechaPago,
  formatearImporte,
} from "@/lib/pagos";
import { cancelarCuota } from "../../../anulaciones";
import { FormularioAnulacion } from "../../../formulario-anulacion";
import { ListaMovimientos } from "./lista-movimientos";

export const metadata: Metadata = { title: "Detalle de cuota · geriatrIA" };

export default async function DetalleCuotaPage({
  params,
  searchParams,
}: {
  params: Promise<{ admissionId: string; cuotaId: string }>;
  searchParams: Promise<{ pagina?: string | string[]; anulado?: string }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.read");
  const { admissionId, cuotaId } = await params;
  const cuenta = await obtenerCuenta(admissionId);
  if (!cuenta) notFound();
  const cuota = await obtenerCuota(admissionId, cuotaId);
  if (!cuota) notFound();
  const parametros = await searchParams;
  const { movimientos, total, pagina } = await listarMovimientos(
    cuotaId,
    parametros.pagina,
  );
  const ruta = `/contabilidad/${admissionId}/cuotas/${cuotaId}`;
  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/contabilidad/${admissionId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a la cuenta
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2">
            <Badge className={COLORES_CUOTA[cuota.payment_status]}>
              {ETIQUETAS_CUOTA[cuota.payment_status]}
            </Badge>
            {cuota.is_overdue && (
              <Badge className="border-rose-200 bg-rose-50 text-rose-700">Vencida</Badge>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Cuota de {formatearFechaPago(cuota.period, true)}
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {cuenta.residents.last_name}, {cuenta.residents.first_name}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Ingreso {formatearFechaPago(cuenta.admitted_at)}
            {cuenta.discharged_at &&
              ` · Baja ${formatearFechaPago(cuenta.discharged_at)}`}
            {` · Vencimiento ${formatearFechaPago(cuota.due_date)}`}
          </p>
        </div>

        {cuota.balance > 0 && cuota.payment_status !== "cancelled" && (
          <SoloGestion>
            <Link
              href={`/contabilidad/${admissionId}/pago/${cuotaId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-[0.98]"
            >
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Registrar pago
            </Link>
          </SoloGestion>
        )}
      </div>

      {(parametros.anulado === "pago" || parametros.anulado === "cuota") && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm font-semibold text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          {parametros.anulado === "pago" ? "Pago anulado." : "Cuota anulada."} Los saldos
          están actualizados.
        </div>
      )}

      {/* Métricas de la cuota */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Importe original
          </p>
          <p className="mt-2 text-xl font-extrabold tabular-nums text-slate-900">
            {formatearImporte(cuota.amount_due, cuota.currency)}
          </p>
        </Card>
        <Card className="p-4 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pagado vigente
          </p>
          <p className="mt-2 text-xl font-extrabold tabular-nums text-emerald-700">
            {formatearImporte(cuota.paid_amount, cuota.currency)}
          </p>
        </Card>
        <Card className="p-4 shadow-2xs border-slate-200/90 bg-slate-50/40">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Saldo pendiente
          </p>
          <p className="mt-2 text-xl font-extrabold tabular-nums text-slate-900">
            {formatearImporte(cuota.balance, cuota.currency)}
          </p>
        </Card>
      </div>

      {cuota.payment_status === "cancelled" ? (
        <Card className="p-4 bg-slate-50 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Motivo de anulación:</p>
          <p className="mt-1 whitespace-pre-wrap break-words">{cuota.cancelled_reason}</p>
        </Card>
      ) : (
        cuota.paid_amount === 0 && (
          <Card className="p-5 shadow-2xs">
            <FormularioAnulacion
              tipo="cuota"
              formAction={cancelarCuota.bind(null, admissionId, cuotaId)}
            />
          </Card>
        )
      )}

      <div className="border-t border-slate-200/80 pt-6">
        <h2 className="text-lg font-bold text-slate-900">Movimientos</h2>
        <p className="mt-1 text-xs text-slate-500">
          Los pagos anulados se conservan y no se descuentan del saldo.
        </p>
        <ListaMovimientos
          movimientos={movimientos}
          moneda={cuota.currency}
          admissionId={admissionId}
          cuotaId={cuotaId}
        />
        <PaginacionListado
          pagina={pagina}
          total={total}
          etiqueta="movimientos"
          anterior={pagina > 2 ? `${ruta}?pagina=${pagina - 1}` : ruta}
          siguiente={`${ruta}?pagina=${pagina + 1}`}
        />
      </div>
    </div>
  );
}
