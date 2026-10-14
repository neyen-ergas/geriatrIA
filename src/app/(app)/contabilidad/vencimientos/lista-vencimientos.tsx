import Link from "next/link";
import { AlertTriangle, ArrowRight, DollarSign, FileText } from "lucide-react";
import { SoloGestion } from "@/components/permisos";
import { Badge, Card } from "@/components/ui";
import {
  COLORES_CUOTA,
  ETIQUETAS_CUOTA,
  formatearFechaPago,
  formatearImporte,
} from "@/lib/pagos";
import type { Vencimiento } from "@/lib/vencimientos-datos";

export function ListaVencimientos({
  vencimientos,
  vencidas,
  todosLosMeses = false,
}: {
  vencimientos: Vencimiento[];
  vencidas: boolean;
  todosLosMeses?: boolean;
}): React.ReactElement {
  if (vencimientos.length === 0)
    return (
      <Card className="mt-6 p-10 text-center text-sm text-piedra-500">
        {todosLosMeses
          ? "No hay cuotas vencidas con saldo pendiente."
          : vencidas
            ? "No hay cuotas vencidas con saldo en el mes elegido."
            : "No hay cuotas creadas con saldo pendiente en el mes elegido."}
      </Card>
    );
  return (
    <ul className="mt-6 space-y-4">
      {vencimientos.map(({ cuota, estadia, residente }) => (
        <li key={cuota.id}>
          <Card className="p-5 transition-colors duration-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-piedra-900">
                  {residente.last_name}, {residente.first_name}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-piedra-500">
                    DNI {residente.dni}
                  </span>
                  <span className="text-piedra-500">·</span>
                  <span className="text-sm text-piedra-500">
                    Ingreso {formatearFechaPago(estadia.admitted_at)}
                    {estadia.discharged_at &&
                      ` · Baja ${formatearFechaPago(estadia.discharged_at)}`}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={COLORES_CUOTA[cuota.payment_status]}>
                  {ETIQUETAS_CUOTA[cuota.payment_status]}
                </Badge>
                {cuota.is_overdue && (
                  <Badge className="border-oxido-200 bg-oxido-50 text-oxido-700">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Vencida
                  </Badge>
                )}
              </div>
            </div>

            <p className="mt-3 text-sm font-semibold text-piedra-600">
              Cuota de {formatearFechaPago(cuota.period, true)} · Vence{" "}
              {formatearFechaPago(cuota.due_date)}
            </p>

            <div className="mt-3 rounded-md border border-piedra-200/80 bg-piedra-50/70 p-3.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-piedra-500">Saldo pendiente</span>
                <span className="text-lg font-bold tabular-nums text-piedra-900">
                  {formatearImporte(cuota.balance, cuota.currency)}
                </span>
              </div>
              <p className="mt-1 text-sm tabular-nums text-piedra-500">
                Importe {formatearImporte(cuota.amount_due, cuota.currency)} · Pagado{" "}
                {formatearImporte(cuota.paid_amount, cuota.currency)}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-piedra-100 pt-3 text-sm font-semibold">
              <Link
                href={`/contabilidad/${estadia.id}/cuotas/${cuota.id}`}
                className="inline-flex items-center gap-1 rounded-md border border-piedra-200/90 bg-white px-3 py-1.5 text-piedra-700 transition-colors hover:bg-piedra-50 hover:text-piedra-900"
              >
                <FileText className="h-3 w-3" />
                Ver movimientos
              </Link>
              <SoloGestion>
                <Link
                  href={`/contabilidad/${estadia.id}/pago/${cuota.id}`}
                  className="inline-flex items-center gap-1 rounded-md bg-casona-600 px-3 py-1.5 text-white transition-colors hover:bg-casona-700"
                >
                  <DollarSign className="h-3 w-3" />
                  Registrar pago
                </Link>
              </SoloGestion>
              <Link
                href={`/contabilidad/${estadia.id}`}
                className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-piedra-500 transition-colors hover:bg-piedra-100/80 hover:text-piedra-900"
              >
                Ver cuenta
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
