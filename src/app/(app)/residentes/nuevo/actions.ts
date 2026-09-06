"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import { mensajeErrorEstadia } from "@/lib/errores-estadias";
import {
  hoyEnArgentina,
  leerValoresPrimerIngreso,
  validarPrimerIngreso,
  type EstadoFormularioIngreso,
} from "@/lib/primer-ingreso";
import { createClient } from "@/lib/supabase/server";

const UNIQUE_VIOLATION = "23505";

export async function registrarPrimerIngreso(
  _estadoAnterior: EstadoFormularioIngreso,
  formData: FormData,
): Promise<EstadoFormularioIngreso> {
  await requerirSesion();

  const valores = leerValoresPrimerIngreso(formData);
  const validacion = validarPrimerIngreso(formData, hoyEnArgentina());

  if (!validacion.ok) {
    return {
      errores: validacion.errores,
      mensaje: "Revisá los campos marcados antes de continuar.",
      valores,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc(
    "create_initial_admission",
    validacion.datos,
  );

  if (error) {
    const mensaje = mensajeErrorEstadia(error);
    if (mensaje) return { errores: {}, mensaje, valores };

    console.error("No se pudo registrar el primer ingreso", {
      code: error.code,
    });

    if (error.code === UNIQUE_VIOLATION) {
      return {
        errores: { resident_dni: "Ya existe un residente con este DNI." },
        mensaje: "No pudimos registrar el ingreso.",
        valores,
      };
    }

    return {
      errores: {},
      mensaje:
        "No pudimos registrar el ingreso. Intentá nuevamente en unos minutos.",
      valores,
    };
  }

  revalidatePath("/residentes");
  redirect("/residentes?creado=1");
}
