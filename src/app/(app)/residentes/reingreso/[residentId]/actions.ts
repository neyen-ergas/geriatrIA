"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import {
  leerValoresReingreso,
  validarReingreso,
  type EstadoReingreso,
} from "@/lib/reingreso-residente";
import { createClient } from "@/lib/supabase/server";

export async function reingresarResidente(
  residentId: string,
  _estadoAnterior: EstadoReingreso,
  formData: FormData,
): Promise<EstadoReingreso> {
  await requerirSesion();

  const valores = leerValoresReingreso(formData);
  const supabase = await createClient();
  const [activoResult, ultimaBajaResult] = await Promise.all([
    supabase
      .from("admissions")
      .select("id")
      .eq("resident_id", residentId)
      .is("discharged_at", null)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("admissions")
      .select("discharged_at")
      .eq("resident_id", residentId)
      .not("discharged_at", "is", null)
      .order("discharged_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (activoResult.error || ultimaBajaResult.error) {
    console.error("No se pudo comprobar el estado antes del reingreso", {
      activeError: activoResult.error,
      lastDischargeError: ultimaBajaResult.error,
    });

    return {
      errores: {},
      mensaje: "No pudimos comprobar el estado del residente. Intentá nuevamente.",
      valores,
    };
  }

  if (activoResult.data) {
    return {
      errores: {},
      mensaje: "El residente ya tiene un ingreso activo.",
      valores,
    };
  }

  const ultimaBaja = ultimaBajaResult.data?.discharged_at;
  if (!ultimaBaja) {
    return {
      errores: {},
      mensaje: "No encontramos una baja anterior para este residente.",
      valores,
    };
  }

  const validacion = validarReingreso(
    formData,
    ultimaBaja,
    hoyEnArgentina(),
  );

  if (!validacion.ok) {
    return {
      errores: validacion.errores,
      mensaje: "Revisá los campos marcados antes de continuar.",
      valores,
    };
  }

  const { error } = await supabase.from("admissions").insert({
    ...validacion.datos,
    resident_id: residentId,
    currency: "ARS",
  });

  if (error) {
    console.error("No se pudo registrar el reingreso", {
      code: error.code,
      message: error.message,
    });

    return {
      errores: {},
      mensaje:
        error.code === "23505"
          ? "El residente ya tiene un ingreso activo."
          : "No pudimos registrar el reingreso. Intentá nuevamente.",
      valores,
    };
  }

  revalidatePath("/residentes");
  redirect("/residentes?reingreso=1");
}
