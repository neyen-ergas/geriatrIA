import "server-only";

import { createClient } from "@/lib/supabase/server";
import { paginaListado, REGISTROS_POR_PAGINA } from "@/lib/paginacion";
import type { FichaResidente } from "@/lib/ficha-residente";

export async function obtenerFichaResidente(
  residenteId: string,
  paginaEstadias: unknown,
  paginaContactos: unknown,
): Promise<FichaResidente | null> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(residenteId)
  )
    return null;
  const cliente = await createClient();
  const { data: residente, error } = await cliente
    .from("residents")
    .select("id,first_name,last_name,dni,birth_date,phone,address,notes")
    .eq("id", residenteId)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar la ficha del residente.");
  if (!residente) return null;

  // El estado actual se consulta aparte: nunca se deduce de una página histórica.
  const [conteoEstadias, conteoContactos, activo] = await Promise.all([
    cliente
      .from("admissions")
      .select("id", { count: "exact", head: true })
      .eq("resident_id", residenteId),
    cliente
      .from("family_contacts")
      .select("id", { count: "exact", head: true })
      .eq("resident_id", residenteId),
    cliente
      .from("admissions")
      .select("id")
      .eq("resident_id", residenteId)
      .is("discharged_at", null)
      .maybeSingle(),
  ]);
  if (
    conteoEstadias.error ||
    conteoEstadias.count === null ||
    conteoContactos.error ||
    conteoContactos.count === null ||
    activo.error
  ) {
    throw new Error("No se pudo comprobar el historial del residente.");
  }
  const estadias = paginaListado(paginaEstadias, conteoEstadias.count);
  const contactos = paginaListado(paginaContactos, conteoContactos.count);
  const inicioEstadias = (estadias - 1) * REGISTROS_POR_PAGINA;
  const inicioContactos = (contactos - 1) * REGISTROS_POR_PAGINA;
  const [historial, familiares] = await Promise.all([
    cliente
      .from("admissions")
      .select(
        "id,admitted_at,discharged_at,discharge_reason,room,monthly_fee,currency,due_day,administrative_notes",
      )
      .eq("resident_id", residenteId)
      .order("admitted_at", { ascending: false })
      .order("id", { ascending: false })
      .range(inicioEstadias, inicioEstadias + REGISTROS_POR_PAGINA - 1),
    cliente
      .from("family_contacts")
      .select(
        "id,first_name,last_name,relationship,phone,is_emergency_contact,is_payment_responsible,notes",
      )
      .eq("resident_id", residenteId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(inicioContactos, inicioContactos + REGISTROS_POR_PAGINA - 1),
  ]);
  if (historial.error || familiares.error) {
    throw new Error("No se pudieron cargar las estadías o los familiares.");
  }
  return {
    residente,
    ingresoActivoId: activo.data?.id ?? null,
    estadias: {
      filas: historial.data ?? [],
      total: conteoEstadias.count,
      pagina: estadias,
    },
    contactos: {
      filas: familiares.data ?? [],
      total: conteoContactos.count,
      pagina: contactos,
    },
  };
}
