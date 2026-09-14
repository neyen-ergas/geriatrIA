export type ResultadoVinculo = { error: string | null; ok: boolean };

export function esIdCuenta(valor: unknown): valor is string {
  return typeof valor === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}

export function errorVinculo(error: unknown): string {
  const codigo = error && typeof error === "object" && "code" in error ? error.code : null;
  const mensaje = error && typeof error === "object" && "message" in error ? error.message : null;
  const DUPLICADO = "23505", DESACTUALIZADO = "40001", RESTRICCION = "23514", SIN_PERFIL = "P0002";
  if (codigo === DUPLICADO) return "Esta ficha ya tiene una cuenta vinculada. Volvé a cargarla para revisar el vínculo.";
  if (codigo === DESACTUALIZADO) return "La cuenta cambió. Volvé a cargar la ficha antes de vincular o desvincular.";
  if (codigo === SIN_PERFIL) return "Primero asigná un perfil a la cuenta desde Accesos.";
  if (codigo === RESTRICCION && mensaje === "employee_inactive") return "No se puede vincular una cuenta a un empleado dado de baja.";
  if (codigo === RESTRICCION && mensaje === "account_already_linked") return "La cuenta ya está vinculada a otra ficha. Revisá ese vínculo antes de cambiarlo.";
  return "No se pudo guardar el vínculo. Revisá tus permisos y volvé a cargar la ficha.";
}
