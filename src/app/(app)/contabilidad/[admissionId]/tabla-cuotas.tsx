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
    <Card className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
      {/* Vista móvil tipo tarjeta para pantallas chicas (< md) */}
      <ul
        className="block divide-y divide-slate-100 md:hidden"
        aria-label="Cuotas de esta estadía y pagos vigentes acumulados"
      >
        {cuotas.map(cuota => (
          <li key={cuota.id} className="space-y-3.5 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Período
                </span>
                <div className="font-bold text-slate-900">
                  {formatearFechaPago(cuota.period, true)}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <Badge className={COLORES_CUOTA[cuota.payment_status]}>
                  {ETIQUETAS_CUOTA[cuota.payment_status]}
                </Badge>
                {cuota.is_overdue && (
                  <Badge className="border-rose-200 bg-rose-50 font-semibold text-rose-700">
                    Vencida
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs">
              <div>
                <span className="block text-slate-400 font-medium">Vencimiento</span>
                <span className="font-semibold text-slate-700">
                  {formatearFechaPago(cuota.due_date)}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Importe</span>
                <span className="font-bold tabular-nums text-slate-700">
                  {formatearImporte(cuota.amount_due, cuota.currency)}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Pagado</span>
                <span className="font-bold tabular-nums text-emerald-700">
                  {formatearImporte(cuota.paid_amount, cuota.currency)}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Saldo</span>
                <span className="font-extrabold tabular-nums text-slate-900">
                  {formatearImporte(cuota.balance, cuota.currency)}
                </span>
              </div>
            </div>

            {cuota.cancelled_reason && (
              <p className="text-xs text-slate-500">Motivo: {cuota.cancelled_reason}</p>
            )}

            {admissionId && (
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                <Link
                  href={`/contabilidad/${admissionId}/cuotas/${cuota.id}`}
                  className="inline-flex min-h-[44px] items-center text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                >
                  Ver movimientos →
                </Link>
                {cuota.balance > 0 && cuota.payment_status !== "cancelled" && (
                  <SoloGestion>
                    <Link
                      href={`/contabilidad/${admissionId}/pago/${cuota.id}`}
                      className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
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
          <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              {["Período", "Vencimiento", "Importe", "Pagado", "Saldo", "Estado"].map(
                titulo => (
                  <th key={titulo} scope="col" className="px-5 py-3.5">
                    {titulo}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cuotas.map(cuota => (
              <tr
                key={cuota.id}
                className="align-top transition-colors hover:bg-slate-50/60"
              >
                <td className="px-5 py-4 font-bold text-slate-900">
                  {formatearFechaPago(cuota.period, true)}
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {formatearFechaPago(cuota.due_date)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 font-medium tabular-nums text-slate-700">
                  {formatearImporte(cuota.amount_due, cuota.currency)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 font-medium tabular-nums text-emerald-700">
                  {formatearImporte(cuota.paid_amount, cuota.currency)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 font-bold tabular-nums text-slate-900">
                  {formatearImporte(cuota.balance, cuota.currency)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className={COLORES_CUOTA[cuota.payment_status]}>
                      {ETIQUETAS_CUOTA[cuota.payment_status]}
                    </Badge>
                    {cuota.is_overdue && (
                      <Badge className="border-rose-200 bg-rose-50 font-semibold text-rose-700">
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
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/contabilidad/${admissionId}/cuotas/${cuota.id}`}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                      >
                        Ver movimientos →
                      </Link>
                      {cuota.balance > 0 && cuota.payment_status !== "cancelled" && (
                        <SoloGestion>
                          <Link
                            href={`/contabilidad/${admissionId}/pago/${cuota.id}`}
                            className="text-xs font-semibold text-slate-800 hover:text-emerald-700 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                          >
                            Registrar pago
                          </Link>
                        </SoloGestion>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 bg-slate-50/30 px-5 py-3 text-xs text-slate-500">
        Pagado incluye únicamente pagos vigentes. Las cuotas anuladas conservan su importe
        original y no generan saldo pendiente.
      </p>
    </Card>
  );
}
