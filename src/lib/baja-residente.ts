export type ValoresBajaResidente = {
  discharged_at: string;
  discharge_reason: string;
};

export type ErroresBajaResidente = Partial<
  Record<keyof ValoresBajaResidente, string>
>;

export type EstadoBajaResidente = {
  errores: ErroresBajaResidente;
  mensaje: string | null;
  valores: Partial<ValoresBajaResidente>;
};

type ValidacionBajaResidente =
  | { ok: true; datos: ValoresBajaResidente }
  | { ok: false; errores: ErroresBajaResidente };

function esFechaValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;

  const [anio, mes, dia] = valor.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  );
}

export function leerValoresBaja(
  formData: FormData,
): ValoresBajaResidente {
  return {
    discharged_at: String(formData.get("discharged_at") ?? "").trim(),
    discharge_reason: String(formData.get("discharge_reason") ?? "").trim(),
  };
}

export function validarBajaResidente(
  formData: FormData,
  admittedAt: string,
  hoy: string,
): ValidacionBajaResidente {
  const valores = leerValoresBaja(formData);
  const errores: ErroresBajaResidente = {};

  if (!esFechaValida(valores.discharged_at)) {
    errores.discharged_at = "Ingresá una fecha válida.";
  } else if (valores.discharged_at < admittedAt) {
    errores.discharged_at = "La baja no puede ser anterior al ingreso.";
  } else if (valores.discharged_at > hoy) {
    errores.discharged_at = "La baja no puede quedar en el futuro.";
  }

  if (!valores.discharge_reason) {
    errores.discharge_reason = "Explicá brevemente el motivo de la baja.";
  }

  return Object.keys(errores).length > 0
    ? { ok: false, errores }
    : { ok: true, datos: valores };
}
