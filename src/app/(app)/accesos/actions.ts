"use server";

import { revalidatePath } from "next/cache";
import { requerirSesion } from "@/lib/auth";
import { esRol } from "@/lib/permisos";
import { createClient } from "@/lib/supabase/server";

export type ResultadoAcceso = { error: string | null; ok: boolean };

export async function guardarAcceso(
  usuarioId: string, version: string | null,
  _anterior: ResultadoAcceso, datos: FormData,
): Promise<ResultadoAcceso> {
  await requerirSesion("administration");
  const rol = datos.get("rol");
  const habilitado = datos.get("habilitado");
  if (!esRol(rol) || (habilitado !== "si" && habilitado !== "no")) {
    return { error: "Elegí un perfil y el estado del acceso.", ok: false };
  }
  const cliente = await createClient();
  const { error } = await cliente.rpc("set_user_access", {
    p_user_id: usuarioId, p_role: rol, p_enabled: habilitado === "si",
    ...(version ? { p_expected_updated_at: version } : {}),
  });
  if (error) {
    const CONFLICTO = "40001";
    const RESTRICCION = "23514";
    return { ok: false, error: error.code === CONFLICTO
      ? "Este acceso cambió. Volvé a cargar la página antes de guardar."
      : error.code === RESTRICCION && error.message === "last_admin_required"
        ? "Debe quedar al menos un Administrador habilitado. Asigná otro antes de cambiar este acceso."
        : error.code === RESTRICCION && error.message === "employee_inactive"
          ? "La cuenta está vinculada a un empleado dado de baja y debe permanecer suspendida."
          : "No se pudo guardar el acceso. Revisá tus permisos y volvé a intentar." };
  }
  revalidatePath("/", "layout");
  return { error: null, ok: true };
}
