import { Badge, Card } from "@/components/ui";
import {
  COLORES_CUOTA, ETIQUETAS_CUOTA, formatearFechaPago,
  formatearImporte, type Cuota,
} from "@/lib/pagos";

export function TablaCuotas({ cuotas }: { cuotas: Cuota[] }): React.ReactElement {
  return (
    <Card className="mt-6 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <caption className="sr-only">Cuotas de esta estadía y pagos vigentes acumulados</caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              {["Período", "Vencimiento", "Importe", "Pagado", "Saldo", "Estado"].map(titulo => (
                <th key={titulo} scope="col" className="px-5 py-3 font-semibold">{titulo}</th>
              ))}
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
                      <Badge className="border-red-200 bg-red-50 text-red-700">Vencida</Badge>
                    )}
                  </div>
                  {cuota.cancelled_reason && (
                    <p className="mt-2 max-w-xs whitespace-normal break-words text-xs text-slate-500">
                      Motivo: {cuota.cancelled_reason}
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        Pagado incluye únicamente pagos vigentes. Las cuotas anuladas conservan
        su importe original y no generan saldo pendiente.
      </p>
    </Card>
  );
}
