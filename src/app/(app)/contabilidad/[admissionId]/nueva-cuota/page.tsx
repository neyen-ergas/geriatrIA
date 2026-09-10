import { notFound } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import { vencimientoSugerido } from "@/lib/cargar-pagos";
import { obtenerCuenta } from "@/lib/pagos-datos";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { crearCuota } from "../../actions";
import { FormularioCarga } from "../../formulario-carga";

export default async function NuevaCuotaPage({ params }: {
  params: Promise<{ admissionId: string }>;
}): Promise<React.ReactElement> {
  await requerirSesion();
  const { admissionId } = await params;
  const cuenta = await obtenerCuenta(admissionId);
  if (!cuenta) notFound();
  const hoy = hoyEnArgentina();
  const periodo = (cuenta.discharged_at ?? hoy).slice(0, 7);
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Crear cuota</h1>
      <p className="mt-2 text-slate-600">{cuenta.residents.last_name}, {cuenta.residents.first_name}</p>
      <FormularioCarga modo="cuota" hoy={hoy} moneda={cuenta.currency}
        diaVencimiento={cuenta.due_day} volver={`/contabilidad/${admissionId}`}
        formAction={crearCuota.bind(null, admissionId)} valoresIniciales={{
          periodo, vencimiento: vencimientoSugerido(periodo, cuenta.due_day),
          importe: cuenta.monthly_fee.toFixed(2).replace(".", ","), notas: "",
        }} />
    </div>
  );
}
