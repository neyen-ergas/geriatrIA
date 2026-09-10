import type { Tables } from "@/types/database";

export const ESTADOS_CUOTA = ["pending", "partial", "paid", "cancelled"] as const;
export type EstadoCuota = (typeof ESTADOS_CUOTA)[number];
export const ETIQUETAS_CUOTA: Record<EstadoCuota, string> = {
  pending: "Pendiente", partial: "Parcial", paid: "Pagada", cancelled: "Anulada",
};
export const COLORES_CUOTA: Record<EstadoCuota, string> = {
  pending: "border-slate-200 bg-slate-50 text-slate-700",
  partial: "border-sky-200 bg-sky-50 text-sky-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-500",
};

type SaldoCuota = Pick<Tables<"monthly_charge_balances">,
  "id" | "period" | "due_date" | "amount_due" | "paid_amount" | "balance"
  | "currency" | "payment_status" | "is_overdue" | "cancelled_reason"
>;
export type Cuota = {
  [Campo in keyof Omit<SaldoCuota, "cancelled_reason" | "payment_status">]:
    NonNullable<SaldoCuota[Campo]>;
} & { payment_status: EstadoCuota; cancelled_reason: string | null };

/** La vista genera tipos anulables; un dato incompleto no equivale a saldo cero. */
export function esCuota(valor: SaldoCuota): valor is Cuota {
  return typeof valor.id === "string" && typeof valor.period === "string"
    && typeof valor.due_date === "string" && typeof valor.currency === "string"
    && typeof valor.is_overdue === "boolean"
    && typeof valor.amount_due === "number" && Number.isFinite(valor.amount_due)
    && typeof valor.paid_amount === "number" && Number.isFinite(valor.paid_amount)
    && typeof valor.balance === "number" && Number.isFinite(valor.balance)
    && ESTADOS_CUOTA.some(estado => estado === valor.payment_status);
}

export function formatearImporte(importe: number, moneda: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: moneda, currencyDisplay: "code",
  }).format(importe);
}

export function formatearFechaPago(fecha: string, periodo = false): string {
  return new Intl.DateTimeFormat("es-AR", {
    ...(periodo ? { month: "long" as const } : {
      day: "2-digit" as const, month: "2-digit" as const,
    }),
    year: "numeric", timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00Z`));
}

export function enlaceContabilidad(pagina: number, bajas = false): string {
  const parametros = new URLSearchParams();
  if (bajas) parametros.set("estado", "bajas");
  if (pagina > 1) parametros.set("pagina", String(pagina));
  const consulta = parametros.toString();
  return `/contabilidad${consulta ? `?${consulta}` : ""}`;
}
