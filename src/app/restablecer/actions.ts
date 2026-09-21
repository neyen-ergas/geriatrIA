"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validarNuevaContrasena } from "@/lib/recuperacion-contrasena";

export type EstadoContrasena = { error?: string; actualizada?: boolean };

export async function actualizarContrasena(
  _estado: EstadoContrasena,
  formData: FormData,
): Promise<EstadoContrasena> {
  const supabase = await createClient();
  const {
    data: { user },
    error: errorSesion,
  } = await supabase.auth.getUser();
  if (errorSesion || !user) redirect("/recuperar?error=sesion");

  const valores = validarNuevaContrasena(formData);
  if (valores.error) return { error: valores.error };
  let error;
  try {
    ({ error } = await supabase.auth.updateUser({ password: valores.contrasena }));
  } catch {
    return {
      error:
        "No se pudo confirmar el cambio. Intentá ingresar con la contraseña nueva antes de repetirlo.",
    };
  }
  if (error) {
    if (error.code === "same_password") {
      return { error: "Elegí una contraseña diferente de la anterior." };
    }
    if (error.code === "weak_password") {
      return { error: "Elegí una contraseña más segura y que no uses en otro sitio." };
    }
    if (error.status === 429) {
      return { error: "Esperá unos momentos antes de volver a intentarlo." };
    }
    return {
      error: "No se pudo cambiar la contraseña. Pedí otro enlace e intentá nuevamente.",
    };
  }
  return { actualizada: true };
}
