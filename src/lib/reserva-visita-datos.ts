import "server-only";
import { createClient } from "@/lib/supabase/server";
import { filtroBusquedaConsultas } from "@/lib/busqueda-consultas";
import { paginaListado, REGISTROS_POR_PAGINA } from "@/lib/paginacion";
import type { Tables } from "@/types/database";

export type CandidataVisita = Pick<Tables<"consulta">, "id" | "nombre" | "telefono" | "estado" | "actualizado_en">;

export async function listarCandidatasVisita(busqueda: string, paginaParam: unknown): Promise<{
  consultas: CandidataVisita[]; total: number; pagina: number;
}> {
  const supabase = await createClient();
  const consulta = (conteo: boolean) => {
    let seleccion = supabase.from("consulta")
      .select("id, nombre, telefono, estado, actualizado_en", conteo ? { count: "exact", head: true } : {})
      .in("estado", ["nuevo", "contactado"]);
    const filtro = filtroBusquedaConsultas(busqueda);
    if (filtro) seleccion = seleccion.or(filtro);
    return seleccion;
  };
  const { count, error: errorConteo } = await consulta(true);
  if (errorConteo || count === null) throw new Error("No se pudieron contar las familias disponibles.");
  const pagina = paginaListado(paginaParam, count);
  const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
  const { data, error } = await consulta(false).order("creado_en", { ascending: false })
    .order("id", { ascending: false }).range(inicio, inicio + REGISTROS_POR_PAGINA - 1);
  if (error) throw new Error("No se pudieron leer las familias disponibles.");
  return { consultas: data ?? [], total: count, pagina };
}
