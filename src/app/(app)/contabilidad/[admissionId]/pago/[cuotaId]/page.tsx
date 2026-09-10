import { notFound } from "next/navigation";
import Link from "next/link";
import { requerirSesion } from "@/lib/auth";
import { obtenerCuenta, obtenerCuota } from "@/lib/pagos-datos";
import { formatearFechaPago, formatearImporte } from "@/lib/pagos";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { registrarPago } from "../../../actions";
import { FormularioCarga } from "../../../formulario-carga";

export default async function NuevoPagoPage({ params }: {
  params: Promise<{ admissionId: string; cuotaId: string }>;
}): Promise<React.ReactElement> {
  await requerirSesion();
  const { admissionId, cuotaId } = await params;
  const cuenta = await obtenerCuenta(admissionId);
  if (!cuenta) notFound();
  const cuota = await obtenerCuota(admissionId, cuotaId);
  if (!cuota) notFound();
  const hoy = hoyEnArgentina();
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Registrar pago</h1>
      <p className="mt-2 text-slate-600">{cuenta.residents.last_name}, {cuenta.residents.first_name}</p>
      <p className="mt-1 text-sm text-slate-600">
        {formatearFechaPago(cuota.period, true)} · Saldo {formatearImporte(cuota.balance, cuota.currency)}
      </p>
      {cuota.payment_status === "cancelled" || cuota.balance <= 0 ? (
        <div className="mt-6">
          <p>Esta cuota está anulada o ya no tiene saldo pendiente.</p>
          <Link href={`/contabilidad/${admissionId}`} className="mt-4 inline-block text-sky-700">Volver a la cuenta</Link>
        </div>
      ) : (
        <FormularioCarga modo="pago" hoy={hoy} moneda={cuota.currency} volver={`/contabilidad/${admissionId}`}
          formAction={registrarPago.bind(null, admissionId, cuotaId)}
          valoresIniciales={{ fecha: hoy, importe: cuota.balance.toFixed(2).replace(".", ","),
            medio: "", referencia: "", notas: "" }} />
      )}
    </div>
  );
}
