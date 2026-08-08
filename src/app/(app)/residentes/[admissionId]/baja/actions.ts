"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import {
  leerValoresBaja,
  validarBajaResidente,
  type EstadoBajaResidente,
} from "@/lib/baja-residente";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { createClient } from "@/lib/supabase/server";

export type DatosIngresoParaBaja = {
  admissionId: string;
  admittedAt: string;
};

export async function darDeBajaResidente(
  ingreso: DatosIngresoParaBaja,
  _estadoAnterior: EstadoBajaResidente,
  formData: FormData,
): Promise<EstadoBajaResidente> {
  await requerirSesion();

  const valores = leerValoresBaja(formData);
  const validacion = validarBajaResidente(
    formData,
    ingreso.admittedAt,
    hoyEnArgentina(),
  );

  if (!validacion.ok) {
    return {
      errores: validacion.errores,
      mensaje: "Revisá los campos marcados antes de continuar.",
      valores,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admissions")
    .update({
      discharged_at: validacion.datos.discharged_at,
      discharge_reason: validacion.datos.discharge_reason,
    })
    .eq("id", ingreso.admissionId)
    .is("discharged_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("No se pudo dar de baja el ingreso", {
      code: error.code,
      message: error.message,
    });

    return {
      errores: {},
      mensaje: "No pudimos registrar la baja. Intentá nuevamente.",
      valores,
    };
  }

  if (!data) {
    return {
      errores: {},
      mensaje: "Este ingreso ya no está activo.",
      valores,
    };
  }

  revalidatePath("/residentes");
  redirect("/residentes?estado=bajas&baja=1");
}
