"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import { validarConsultaManual } from "@/lib/consulta-manual";
import { createClient } from "@/lib/supabase/server";

export type ResultadoConsultaManual = {
  error: string | null;
  duplicadoId: string | null;
  telefonoDuplicado: string | null;
};

const esUuid = (valor: unknown): valor is string =>
  typeof valor === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);

export async function crearConsultaManual(
  _anterior: ResultadoConsultaManual,
  formulario: FormData,
): Promise<ResultadoConsultaManual> {
  await requerirSesion("operational.write");
  const validacion = validarConsultaManual(formulario);
  if (!validacion.ok)
    return { error: validacion.error, duplicadoId: null, telefonoDuplicado: null };
  const { datos } = validacion;

  let respuesta: { created_id?: unknown; duplicate_id?: unknown };
  try {
    const cliente = await createClient();
    const { data, error } = await cliente.rpc("create_manual_consultation", {
      p_name: datos.nombre,
      p_phone: datos.telefono,
      p_message: datos.motivo,
      p_source: datos.origen,
      p_call_window: datos.momento,
      p_allow_duplicate: datos.permitirDuplicado,
    });
    if (error || !data || typeof data !== "object" || Array.isArray(data)) {
      return {
        error: "No pudimos guardar la consulta. Revisá los datos e intentá nuevamente.",
        duplicadoId: null,
        telefonoDuplicado: null,
      };
    }
    respuesta = data;
  } catch {
    return {
      error:
        "No pudimos confirmar el guardado. Buscá el teléfono en Admisión antes de reintentar.",
      duplicadoId: null,
      telefonoDuplicado: null,
    };
  }

  if (esUuid(respuesta.duplicate_id))
    return {
      error: null,
      duplicadoId: respuesta.duplicate_id,
      telefonoDuplicado: datos.telefono.replace(/\D/g, ""),
    };
  if (!esUuid(respuesta.created_id))
    return {
      error: "No pudimos confirmar el guardado. Revisá Admisión.",
      duplicadoId: null,
      telefonoDuplicado: null,
    };

  revalidatePath("/");
  revalidatePath("/admision");
  redirect(`/admision/${respuesta.created_id}?creada=1&paso=${datos.proximoPaso}`);
}
