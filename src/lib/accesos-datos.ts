import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Acceso = Database["public"]["Functions"]["list_user_access"]["Returns"][number];

export async function listarAccesos(): Promise<Acceso[]> {
  const cliente = await createClient();
  const { data, error } = await cliente.rpc("list_user_access");
  if (error) throw new Error("No se pudieron leer los accesos. Intentá nuevamente.");
  return data;
}
