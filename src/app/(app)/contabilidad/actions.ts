"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import {
  errorCargaPago, leerCargaPago, validarCargaCuota, validarCargaPago,
  type EstadoCargaPago,
} from "@/lib/cargar-pagos";
import { obtenerCuenta, obtenerCuota } from "@/lib/pagos-datos";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { createClient } from "@/lib/supabase/server";

export async function crearCuota(
  admissionId: string, _anterior: EstadoCargaPago, formData: FormData,
): Promise<EstadoCargaPago> {
  await requerirSesion();
  const valores = leerCargaPago(formData);
  try {
    const cuenta = await obtenerCuenta(admissionId);
    if (!cuenta) return { valores, errores: {}, mensaje: "La estadía no está disponible." };
    const validacion = validarCargaCuota(valores, cuenta);
    if (!validacion.ok) return {
      valores, errores: validacion.errores, mensaje: "Revisá los campos marcados.",
    };
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_monthly_charge", validacion.datos);
    if (error || !data) return { valores, errores: {}, ...errorCargaPago(error) };
  } catch (error) {
    return { valores, errores: {}, ...errorCargaPago(error) };
  }
  revalidatePath(`/contabilidad/${admissionId}`);
  revalidatePath("/contabilidad/vencimientos");
  redirect(`/contabilidad/${admissionId}?cuota=1`);
}

export async function registrarPago(
  admissionId: string, cuotaId: string,
  _anterior: EstadoCargaPago, formData: FormData,
): Promise<EstadoCargaPago> {
  await requerirSesion();
  const valores = leerCargaPago(formData);
  try {
    const cuota = await obtenerCuota(admissionId, cuotaId);
    if (!cuota) return { valores, errores: {}, mensaje: "La cuota no pertenece a esta cuenta o no está disponible." };
    const validacion = validarCargaPago(valores, cuota, hoyEnArgentina());
    if (!validacion.ok) return {
      valores, errores: validacion.errores, mensaje: "Revisá los campos marcados.",
    };
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("record_payment", validacion.datos);
    if (error || !data) return { valores, errores: {}, ...errorCargaPago(error) };
  } catch (error) {
    return { valores, errores: {}, ...errorCargaPago(error) };
  }
  revalidatePath(`/contabilidad/${admissionId}`);
  revalidatePath(`/contabilidad/${admissionId}/cuotas/${cuotaId}`);
  revalidatePath("/contabilidad/vencimientos");
  redirect(`/contabilidad/${admissionId}?pago=1`);
}
