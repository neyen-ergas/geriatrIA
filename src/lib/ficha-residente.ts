import type { Tables } from "@/types/database";

export type DatosFichaResidente = Pick<Tables<"residents">,
  "id" | "first_name" | "last_name" | "dni" | "birth_date"
  | "phone" | "address" | "notes"
>;
export type ContactoFicha = Pick<Tables<"family_contacts">,
  "id" | "first_name" | "last_name" | "relationship" | "phone"
  | "is_emergency_contact" | "is_payment_responsible" | "notes"
>;
export type EstadiaFicha = Pick<Tables<"admissions">,
  "id" | "admitted_at" | "discharged_at" | "discharge_reason" | "room"
  | "monthly_fee" | "currency" | "due_day" | "administrative_notes"
>;
export type PaginaFicha<T> = { filas: T[]; total: number; pagina: number };
export type FichaResidente = {
  residente: DatosFichaResidente;
  ingresoActivoId: string | null;
  contactos: PaginaFicha<ContactoFicha>;
  estadias: PaginaFicha<EstadiaFicha>;
};

export function enlaceFichaResidente(
  residenteId: string, estadias = 1, contactos = 1,
): string {
  const parametros = new URLSearchParams();
  if (estadias > 1) parametros.set("estadias", String(estadias));
  if (contactos > 1) parametros.set("contactos", String(contactos));
  const ruta = `/residentes/ficha/${residenteId}`;
  return `${ruta}${parametros.size ? `?${parametros}` : ""}`;
}
