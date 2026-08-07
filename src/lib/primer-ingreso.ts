import type { Database } from "@/types/database";

type ArgumentosPrimerIngreso =
  Database["public"]["Functions"]["create_initial_admission"]["Args"];

export type CampoPrimerIngreso =
  | "resident_first_name"
  | "resident_last_name"
  | "resident_dni"
  | "resident_birth_date"
  | "contact_first_name"
  | "contact_last_name"
  | "contact_relationship"
  | "contact_phone"
  | "admitted_at"
  | "monthly_fee"
  | "due_day";

export type ErroresPrimerIngreso = Partial<
  Record<CampoPrimerIngreso, string>
>;

export type ValoresPrimerIngreso = {
  resident_first_name: string;
  resident_last_name: string;
  resident_dni: string;
  resident_birth_date: string;
  resident_phone: string;
  resident_address: string;
  resident_notes: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_relationship: string;
  contact_phone: string;
  contact_is_emergency_contact: boolean;
  contact_is_payment_responsible: boolean;
  contact_notes: string;
  admitted_at: string;
  room: string;
  monthly_fee: string;
  due_day: string;
  administrative_notes: string;
};

type ValidacionPrimerIngreso =
  | { ok: true; datos: ArgumentosPrimerIngreso }
  | { ok: false; errores: ErroresPrimerIngreso };

function texto(formData: FormData, nombre: string): string {
  return String(formData.get(nombre) ?? "").trim();
}

export function leerValoresPrimerIngreso(
  formData: FormData,
): ValoresPrimerIngreso {
  return {
    resident_first_name: texto(formData, "resident_first_name"),
    resident_last_name: texto(formData, "resident_last_name"),
    resident_dni: texto(formData, "resident_dni"),
    resident_birth_date: texto(formData, "resident_birth_date"),
    resident_phone: texto(formData, "resident_phone"),
    resident_address: texto(formData, "resident_address"),
    resident_notes: texto(formData, "resident_notes"),
    contact_first_name: texto(formData, "contact_first_name"),
    contact_last_name: texto(formData, "contact_last_name"),
    contact_relationship: texto(formData, "contact_relationship"),
    contact_phone: texto(formData, "contact_phone"),
    contact_is_emergency_contact:
      formData.get("contact_is_emergency_contact") === "on",
    contact_is_payment_responsible:
      formData.get("contact_is_payment_responsible") === "on",
    contact_notes: texto(formData, "contact_notes"),
    admitted_at: texto(formData, "admitted_at"),
    room: texto(formData, "room"),
    monthly_fee: texto(formData, "monthly_fee"),
    due_day: texto(formData, "due_day"),
    administrative_notes: texto(formData, "administrative_notes"),
  };
}

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

/**
 * Convierte FormData, que siempre llega como texto, a los argumentos tipados de
 * la función de Supabase. TypeScript ayuda después de esta frontera; estas
 * comprobaciones protegen la frontera en tiempo de ejecución.
 */
export function validarPrimerIngreso(
  formData: FormData,
  hoy: string,
): ValidacionPrimerIngreso {
  const valores = leerValoresPrimerIngreso(formData);
  const residentFirstName = valores.resident_first_name;
  const residentLastName = valores.resident_last_name;
  const residentDni = valores.resident_dni;
  const residentBirthDate = valores.resident_birth_date;
  const contactFirstName = valores.contact_first_name;
  const contactLastName = valores.contact_last_name;
  const contactRelationship = valores.contact_relationship;
  const contactPhone = valores.contact_phone;
  const admittedAt = valores.admitted_at;
  const monthlyFeeText = valores.monthly_fee;
  const dueDayText = valores.due_day;
  const monthlyFee = Number(monthlyFeeText);
  const dueDay = Number(dueDayText);
  const errores: ErroresPrimerIngreso = {};

  if (!residentFirstName) errores.resident_first_name = "Ingresá el nombre.";
  if (!residentLastName) errores.resident_last_name = "Ingresá el apellido.";
  if (!residentDni) errores.resident_dni = "Ingresá el DNI.";

  if (!esFechaValida(residentBirthDate)) {
    errores.resident_birth_date = "Ingresá una fecha válida.";
  } else if (residentBirthDate > hoy) {
    errores.resident_birth_date = "La fecha no puede estar en el futuro.";
  }

  if (!contactFirstName) errores.contact_first_name = "Ingresá el nombre.";
  if (!contactLastName) errores.contact_last_name = "Ingresá el apellido.";
  if (!contactRelationship) {
    errores.contact_relationship = "Indicá el vínculo.";
  }
  if (!contactPhone) errores.contact_phone = "Ingresá un teléfono.";

  if (!esFechaValida(admittedAt)) {
    errores.admitted_at = "Ingresá una fecha válida.";
  }

  if (!monthlyFeeText || !Number.isFinite(monthlyFee) || monthlyFee < 0) {
    errores.monthly_fee = "Ingresá una cuota igual o mayor que cero.";
  }

  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    errores.due_day = "Elegí un día entre 1 y 31.";
  }

  if (Object.keys(errores).length > 0) return { ok: false, errores };

  return {
    ok: true,
    datos: {
      p_resident_first_name: residentFirstName,
      p_resident_last_name: residentLastName,
      p_resident_dni: residentDni,
      p_resident_birth_date: residentBirthDate,
      p_resident_phone: valores.resident_phone || undefined,
      p_resident_address: valores.resident_address || undefined,
      p_resident_notes: valores.resident_notes || undefined,
      p_contact_first_name: contactFirstName,
      p_contact_last_name: contactLastName,
      p_contact_relationship: contactRelationship,
      p_contact_phone: contactPhone,
      p_contact_is_emergency_contact: valores.contact_is_emergency_contact,
      p_contact_is_payment_responsible: valores.contact_is_payment_responsible,
      p_contact_notes: valores.contact_notes || undefined,
      p_admitted_at: admittedAt,
      p_room: valores.room || undefined,
      p_monthly_fee: monthlyFee,
      p_due_day: dueDay,
      p_administrative_notes: valores.administrative_notes || undefined,
    },
  };
}
