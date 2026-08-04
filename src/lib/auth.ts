import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Corta la ejecución redirigiendo al login si no hay una identidad verificada.
 *
 * El layout de `(app)` ya protege las pantallas, pero no cubre a las Server
 * Actions: se invocan por POST contra su propia ruta, sin pasar por el layout.
 * Cualquier acción que lea o escriba datos de familias llama a esta función
 * primero, sobre todo porque el cliente de `admin.ts` saltea RLS.
 *
 * Usa `getClaims()`, que valida la firma del JWT, y no `getSession()`, que
 * confía en el contenido de la cookie. Ver docs/autenticacion.md.
 */
export async function requerirSesion(): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) redirect("/login");
}
