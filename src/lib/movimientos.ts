import type { Tables } from "@/types/database";
import { MEDIOS_PAGO } from "@/lib/cargar-pagos";

export type Movimiento = Pick<Tables<"payments">,
  "id" | "amount" | "paid_on" | "payment_method" | "reference" | "notes"
  | "created_at" | "voided_at" | "voided_reason" | "receipt_path"
>;

export function etiquetaMedio(medio: string): string {
  return Object.hasOwn(MEDIOS_PAGO, medio)
    ? MEDIOS_PAGO[medio as keyof typeof MEDIOS_PAGO] : "Otro medio";
}

export function formatearMomentoPago(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short", timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(fecha));
}
