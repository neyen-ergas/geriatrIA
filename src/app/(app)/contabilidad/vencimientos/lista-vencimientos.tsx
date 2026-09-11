import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { COLORES_CUOTA, ETIQUETAS_CUOTA, formatearFechaPago, formatearImporte } from "@/lib/pagos";
import type { Vencimiento } from "@/lib/vencimientos-datos";

export function ListaVencimientos({ vencimientos, vencidas }: {
  vencimientos: Vencimiento[]; vencidas: boolean;
}): React.ReactElement {
  if (vencimientos.length === 0) return (
    <Card className="mt-6 p-8 text-center text-sm text-slate-600">
      {vencidas ? "No hay cuotas vencidas con saldo en el mes elegido."
        : "No hay cuotas creadas con saldo pendiente en el mes elegido."}
    </Card>
  );
  return (
    <ul className="mt-6 space-y-4">
      {vencimientos.map(({ cuota, estadia, residente }) => (
        <li key={cuota.id}>
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-900">{residente.last_name}, {residente.first_name}</h2>
                <p className="mt-1 text-xs text-slate-500">DNI {residente.dni}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Ingreso {formatearFechaPago(estadia.admitted_at)}
                  {estadia.discharged_at && ` · Baja ${formatearFechaPago(estadia.discharged_at)}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={COLORES_CUOTA[cuota.payment_status]}>{ETIQUETAS_CUOTA[cuota.payment_status]}</Badge>
                {cuota.is_overdue && <Badge className="border-red-200 bg-red-50 text-red-700">Vencida</Badge>}
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              Cuota de {formatearFechaPago(cuota.period, true)} · Vence {formatearFechaPago(cuota.due_date)}
            </p>
            <p className="mt-2 font-semibold tabular-nums text-slate-900">
              Saldo {formatearImporte(cuota.balance, cuota.currency)}
            </p>
            <p className="mt-1 text-xs tabular-nums text-slate-500">
              Importe {formatearImporte(cuota.amount_due, cuota.currency)} · Pagado {formatearImporte(cuota.paid_amount, cuota.currency)}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-sky-700">
              <Link href={`/contabilidad/${estadia.id}/cuotas/${cuota.id}`} className="hover:underline">Ver movimientos</Link>
              <Link href={`/contabilidad/${estadia.id}/pago/${cuota.id}`} className="hover:underline">Registrar pago</Link>
              <Link href={`/contabilidad/${estadia.id}`} className="hover:underline">Ver cuenta</Link>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
