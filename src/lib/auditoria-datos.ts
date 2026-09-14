import "server-only";
import { createClient } from "@/lib/supabase/server";
import { limiteFechaAuditoria, type EventoAuditoria, type FiltrosAuditoria, type ResumenAuditoria } from "@/lib/auditoria";
import { paginaListado, REGISTROS_POR_PAGINA } from "@/lib/paginacion";

export async function listarAuditoria(filtros: FiltrosAuditoria, paginaParam: unknown): Promise<{ eventos: ResumenAuditoria[]; total: number; pagina: number }> {
  const cliente = await createClient();
  const consulta = (conteo: boolean) => {
    let seleccion = cliente.from("audit_events").select("id,table_name,record_id,action,occurred_at,actor_id,actor_label,record_label,changed_fields,origin", conteo ? { count: "exact", head: true } : {});
    if (filtros.tabla) seleccion = seleccion.eq("table_name", filtros.tabla);
    if (filtros.accion) seleccion = seleccion.eq("action", filtros.accion);
    if (filtros.registro) seleccion = seleccion.eq("record_id", filtros.registro);
    if (filtros.autor) seleccion = filtros.autor === "sin-usuario" ? seleccion.is("actor_id", null) : seleccion.eq("actor_id", filtros.autor);
    if (filtros.desde) seleccion = seleccion.gte("occurred_at", limiteFechaAuditoria(filtros.desde));
    if (filtros.hasta) seleccion = seleccion.lt("occurred_at", limiteFechaAuditoria(filtros.hasta, true));
    return seleccion;
  };
  const { count, error: errorConteo } = await consulta(true);
  if (errorConteo || count === null) throw new Error("No se pudo contar el historial. Intentá nuevamente.");
  const pagina = paginaListado(paginaParam, count);
  const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
  const { data, error } = await consulta(false).order("occurred_at", { ascending: false }).order("id", { ascending: false }).range(inicio, inicio + REGISTROS_POR_PAGINA - 1);
  if (error) throw new Error("No se pudo cargar el historial. Intentá nuevamente.");
  return { eventos: data ?? [], total: count, pagina };
}

export async function obtenerEventoAuditoria(id: string): Promise<EventoAuditoria | null> {
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return null;
  const cliente = await createClient();
  const { data, error } = await cliente.from("audit_events").select("*").eq("id", Number(id)).maybeSingle();
  if (error) throw new Error("No se pudo cargar el detalle del cambio.");
  return data;
}
