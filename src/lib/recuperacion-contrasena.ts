export function errorRecuperacion(error: { code?: string; status?: number }): string {
  if (error.status === 429 || error.code === "over_email_send_rate_limit") {
    return "Se alcanzó el límite de envíos. Revisá tu correo y esperá antes de pedir otro enlace.";
  }
  return "No se pudo enviar el enlace. Intentá nuevamente más tarde.";
}

type ValidacionContrasena =
  { error: string; contrasena?: never } | { contrasena: string; error?: never };

export function validarNuevaContrasena(formData: FormData): ValidacionContrasena {
  const contrasena = formData.get("contrasena");
  const confirmacion = formData.get("confirmacion");
  if (typeof contrasena !== "string" || contrasena.length < 12) {
    return { error: "Usá una contraseña de al menos 12 caracteres." };
  }
  if (contrasena.length > 128) {
    return { error: "La contraseña no puede superar los 128 caracteres." };
  }
  if (contrasena !== confirmacion) {
    return { error: "Las contraseñas no coinciden." };
  }
  return { contrasena };
}
