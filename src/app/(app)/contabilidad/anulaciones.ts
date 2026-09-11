"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import { errorAnulacion, leerMotivoAnulacion, type EstadoAnulacion } from "@/lib/anular-pagos";
import { obtenerMovimiento } from "@/lib/movimientos-datos";
import { obtenerCuota } from "@/lib/pagos-datos";
import { createClient } from "@/lib/supabase/server";

export async function anularPago(
  admissionId: string, cuotaId: string, pagoId: string,
  _anterior: EstadoAnulacion, datos: FormData,
): Promise<EstadoAnulacion> {
  await requerirSesion();
  const motivo = leerMotivoAnulacion(datos);
  if (!motivo) return { motivo, error: "Ingresá el motivo de la anulación." };
  try {
    const cuota = await obtenerCuota(admissionId, cuotaId);
    if (!cuota) return { motivo, error: "La cuota no pertenece a esta cuenta o no está disponible." };
    const pago = await obtenerMovimiento(cuotaId, pagoId);
    if (!pago || pago.voided_at) return {
      motivo, error: "El pago ya fue anulado o no pertenece a esta cuota.",
    };
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("void_payment", {
      p_payment_id: pagoId, p_reason: motivo,
    });
    if (error || !data) return { motivo, ...errorAnulacion(error) };
  } catch (error) {
    return { motivo, ...errorAnulacion(error) };
  }
  const ruta = `/contabilidad/${admissionId}/cuotas/${cuotaId}`;
  revalidatePath(`/contabilidad/${admissionId}`);
  revalidatePath(ruta);
  revalidatePath("/contabilidad/vencimientos");
  redirect(`${ruta}?anulado=pago`);
}

export async function cancelarCuota(
  admissionId: string, cuotaId: string,
  _anterior: EstadoAnulacion, datos: FormData,
): Promise<EstadoAnulacion> {
  await requerirSesion();
  const motivo = leerMotivoAnulacion(datos);
  if (!motivo) return { motivo, error: "Ingresá el motivo de la anulación." };
  try {
    const cuota = await obtenerCuota(admissionId, cuotaId);
    if (!cuota || cuota.payment_status === "cancelled") return {
      motivo, error: "La cuota ya está anulada o no pertenece a esta cuenta.",
    };
    if (cuota.paid_amount > 0) return {
      motivo, error: "La cuota tiene pagos vigentes. Revisalos y anulalos primero si corresponde.",
    };
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("cancel_monthly_charge", {
      p_monthly_charge_id: cuotaId, p_reason: motivo,
    });
    if (error || !data) return { motivo, ...errorAnulacion(error) };
  } catch (error) {
    return { motivo, ...errorAnulacion(error) };
  }
  const ruta = `/contabilidad/${admissionId}/cuotas/${cuotaId}`;
  revalidatePath(`/contabilidad/${admissionId}`);
  revalidatePath(ruta);
  revalidatePath("/contabilidad/vencimientos");
  redirect(`${ruta}?anulado=cuota`);
}
