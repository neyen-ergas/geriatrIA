import type { TablesInsert } from "@/types/database";
import {
  MAX_MONTHLY_FEE,
  esFechaValida,
  parsearCuotaMensual,
} from "@/lib/primer-ingreso";

type DatosNuevoIngreso = Pick<
  TablesInsert<"admissions">,
  "admitted_at" | "room" | "monthly_fee" | "due_day" | "administrative_notes"
>;

export type CampoReingreso = "admitted_at" | "monthly_fee" | "due_day";

export type ErroresReingreso = Partial<Record<CampoReingreso, string>>;

export type ValoresReingreso = {
  admitted_at: string;
  room: string;
  monthly_fee: string;
  due_day: string;
  administrative_notes: string;
};

export type EstadoReingreso = {
  errores: ErroresReingreso;
  mensaje: string | null;
  valores: Partial<ValoresReingreso>;
};

type ValidacionReingreso =
  | { ok: true; datos: DatosNuevoIngreso }
  | { ok: false; errores: ErroresReingreso };

function texto(formData: FormData, nombre: string): string {
  return String(formData.get(nombre) ?? "").trim();
}

export function leerValoresReingreso(formData: FormData): ValoresReingreso {
  return {
    admitted_at: texto(formData, "admitted_at"),
    room: texto(formData, "room"),
    monthly_fee: texto(formData, "monthly_fee"),
    due_day: texto(formData, "due_day"),
    administrative_notes: texto(formData, "administrative_notes"),
  };
}

/**
 * Valida los datos propios de la nueva estadía. La última fecha de baja se
 * obtiene de la base en la Server Action para no confiar en datos del cliente.
 */
export function validarReingreso(
  formData: FormData,
  ultimaBaja: string,
  hoy: string,
): ValidacionReingreso {
  const valores = leerValoresReingreso(formData);
  const monthlyFee = parsearCuotaMensual(valores.monthly_fee);
  const dueDay = Number(valores.due_day);
  const errores: ErroresReingreso = {};

  if (!esFechaValida(valores.admitted_at)) {
    errores.admitted_at = "Ingresá una fecha válida.";
  } else if (valores.admitted_at < ultimaBaja) {
    errores.admitted_at = "La fecha no puede ser anterior a la última baja.";
  } else if (valores.admitted_at > hoy) {
    errores.admitted_at = "La fecha no puede estar en el futuro.";
  }

  if (!valores.monthly_fee || monthlyFee === null) {
    errores.monthly_fee = "Ingresá un importe válido, por ejemplo 500000.";
  } else if (monthlyFee > MAX_MONTHLY_FEE) {
    errores.monthly_fee = "La cuota supera el importe máximo permitido.";
  }

  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    errores.due_day = "Elegí un día entre 1 y 31.";
  }

  if (Object.keys(errores).length > 0) return { ok: false, errores };
  if (monthlyFee === null) {
    throw new Error("La cuota validada debe ser un número.");
  }

  return {
    ok: true,
    datos: {
      admitted_at: valores.admitted_at,
      room: valores.room || null,
      monthly_fee: monthlyFee,
      due_day: dueDay,
      administrative_notes: valores.administrative_notes || null,
    },
  };
}
