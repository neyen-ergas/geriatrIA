import Link from "next/link";
import { SoloGestion } from "@/components/permisos";
import { Badge, Card } from "@/components/ui";
import {
  COLORES_CUOTA,
  ETIQUETAS_CUOTA,
  formatearFechaPago,
  formatearImporte,
  type Cuota,
} from "@/lib/pagos";

export function TablaCuotas({
  cuotas,
  admissionId,
}: {
  cuotas: Cuota[];
  admissionId?: string;
}): React.ReactElement {
  return (
    <Card className="mt-6 overflow-hidden">
      {/* Vista móvil tipo tarjeta para pantallas chicas (< md) */}
      <ul
        className="block divide-y divide-slate-100 md:hidden"
        aria-label="Cuotas de esta estadía y pagos vigentes acumulados"
      >
        {cuotas.map(cuota => (
          <li key={cuota.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400">
                  Período
                </span>
                <div className="font-semibold text-slate-900">
                  {formatearFechaPago(cuota.period, true)}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <Badge className={COLORES_CUOTA[cuota.payment_status]}>
                  {ETIQUETAS_CUOTA[cuota.payment_status]}
                </Badge>
                {cuota.is_overdue && (
                  <Badge className="border-red-200 bg-red-50 text-red-700">Vencida</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
              <div>
                <span className="block text-slate-400">Vencimiento</span>
                <span className="font-medium text-slate-700">
                  {formatearFechaPago(cuota.due_date)}
                </span>
              </div>
              <div>
                <span className="block text-slate-400">Importe</span>
                <span className="font-medium tabular-nums text-slate-700">
                  {formatearImporte(cuota.amount_due, cuota.currency)}
                </span>
              </div>
              <div>
                <span className="block text-slate-400">Pagado</span>
                <span className="font-medium tabular-nums text-slate-700">
                  {formatearImporte(cuota.paid_amount, cuota.currency)}
                </span>
              </div>
              <div>
                <span className="block text-slate-400">Saldo</span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {formatearImporte(cuota.balance, cuota.currency)}
                </span>
              </div>
            </div>

            {cuota.cancelled_reason && (
              <p className="text-xs text-slate-500">Motivo: {cuota.cancelled_reason}</p>
            )}

            {admissionId && (
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2">
                <Link
                  href={`/contabilidad/${admissionId}/cuotas/${cuota.id}`}
                  className="inline-flex min-h-[44px] items-center text-sm font-medium text-sky-700 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
                >
                  Ver movimientos
                </Link>
                {cuota.balance > 0 && cuota.payment_status !== "cancelled" && (
                  <SoloGestion>
                    <Link
                      href={`/contabilidad/${admissionId}/pago/${cuota.id}`}
                      className="inline-flex min-h-[44px] items-center rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
                    >
                      Registrar pago
                    </Link>
                  </SoloGestion>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Vista de tabla tradicional para pantallas medianas y grandes (>= md) */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[800px] text-left text-sm">
          <caption className="sr-only">
            Cuotas de esta estadía y pagos vigentes acumulados
          </caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              {["Período", "Vencimiento", "Importe", "Pagado", "Saldo", "Estado"].map(
                titulo => (
                  <th key={titulo} scope="col" className="px-5 py-3 font-semibold">
                    {titulo}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cuotas.map(cuota => (
              <tr key={cuota.id} className="align-top hover:bg-slate-50/70">
                <td className="px-5 py-4 font-medium text-slate-900">
                  {formatearFechaPago(cuota.period, true)}
                </td>
                <td className="px-5 py-4">{formatearFechaPago(cuota.due_date)}</td>
                <td className="whitespace-nowrap px-5 py-4 tabular-nums">
                  {formatearImporte(cuota.amount_due, cuota.currency)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 tabular-nums">
                  {formatearImporte(cuota.paid_amount, cuota.currency)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 font-semibold tabular-nums">
                  {formatearImporte(cuota.balance, cuota.currency)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={COLORES_CUOTA[cuota.payment_status]}>
                      {ETIQUETAS_CUOTA[cuota.payment_status]}
                    </Badge>
                    {cuota.is_overdue && (
                      <Badge className="border-red-200 bg-red-50 text-red-700">
                        Vencida
                      </Badge>
                    )}
                  </div>
                  {cuota.cancelled_reason && (
                    <p className="mt-2 max-w-xs whitespace-normal break-words text-xs text-slate-500">
                      Motivo: {cuota.cancelled_reason}
                    </p>
                  )}
                  {admissionId && (
                    <Link
                      href={`/contabilidad/${admissionId}/cuotas/${cuota.id}`}
                      className="mt-3 block text-sm font-medium text-sky-700 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
                    >
                      Ver movimientos
                    </Link>
                  )}
                  {admissionId &&
                    cuota.balance > 0 &&
                    cuota.payment_status !== "cancelled" && (
                      <SoloGestion>
                        <Link
                          href={`/contabilidad/${admissionId}/pago/${cuota.id}`}
                          className="mt-3 inline-block text-sm font-medium text-sky-700 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
                        >
                          Registrar pago
                        </Link>
                      </SoloGestion>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        Pagado incluye únicamente pagos vigentes. Las cuotas anuladas conservan su importe
        original y no generan saldo pendiente.
      </p>
    </Card>
  );
}
