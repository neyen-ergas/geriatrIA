"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { errorFamiliar, esIdFamiliar, leerFamiliar, validarFamiliar,
  type EstadoFamiliar } from "@/lib/familiares";

export async function guardarFamiliar(
  residenteId: string, contactoId: string, version: string | null,
  _anterior: EstadoFamiliar, datos: FormData,
): Promise<EstadoFamiliar> {
  await requerirSesion("operational.write");
  const valores = leerFamiliar(datos);
  const errores = validarFamiliar(valores);
  if (Object.keys(errores).length) {
    return { valores, errores, mensaje: "Revisá los campos marcados." };
  }
  if (!esIdFamiliar(residenteId) || !esIdFamiliar(contactoId)
    || (version !== null && (typeof version !== "string"
      || !Number.isFinite(Date.parse(version))))) {
    return { valores, errores: {}, mensaje: "Volvé a abrir el contacto desde la ficha." };
  }
  try {
    const cliente = await createClient();
    const { data, error } = await cliente.rpc("save_family_contact", {
      p_resident_id: residenteId, p_id: contactoId,
      p_expected_updated_at: version ?? undefined,
      p_first_name: valores.first_name, p_last_name: valores.last_name,
      p_relationship: valores.relationship, p_phone: valores.phone,
      p_is_emergency_contact: valores.is_emergency_contact,
      p_is_payment_responsible: valores.is_payment_responsible,
      p_notes: valores.notes || undefined,
    });
    if (error || data !== contactoId) {
      return { valores, errores: {}, mensaje: errorFamiliar(error) };
    }
  } catch (error) {
    return { valores, errores: {}, mensaje: errorFamiliar(error) };
  }
  revalidatePath(`/residentes/ficha/${residenteId}`);
  revalidatePath("/residentes/[admissionId]/editar", "page");
  revalidatePath("/auditoria");
  redirect(`/residentes/ficha/${residenteId}?contacto=1#familiares`);
}
