import type { Tables } from "@/types/database";

const CAMPOS = ["first_name", "last_name", "relationship", "phone", "notes"] as const;
export type CampoFamiliar = (typeof CAMPOS)[number];
export type ValoresFamiliar = Record<CampoFamiliar, string> & {
  is_emergency_contact: boolean; is_payment_responsible: boolean;
};
export type FamiliarEditable = Pick<Tables<"family_contacts">,
  CampoFamiliar | "id" | "resident_id" | "updated_at"
  | "is_emergency_contact" | "is_payment_responsible"
>;
export type EstadoFamiliar = {
  valores: ValoresFamiliar;
  errores: Partial<Record<CampoFamiliar, string>>;
  mensaje: string | null;
};

export function leerFamiliar(datos: FormData): ValoresFamiliar {
  const texto = (campo: string) => {
    const valor = datos.get(campo);
    return typeof valor === "string" ? valor.trim() : "";
  };
  return {
    first_name: texto("first_name"), last_name: texto("last_name"),
    relationship: texto("relationship"), phone: texto("phone"), notes: texto("notes"),
    is_emergency_contact: datos.get("is_emergency_contact") === "on",
    is_payment_responsible: datos.get("is_payment_responsible") === "on",
  };
}

export function validarFamiliar(valores: ValoresFamiliar): EstadoFamiliar["errores"] {
  const errores: EstadoFamiliar["errores"] = {};
  for (const campo of CAMPOS) {
    if (campo !== "notes" && !valores[campo].trim()) {
      errores[campo] = "Completá este campo.";
    }
  }
  return errores;
}

export function esIdFamiliar(valor: unknown): valor is string {
  return typeof valor === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}

export function errorFamiliar(error: unknown): string {
  const codigo = error && typeof error === "object" && "code" in error ? error.code : null;
  const DESACTUALIZADO = "40001", SIN_ACCESO = "42501", INEXISTENTE = "P0002";
  if (codigo === DESACTUALIZADO) return "El contacto cambió. Volvé a la ficha y abrilo nuevamente antes de guardar.";
  if (codigo === SIN_ACCESO) return "Tu sesión no permite guardar contactos. Volvé a iniciar sesión.";
  if (codigo === INEXISTENTE) return "El residente o contacto ya no está disponible. Volvé a la ficha.";
  return "No se pudo confirmar el cambio. Revisá la ficha antes de reenviar.";
}
