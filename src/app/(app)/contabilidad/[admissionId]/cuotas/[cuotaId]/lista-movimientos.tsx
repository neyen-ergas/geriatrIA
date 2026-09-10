import { Badge, Card } from "@/components/ui";
import { etiquetaMedio, formatearMomentoPago, type Movimiento } from "@/lib/movimientos";
import { formatearFechaPago, formatearImporte } from "@/lib/pagos";
import { anularPago } from "../../../anulaciones";
import { FormularioAnulacion } from "../../../formulario-anulacion";

export function ListaMovimientos({ movimientos, moneda, admissionId, cuotaId }: {
  movimientos: Movimiento[]; moneda: string; admissionId: string; cuotaId: string;
}): React.ReactElement {
  if (movimientos.length === 0) return (
    <Card className="mt-4 p-8 text-center text-sm text-slate-500">Todavía no hay pagos registrados para esta cuota.</Card>
  );
  return (
    <ul className="mt-4 space-y-4">
      {movimientos.map(pago => (
        <li key={pago.id}>
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold tabular-nums text-slate-900">{formatearImporte(pago.amount, moneda)}</h3>
              <Badge className={pago.voided_at
                ? "border-slate-200 bg-slate-100 text-slate-500"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"}>
                {pago.voided_at ? "Anulado" : "Vigente"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-700">
              Pago del {formatearFechaPago(pago.paid_on)} · {etiquetaMedio(pago.payment_method)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Registrado {formatearMomentoPago(pago.created_at)}</p>
            {pago.reference && <p className="mt-3 break-words text-sm text-slate-600">Referencia: {pago.reference}</p>}
            {pago.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">Observaciones: {pago.notes}</p>}
            {pago.voided_at ? (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <p>Anulado {formatearMomentoPago(pago.voided_at)}</p>
                <p className="mt-1 whitespace-pre-wrap break-words">Motivo: {pago.voided_reason}</p>
              </div>
            ) : (
              <FormularioAnulacion tipo="pago" formAction={anularPago.bind(null, admissionId, cuotaId, pago.id)} />
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}
