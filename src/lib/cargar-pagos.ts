import type { Database, Tables } from "@/types/database";
import { esFechaValida, MAX_MONTHLY_FEE, parsearCuotaMensual } from "@/lib/primer-ingreso";
import type { Cuota } from "@/lib/pagos";

export const MEDIOS_PAGO = {
  cash: "Efectivo", bank_transfer: "Transferencia bancaria",
  debit_card: "Tarjeta de débito", credit_card: "Tarjeta de crédito",
  other: "Otro medio",
};
export type EstadoCargaPago = {
  errores: Record<string, string>;
  mensaje: string | null;
  valores: Record<string, string>;
  bloqueado?: boolean;
};
type Validacion<Datos> = { ok: true; datos: Datos }
  | { ok: false; errores: Record<string, string> };
type DatosCuota = Database["public"]["Functions"]["create_monthly_charge"]["Args"];
type DatosPago = Database["public"]["Functions"]["record_payment"]["Args"];
type Estadia = Pick<Tables<"admissions">, "id" | "admitted_at" | "discharged_at">;

export function leerCargaPago(formData: FormData): Record<string, string> {
  return Object.fromEntries([
    "periodo", "vencimiento", "importe", "fecha", "medio", "referencia", "notas",
  ].map(campo => {
    const valor = formData.get(campo);
    return [campo, typeof valor === "string" ? valor.trim() : ""];
  }));
}

export function vencimientoSugerido(periodo: string, dia: number): string {
  if (!esFechaValida(`${periodo}-01`) || !Number.isInteger(dia)
    || dia < 1 || dia > 31) return "";
  const [anio, mes] = periodo.split("-").map(Number);
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return `${periodo}-${String(Math.min(dia, ultimo)).padStart(2, "0")}`;
}

export function validarCargaCuota(
  valores: Record<string, string>, estadia: Estadia,
): Validacion<DatosCuota> {
  const errores: Record<string, string> = {};
  const periodo = `${valores.periodo}-01`;
  const ultimoDia = vencimientoSugerido(valores.periodo, 31);
  const importe = parsearCuotaMensual(valores.importe);
  if (!esFechaValida(periodo)) errores.periodo = "Elegí un mes válido.";
  else if (ultimoDia < estadia.admitted_at
    || (estadia.discharged_at && periodo > estadia.discharged_at)) {
    errores.periodo = "El mes debe corresponder a esta estadía.";
  }
  if (!esFechaValida(valores.vencimiento)
    || valores.vencimiento < periodo || valores.vencimiento > ultimoDia) {
    errores.vencimiento = "El vencimiento debe estar dentro del mes elegido.";
  }
  if (importe === null || importe <= 0 || importe > MAX_MONTHLY_FEE) {
    errores.importe = "Ingresá un importe mayor a cero, hasta 9.999.999.999,99.";
  }
  if (Object.keys(errores).length || importe === null) return { ok: false, errores };
  return { ok: true, datos: {
    p_admission_id: estadia.id, p_period: periodo,
    p_due_date: valores.vencimiento, p_amount_due: importe,
    ...(valores.notas ? { p_notes: valores.notas } : {}),
  } };
}

export function validarCargaPago(
  valores: Record<string, string>, cuota: Cuota, hoy: string,
): Validacion<DatosPago> {
  const errores: Record<string, string> = {};
  const importe = parsearCuotaMensual(valores.importe);
  if (importe === null || importe <= 0 || importe > MAX_MONTHLY_FEE) {
    errores.importe = "Ingresá un importe mayor a cero, hasta 9.999.999.999,99.";
  } else if (importe > cuota.balance) {
    errores.importe = "El importe supera el saldo actualizado de la cuota.";
  }
  if (cuota.payment_status === "cancelled" || cuota.balance <= 0) {
    errores.importe = "La cuota está anulada o ya no tiene saldo pendiente.";
  }
  if (!esFechaValida(valores.fecha) || valores.fecha > hoy) {
    errores.fecha = "Ingresá una fecha válida que no sea futura.";
  }
  if (!Object.hasOwn(MEDIOS_PAGO, valores.medio)) {
    errores.medio = "Elegí un medio de pago válido.";
  } else if (valores.medio === "other" && !valores.notas) {
    errores.notas = "Detallá el medio de pago en las observaciones.";
  }
  if (Object.keys(errores).length || importe === null) return { ok: false, errores };
  return { ok: true, datos: {
    p_monthly_charge_id: cuota.id, p_amount: importe,
    p_paid_on: valores.fecha, p_payment_method: valores.medio,
    ...(valores.referencia ? { p_reference: valores.referencia } : {}),
    ...(valores.notas ? { p_notes: valores.notas } : {}),
  } };
}

const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";
const INVALID_PARAMETER = "22023";
const NOT_FOUND = "P0002";
const INSUFFICIENT_PRIVILEGE = "42501";

export function errorCargaPago(error: unknown): Pick<EstadoCargaPago, "mensaje" | "bloqueado"> {
  const codigo = error && typeof error === "object" && "code" in error
    ? error.code : null;
  if (codigo === UNIQUE_VIOLATION) return {
    mensaje: "Ya existe una cuota vigente para esa estadía y mes.",
  };
  if (codigo === CHECK_VIOLATION) return {
    mensaje: "La cuota o la estadía cambió, o el importe supera el saldo. Volvé a la cuenta para revisar los datos.",
  };
  if (codigo === INVALID_PARAMETER) return { mensaje: "Revisá el importe, las fechas y el medio de pago." };
  if (codigo === NOT_FOUND) return { mensaje: "La cuota o la estadía ya no está disponible." };
  if (codigo === INSUFFICIENT_PRIVILEGE) return { mensaje: "Tu sesión no permite registrar este movimiento. Volvé a iniciar sesión." };
  return {
    mensaje: "No se pudo confirmar el resultado. Volvé a la cuenta y revisá si el movimiento quedó registrado antes de volver a cargarlo.",
    bloqueado: true,
  };
}
