import "server-only";
import { createClient } from "@/lib/supabase/server";
import { paginaListado, REGISTROS_POR_PAGINA } from "@/lib/paginacion";
import type { Tables } from "@/types/database";

export type Empleado = Tables<"employees">;
export type ResumenEmpleado = Pick<
  Empleado,
  "id" | "first_name" | "last_name" | "dni" | "job_title" | "hired_at" | "terminated_at"
>;

export async function listarEmpleados(
  bajas: boolean,
  paginaParam: unknown,
): Promise<{ empleados: ResumenEmpleado[]; total: number; pagina: number }> {
  const supabase = await createClient();
  const consulta = (conteo: boolean) => {
    const seleccion = supabase
      .from("employees")
      .select(
        "id, first_name, last_name, dni, job_title, hired_at, terminated_at",
        conteo ? { count: "exact", head: true } : {},
      );
    return bajas
      ? seleccion.not("terminated_at", "is", null)
      : seleccion.is("terminated_at", null);
  };
  const { count, error: errorConteo } = await consulta(true);
  if (errorConteo || count === null) throw new Error("No se pudo contar el personal.");
  const pagina = paginaListado(paginaParam, count);
  const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
  const { data, error } = await consulta(false)
    .order("last_name")
    .order("first_name")
    .order("id")
    .range(inicio, inicio + REGISTROS_POR_PAGINA - 1);
  if (error) throw new Error("No se pudo cargar el personal.");
  return { empleados: data ?? [], total: count, pagina };
}

export async function obtenerEmpleado(id: string): Promise<Empleado | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar la ficha del empleado.");
  return data;
}
