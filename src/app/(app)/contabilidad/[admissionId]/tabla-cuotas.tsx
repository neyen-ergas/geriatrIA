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
    <Card className="mt-6 overflow-hidden rounded-md border border-piedra-200/80">
      {/* Vista móvil tipo tarjeta para pantallas chicas (< md) */}
      <ul
        className="block divide-y divide-piedra-100 md:hidden"
        aria-label="Cuotas de esta estadía y pagos vigentes acumulados"
      >
        {cuotas.map(cuota => (
          <li key={cuota.id} className="space-y-3.5 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-sm font-bold text-piedra-500">Período</span>
                <div className="font-bold text-piedra-900">
                  {formatearFechaPago(cuota.period, true)}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <Badge className={COLORES_CUOTA[cuota.payment_status]}>
                  {ETIQUETAS_CUOTA[cuota.payment_status]}
                </Badge>
                {cuota.is_overdue && (
                  <Badge className="border-oxido-200 bg-oxido-50 font-semibold text-oxido-700">
                    Vencida
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-md border border-piedra-100 bg-piedra-50/60 p-3 text-sm">
              <div>
                <span className="block text-piedra-500 font-medium">Vencimiento</span>
                <span className="font-semibold text-piedra-700">
                  {formatearFechaPago(cuota.due_date)}
                </span>
              </div>
              <div>
                <span className="block text-piedra-500 font-medium">Importe</span>
                <span className="font-bold tabular-nums text-piedra-700">
                  {formatearImporte(cuota.amount_due, cuota.currency)}
                </span>
              </div>
              <div>
                <span className="block text-piedra-500 font-medium">Pagado</span>
                <span className="font-bold tabular-nums text-casona-700">
                  {formatearImporte(cuota.paid_amount, cuota.currency)}
                </span>
              </div>
              <div>
                <span className="block text-piedra-500 font-medium">Saldo</span>
                <span className="font-bold tabular-nums text-piedra-900">
                  {formatearImporte(cuota.balance, cuota.currency)}
                </span>
              </div>
            </div>

            {cuota.cancelled_reason && (
              <p className="text-sm text-piedra-500">Motivo: {cuota.cancelled_reason}</p>
            )}

            {admissionId && (
              <div className="flex flex-wrap items-center gap-3 border-t border-piedra-100 pt-3">
                <Link
                  href={`/contabilidad/${admissionId}/cuotas/${cuota.id}`}
                  className="inline-flex min-h-[44px] items-center text-sm font-semibold text-casona-700 hover:text-casona-900 hover:underline focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-casona-700"
                >
                  Ver movimientos →
                </Link>
                {cuota.balance > 0 && cuota.payment_status !== "cancelled" && (
                  <SoloGestion>
                    <Link
                      href={`/contabilidad/${admissionId}/pago/${cuota.id}`}
                      className="inline-flex min-h-[44px] items-center rounded-md bg-casona-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-casona-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-casona-700"
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
          <thead className="border-b border-piedra-100 bg-piedra-50/70 text-sm font-bold text-piedra-500">
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
          <tbody className="divide-y divide-piedra-100">
            {cuotas.map(cuota => (
              <tr
                key={cuota.id}
                className="align-top transition-colors hover:bg-piedra-50/60"
              >
                <td className="px-5 py-4 font-bold text-piedra-900">
                  {formatearFechaPago(cuota.period, true)}
                </td>
                <td className="px-5 py-4 text-piedra-600">
                  {formatearFechaPago(cuota.due_date)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 font-medium tabular-nums text-piedra-700">
                  {formatearImporte(cuota.amount_due, cuota.currency)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 font-medium tabular-nums text-casona-700">
                  {formatearImporte(cuota.paid_amount, cuota.currency)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 font-bold tabular-nums text-piedra-900">
                  {formatearImporte(cuota.balance, cuota.currency)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className={COLORES_CUOTA[cuota.payment_status]}>
                      {ETIQUETAS_CUOTA[cuota.payment_status]}
                    </Badge>
                    {cuota.is_overdue && (
                      <Badge className="border-oxido-200 bg-oxido-50 font-semibold text-oxido-700">
                        Vencida
                      </Badge>
                    )}
                  </div>
                  {cuota.cancelled_reason && (
                    <p className="mt-2 max-w-xs whitespace-normal break-words text-sm text-piedra-500">
                      Motivo: {cuota.cancelled_reason}
                    </p>
                  )}
                  {admissionId && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/contabilidad/${admissionId}/cuotas/${cuota.id}`}
                        className="text-sm font-semibold text-casona-700 hover:text-casona-900 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-casona-700"
                      >
                        Ver movimientos →
                      </Link>
                      {cuota.balance > 0 && cuota.payment_status !== "cancelled" && (
                        <SoloGestion>
                          <Link
                            href={`/contabilidad/${admissionId}/pago/${cuota.id}`}
                            className="text-sm font-semibold text-piedra-800 hover:text-casona-700 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-piedra-900"
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
      <p className="border-t border-piedra-100 bg-piedra-50/30 px-5 py-3 text-sm text-piedra-500">
        Pagado incluye únicamente pagos vigentes. Las cuotas anuladas conservan su importe
        original y no generan saldo pendiente.
      </p>
    </Card>
  );
}
