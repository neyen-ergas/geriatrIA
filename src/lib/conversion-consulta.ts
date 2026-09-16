export function errorConversionConsulta(error: unknown): string {
  const codigo =
    error && typeof error === "object" && "code" in error ? error.code : null;
  const VERSION_CAMBIADA = "40001";
  const DUPLICADO = "23505";
  const FECHAS_SUPERPUESTAS = "23P01";
  const DATOS_INVALIDOS = "23514";
  if (codigo === VERSION_CAMBIADA)
    return "La consulta cambió. Volvé a cargar antes de registrar el ingreso.";
  if (codigo === DUPLICADO)
    return "Ya existe ese DNI o un ingreso activo. Buscá la ficha existente antes de continuar.";
  if (codigo === FECHAS_SUPERPUESTAS || codigo === DATOS_INVALIDOS) {
    return "Revisá las fechas y los datos del ingreso. La persona puede tener otra estadía activa.";
  }
  if (codigo === "22023")
    return "Esta consulta no está disponible para registrar un ingreso. Volvé a cargarla.";
  if (codigo === "42501")
    return "Tu sesión no permite registrar este ingreso. Volvé a iniciar sesión.";
  return "No se pudo confirmar el ingreso. Volvé a abrir la consulta para comprobar si ya quedó vinculado antes de reenviar.";
}
