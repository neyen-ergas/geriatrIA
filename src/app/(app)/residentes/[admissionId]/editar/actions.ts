"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import {
  hoyEnArgentina,
  leerValoresPrimerIngreso,
  validarPrimerIngreso,
  type EstadoFormularioIngreso,
} from "@/lib/primer-ingreso";
import { createClient } from "@/lib/supabase/server";

export type IdentificadoresEdicion = {
  admissionId: string;
  contactId: string;
  residentId: string;
};

const UNIQUE_VIOLATION = "23505";
const NO_DATA_FOUND = "P0002";

export async function actualizarPrimerIngreso(
  ids: IdentificadoresEdicion,
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
  const { error } = await supabase.rpc("update_active_admission", {
    ...validacion.datos,
    p_admission_id: ids.admissionId,
    p_contact_id: ids.contactId,
    p_resident_id: ids.residentId,
  });

  if (error) {
    console.error("No se pudo actualizar el ingreso activo", {
      code: error.code,
      message: error.message,
    });

    if (error.code === UNIQUE_VIOLATION) {
      return {
        errores: { resident_dni: "Ya existe un residente con este DNI." },
        mensaje: "No pudimos guardar los cambios.",
        valores,
      };
    }

    if (error.code === NO_DATA_FOUND) {
      return {
        errores: {},
        mensaje:
          "Este ingreso ya no está activo o sus datos asociados cambiaron.",
        valores,
      };
    }

    return {
      errores: {},
      mensaje:
        "No pudimos guardar los cambios. Intentá nuevamente en unos minutos.",
      valores,
    };
  }

  revalidatePath("/residentes");
  redirect("/residentes?actualizado=1");
}
