export type EstadoAnulacion = {
  motivo: string;
  error: string | null;
  bloqueado?: boolean;
};

export function leerMotivoAnulacion(datos: FormData): string {
  const valor = datos.get("motivo");
  return typeof valor === "string" ? valor.trim() : "";
}

const INVALID_PARAMETER = "22023";
const CHECK_VIOLATION = "23514";
const NOT_FOUND = "P0002";
const INSUFFICIENT_PRIVILEGE = "42501";

export function errorAnulacion(error: unknown): Omit<EstadoAnulacion, "motivo"> {
  const codigo = error && typeof error === "object" && "code" in error
    ? error.code : null;
  if (codigo === INVALID_PARAMETER) return { error: "Ingresá el motivo de la anulación." };
  if (codigo === CHECK_VIOLATION) return {
    error: "La cuota tiene pagos vigentes. Revisalos y anulalos primero si corresponde.",
  };
  if (codigo === NOT_FOUND) return {
    error: "El movimiento ya fue anulado o no está disponible. Volvé a cargar el detalle.",
  };
  if (codigo === INSUFFICIENT_PRIVILEGE) return {
    error: "Tu sesión no permite anular movimientos. Volvé a iniciar sesión.",
  };
  return {
    error: "No se pudo confirmar la anulación. Volvé a cargar el detalle para revisar el estado antes de intentarlo de nuevo.",
    bloqueado: true,
  };
}
