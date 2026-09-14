import "server-only";
import { createClient } from "@/lib/supabase/server";
import { esIdFamiliar } from "@/lib/familiares";
import { CONFIG_REGISTRO, type RegistroResidente, type SeccionRegistro } from "@/lib/registros-residente";
import { paginaListado, REGISTROS_POR_PAGINA } from "@/lib/paginacion";

export async function listarRegistrosResidente(
  residenteId: string, seccion: SeccionRegistro, archivados: boolean, paginaParam: unknown,
): Promise<{ registros: RegistroResidente[]; total: number; pagina: number }> {
  const cliente = await createClient();
  const tabla = CONFIG_REGISTRO[seccion].tabla;
  const consulta = (conteo: boolean) => {
    const base = cliente.from(tabla).select("*", conteo ? { count: "exact", head: true } : {})
      .eq("resident_id", residenteId);
    return archivados ? base.not("archived_at", "is", null) : base.is("archived_at", null);
  };
  const { count, error: errorConteo } = await consulta(true);
  if (errorConteo || count === null) throw new Error("No se pudo contar el historial.");
  const pagina = paginaListado(paginaParam, count), inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
  const { data, error } = await consulta(false).order("created_at", { ascending: false })
    .order("id", { ascending: false }).range(inicio, inicio + REGISTROS_POR_PAGINA - 1);
  if (error) throw new Error("No se pudieron cargar los registros.");
  return { registros: data ?? [], total: count, pagina };
}

export async function obtenerRegistroResidente(
  residenteId: string, seccion: SeccionRegistro, registroId: string,
): Promise<RegistroResidente | null> {
  if (!esIdFamiliar(residenteId) || !esIdFamiliar(registroId)) return null;
  const cliente = await createClient();
  const { data, error } = await cliente.from(CONFIG_REGISTRO[seccion].tabla).select("*")
    .eq("resident_id", residenteId).eq("id", registroId).maybeSingle();
  if (error) throw new Error("No se pudo cargar el registro.");
  return data;
}

export async function obtenerEstadiaDeRegistro(residenteId: string, ingresoId: string): Promise<{
  id: string; admitted_at: string;
} | null> {
  if (!esIdFamiliar(residenteId) || !esIdFamiliar(ingresoId)) return null;
  const cliente = await createClient();
  const { data, error } = await cliente.from("admissions").select("id,admitted_at")
    .eq("resident_id", residenteId).eq("id", ingresoId).maybeSingle();
  if (error) throw new Error("No se pudo comprobar la estadía.");
  return data;
}
