import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function obtenerConsultaConversion(
  id: string,
): Promise<Pick<
  Tables<"consulta">,
  "id" | "nombre" | "telefono" | "estado" | "actualizado_en"
> | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return null;
  const { data, error } = await (
    await createClient()
  )
    .from("consulta")
    .select("id, nombre, telefono, estado, actualizado_en")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo leer la consulta.");
  return data;
}

export async function listarVinculosConsultas(
  ids: string[],
): Promise<Record<string, string>> {
  if (!ids.length) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consultation_admissions")
    .select("consultation_id, admission_id")
    .in("consultation_id", ids);
  if (error) throw new Error("No se pudieron leer los ingresos vinculados.");
  return Object.fromEntries((data ?? []).map(v => [v.consultation_id, v.admission_id]));
}
