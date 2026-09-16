import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { esRol, tienePermiso, type Permiso, type Rol } from "@/lib/permisos";

type Identidad =
  | { estado: "anonima" }
  | { estado: "sin_acceso" }
  | { estado: "activa"; rol: Rol };

/**
 * Resuelve la identidad una sola vez por pedido.
 *
 * El layout de `(app)` y la página que renderiza adentro llaman las dos a
 * `requerirSesion`, así que sin memorizar cada pantalla pagaba dos viajes a
 * `current_app_role` antes de leer un solo dato.
 *
 * `cache` memoriza dentro de un pedido, no entre pedidos: una cuenta suspendida
 * sigue perdiendo el acceso en su próxima navegación. Fuera del render —en los
 * tests— React ejecuta la función sin memorizar.
 */
export async function requerirSesion(
  permiso: Permiso = "operational.read",
): Promise<Rol> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) return { estado: "anonima" };

  // Se consulta el perfil vigente; no se confía en metadata editable ni en
  // permisos guardados en un JWT anterior a una suspensión.
  const { data: rol, error } = await supabase.rpc("current_app_role");
  if (error) throw new Error("No se pudo verificar tu acceso. Intentá nuevamente.");

  return esRol(rol) ? { estado: "activa", rol } : { estado: "sin_acceso" };
});

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
export async function requerirSesion(permiso: Permiso = "operational.read"): Promise<Rol> {
  const identidad = await identidadActual();

  if (identidad.estado === "anonima") redirect("/login");
  if (identidad.estado === "sin_acceso") redirect("/sin-acceso");
  if (!tienePermiso(identidad.rol, permiso)) redirect("/sin-permiso");
  return identidad.rol;
}
