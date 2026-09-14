import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type FilaAcceso = Database["public"]["Functions"]["list_user_access"]["Returns"][number];
// El generador no refleja los nulos del LEFT JOIN en RETURNS TABLE.
type CampoOpcional = "email" | "role" | "updated_at" | "employee_id" | "employee_name" | "employee_terminated_at";
export type Acceso = {
  [Campo in keyof FilaAcceso]: Campo extends CampoOpcional ? FilaAcceso[Campo] | null : FilaAcceso[Campo];
};

export async function listarAccesos(): Promise<Acceso[]> {
  const cliente = await createClient();
  const { data, error } = await cliente.rpc("list_user_access");
  if (error) throw new Error("No se pudieron leer los accesos. Intentá nuevamente.");
  return data;
}
