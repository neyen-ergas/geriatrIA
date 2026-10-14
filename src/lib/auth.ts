import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { esRol, tienePermiso, type Permiso, type Rol } from "@/lib/permisos";

const SIN_SESION = Symbol("sin-sesion");

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
  const rol = await rolVigente();
  if (rol === SIN_SESION) redirect("/login");
  if (!esRol(rol)) redirect("/sin-acceso");
  if (!tienePermiso(rol, permiso)) redirect("/sin-permiso");
  return rol;
}

/**
 * El layout y la página llaman a `requerirSesion` en el mismo request. `cache`
 * comparte esta consulta entre ambos; cada request nuevo vuelve a consultar, así
 * que una suspensión se aplica en la siguiente navegación.
 */
const rolVigente = cache(async (): Promise<unknown> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) return SIN_SESION;

  // Se consulta el perfil vigente; no se confía en metadata editable ni en
  // permisos guardados en un JWT anterior a una suspensión.
  const { data: rol, error } = await supabase.rpc("current_app_role");
  if (error) throw new Error("No se pudo verificar tu acceso. Intentá nuevamente.");
  return rol;
});
