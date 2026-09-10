import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { listarMovimientos } from "@/lib/movimientos-datos";
import { obtenerCuenta, obtenerCuota } from "@/lib/pagos-datos";
import { COLORES_CUOTA, ETIQUETAS_CUOTA, formatearFechaPago, formatearImporte } from "@/lib/pagos";
import { cancelarCuota } from "../../../anulaciones";
import { FormularioAnulacion } from "../../../formulario-anulacion";
import { ListaMovimientos } from "./lista-movimientos";

export const metadata: Metadata = { title: "Detalle de cuota · geriatrIA" };

export default async function DetalleCuotaPage({ params, searchParams }: {
  params: Promise<{ admissionId: string; cuotaId: string }>;
  searchParams: Promise<{ pagina?: string | string[]; anulado?: string }>;
}): Promise<React.ReactElement> {
  await requerirSesion();
  const { admissionId, cuotaId } = await params;
  const cuenta = await obtenerCuenta(admissionId);
  if (!cuenta) notFound();
  const cuota = await obtenerCuota(admissionId, cuotaId);
  if (!cuota) notFound();
  const parametros = await searchParams;
  const { movimientos, total, pagina } = await listarMovimientos(cuotaId, parametros.pagina);
  const ruta = `/contabilidad/${admissionId}/cuotas/${cuotaId}`;
  return (
    <div>
      <Link href={`/contabilidad/${admissionId}`} className="text-sm font-medium text-sky-700 hover:underline">
        ← Volver a la cuenta
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Cuota de {formatearFechaPago(cuota.period, true)}
      </h1>
      <p className="mt-2 text-slate-600">{cuenta.residents.last_name}, {cuenta.residents.first_name}</p>
      <p className="mt-1 text-sm text-slate-500">
        Ingreso {formatearFechaPago(cuenta.admitted_at)}
        {cuenta.discharged_at && ` · Baja ${formatearFechaPago(cuenta.discharged_at)}`}
        {` · Vencimiento ${formatearFechaPago(cuota.due_date)}`}
      </p>
      {(parametros.anulado === "pago" || parametros.anulado === "cuota") && (
        <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          {parametros.anulado === "pago" ? "Pago anulado." : "Cuota anulada."} Los saldos están actualizados.
        </p>
      )}
      <Card className="mt-6 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge className={COLORES_CUOTA[cuota.payment_status]}>{ETIQUETAS_CUOTA[cuota.payment_status]}</Badge>
          {cuota.is_overdue && <Badge className="border-red-200 bg-red-50 text-red-700">Vencida</Badge>}
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          {([["Importe original", cuota.amount_due], ["Pagado vigente", cuota.paid_amount],
            ["Saldo pendiente", cuota.balance]] as const).map(([etiqueta, importe]) => (
            <div key={etiqueta}>
              <dt className="text-sm text-slate-500">{etiqueta}</dt>
              <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                {formatearImporte(importe, cuota.currency)}
              </dd>
            </div>
          ))}
        </dl>
        {cuota.payment_status === "cancelled" ? (
          <p className="mt-4 whitespace-pre-wrap break-words text-sm text-slate-600">Motivo de anulación: {cuota.cancelled_reason}</p>
        ) : (
          <>
            {cuota.balance > 0 && (
              <Link href={`/contabilidad/${admissionId}/pago/${cuotaId}`}
                className="mt-5 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Registrar pago
              </Link>
            )}
            {cuota.paid_amount === 0 ? (
              <FormularioAnulacion tipo="cuota" formAction={cancelarCuota.bind(null, admissionId, cuotaId)} />
            ) : (
              <p className="mt-4 text-sm text-slate-500">Para anular esta cuota, primero deben anularse sus pagos vigentes.</p>
            )}
          </>
        )}
      </Card>
      <h2 className="mt-8 text-lg font-semibold text-slate-900">Movimientos</h2>
      <p className="mt-1 text-sm text-slate-500">Los pagos anulados se conservan y no se descuentan del saldo.</p>
      <ListaMovimientos movimientos={movimientos} moneda={cuota.currency}
        admissionId={admissionId} cuotaId={cuotaId} />
      <PaginacionListado pagina={pagina} total={total} etiqueta="movimientos"
        anterior={pagina > 2 ? `${ruta}?pagina=${pagina - 1}` : ruta}
        siguiente={`${ruta}?pagina=${pagina + 1}`} />
    </div>
  );
}
