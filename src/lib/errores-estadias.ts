const CHECK_VIOLATION = "23514";
const EXCLUSION_VIOLATION = "23P01";
const SERIALIZATION_FAILURE = "40001";
const DEADLOCK_DETECTED = "40P01";

type ErrorBase = { code: string; message: string };

export function mensajeErrorEstadia(error: ErrorBase): string | null {
  if (
    error.code === SERIALIZATION_FAILURE || error.code === DEADLOCK_DETECTED
  ) {
    return "La ficha cambió mientras guardabas. Recargá y revisá las fechas.";
  }
  if (error.code === EXCLUSION_VIOLATION) {
    return "Las fechas se superponen con otra estadía. Revisá el historial.";
  }
  if (error.code !== CHECK_VIOLATION) return null;

  if (error.message.includes("admissions_birth_date_valid")) {
    return "El nacimiento debe ser anterior o igual a todos los ingresos.";
  }
  if (error.message.includes("residents_birth_date_valid")) {
    return "Ingresá una fecha de nacimiento válida que no esté en el futuro.";
  }
  if (error.message.includes("admissions_admitted_date_valid")) {
    return "Ingresá una fecha de ingreso válida que no esté en el futuro.";
  }
  if (error.message.includes("admissions_discharged_date_valid")) {
    return "Ingresá una fecha de baja válida que no esté en el futuro.";
  }
  if (error.message.includes("admissions_discharge_date_valid")) {
    return "La baja no puede ser anterior al ingreso. Recargá y revisá las fechas.";
  }
  return null;
}
