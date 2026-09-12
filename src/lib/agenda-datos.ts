import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { esFranja } from "@/lib/admision";
import { semanaAgenda, TURNOS_POR_SEMANA, type VisitaAgenda } from "@/lib/agenda";

export async function listarVisitasSemana(inicio: string): Promise<VisitaAgenda[]> {
  const semana = semanaAgenda(inicio, inicio);
  if (semana.inicio !== inicio) throw new Error("La semana no es válida.");
  const { data, error } = await createAdminClient().from("consulta")
    .select("id, nombre, telefono, visita_fecha, visita_franja")
    .eq("estado", "visita_agendada")
    .gte("visita_fecha", semana.inicio).lte("visita_fecha", semana.fin)
    .order("visita_fecha").order("visita_franja")
    .limit(TURNOS_POR_SEMANA + 1);
  const mensaje = "No se pudo cargar la disponibilidad de la semana.";
  if (error || !data || data.length > TURNOS_POR_SEMANA) throw new Error(mensaje);
  const ocupados = new Set<string>();
  return data.map(visita => {
    const { visita_fecha, visita_franja } = visita;
    const clave = `${visita_fecha}/${visita_franja}`;
    if (!visita_fecha || !semana.dias.includes(visita_fecha) || !esFranja(visita_franja)
      || ocupados.has(clave)) throw new Error(mensaje);
    ocupados.add(clave);
    return { ...visita, visita_fecha, visita_franja };
  });
}
