import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { esRol, tienePermiso, type Permiso, type Rol } from "@/lib/permisos";

/**
 * Corta la ejecución redirigiendo al login si no hay una identidad verificada.
 *
 * El layout de `(app)` ya protege las pantallas, pero no cubre a las Server
 * Actions: se invocan por POST contra su propia ruta, sin pasar por el layout.
 * Cada acción comprueba su permiso antes de leer la entrada o los datos.
 *
 * Usa `getClaims()`, que valida la firma del JWT, y no `getSession()`, que
 * confía en el contenido de la cookie. Ver docs/autenticacion.md.
 */
export async function requerirSesion(
  permiso: Permiso = "operational.read",
): Promise<Rol> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) redirect("/login");

  // Se consulta el perfil vigente; no se confía en metadata editable ni en
  // permisos guardados en un JWT anterior a una suspensión.
  const { data: rol, error } = await supabase.rpc("current_app_role");
  if (error) throw new Error("No se pudo verificar tu acceso. Intentá nuevamente.");
  if (!esRol(rol)) redirect("/sin-acceso");
  if (!tienePermiso(rol, permiso)) redirect("/sin-permiso");
  return rol;
}
