import "server-only";
import { createClient } from "@/lib/supabase/server";
import { esIdFamiliar, type FamiliarEditable } from "@/lib/familiares";
import type { DatosFichaResidente } from "@/lib/ficha-residente";

export async function obtenerFormularioFamiliar(
  residenteId: string, contactoId?: string,
): Promise<{
  residente: Pick<DatosFichaResidente, "id" | "first_name" | "last_name">;
  contacto: FamiliarEditable | null;
} | null> {
  if (!esIdFamiliar(residenteId)
    || (contactoId !== undefined && !esIdFamiliar(contactoId))) return null;
  const cliente = await createClient();
  const { data: residente, error } = await cliente.from("residents")
    .select("id,first_name,last_name").eq("id", residenteId).maybeSingle();
  if (error) throw new Error("No se pudo cargar el residente.");
  if (!residente) return null;
  if (!contactoId) return { residente, contacto: null };
  const { data: contacto, error: errorContacto } = await cliente.from("family_contacts")
    .select("id,resident_id,first_name,last_name,relationship,phone,notes,is_emergency_contact,is_payment_responsible,updated_at")
    .eq("id", contactoId).eq("resident_id", residenteId).maybeSingle();
  if (errorContacto) throw new Error("No se pudo cargar el contacto.");
  return contacto ? { residente, contacto } : null;
}
