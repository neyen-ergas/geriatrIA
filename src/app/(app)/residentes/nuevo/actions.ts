"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import {
  leerValoresPrimerIngreso,
  validarPrimerIngreso,
  type ErroresPrimerIngreso,
  type ValoresPrimerIngreso,
} from "@/lib/primer-ingreso";
import { createClient } from "@/lib/supabase/server";

export type EstadoPrimerIngreso = {
  errores: ErroresPrimerIngreso;
  mensaje: string | null;
  valores: Partial<ValoresPrimerIngreso>;
};

const UNIQUE_VIOLATION = "23505";

function hoyEnArgentina(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

export async function registrarPrimerIngreso(
  _estadoAnterior: EstadoPrimerIngreso,
  formData: FormData,
): Promise<EstadoPrimerIngreso> {
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
    console.error("No se pudo registrar el primer ingreso", {
      code: error.code,
      message: error.message,
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
