import type { Tables } from "@/types/database";

export const TABLAS_AUDITORIA = ["consulta", "residents", "family_contacts", "admissions", "monthly_charges", "payments", "employees", "user_access", "consultation_admissions"] as const;
export type TablaAuditoria = (typeof TABLAS_AUDITORIA)[number];
export const ETIQUETAS_TABLA: Record<TablaAuditoria, string> = {
  consulta: "Consultas y visitas", residents: "Residentes", family_contacts: "Familiares",
  admissions: "Estadías", monthly_charges: "Cuotas", payments: "Pagos",
  employees: "Empleados", user_access: "Accesos y cuentas", consultation_admissions: "Conversión a ingreso",
};
export const ACCIONES_AUDITORIA = ["insert", "update", "delete"] as const;
export type AccionAuditoria = (typeof ACCIONES_AUDITORIA)[number];
export const ETIQUETAS_ACCION: Record<AccionAuditoria, string> = { insert: "Alta", update: "Cambio", delete: "Eliminación" };
export type EventoAuditoria = Tables<"audit_events">;
export type ResumenAuditoria = Omit<EventoAuditoria, "old_values" | "new_values" | "source_key">;
export type FiltrosAuditoria = { tabla?: TablaAuditoria; accion?: AccionAuditoria; autor?: string; desde?: string; hasta?: string; registro?: string };

export function esTablaAuditoria(valor: unknown): valor is TablaAuditoria {
  return TABLAS_AUDITORIA.some(tabla => tabla === valor);
}
export function esAccionAuditoria(valor: unknown): valor is AccionAuditoria {
  return ACCIONES_AUDITORIA.some(accion => accion === valor);
}
export function esIdentificadorAuditoria(valor: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}

export function leerFiltrosAuditoria(parametros: Record<string, string | string[] | undefined>): { filtros: FiltrosAuditoria; error: string | null } {
  const filtros: FiltrosAuditoria = {};
  for (const clave of ["tabla", "accion", "autor", "desde", "hasta", "registro"] as const) {
    const valor = parametros[clave];
    if (!valor) continue;
    if (typeof valor !== "string") return { filtros, error: "Cada filtro debe tener un solo valor." };
    if (clave === "tabla") {
      if (!esTablaAuditoria(valor)) return { filtros, error: "Elegí una sección válida." };
      filtros.tabla = valor;
    } else if (clave === "accion") {
      if (!esAccionAuditoria(valor)) return { filtros, error: "Elegí un tipo de cambio válido." };
      filtros.accion = valor;
    } else if (clave === "autor" || clave === "registro") {
      if (!esIdentificadorAuditoria(valor) && !(clave === "autor" && valor === "sin-usuario")) return { filtros, error: "El autor o registro del filtro no es válido." };
      filtros[clave] = valor;
    } else {
      if (!esFechaAuditoria(valor)) return { filtros, error: "Revisá las fechas del filtro." };
      filtros[clave] = valor;
    }
  }
  if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) return { filtros, error: "La fecha desde no puede ser posterior a la fecha hasta." };
  if (filtros.registro && !filtros.tabla) return { filtros, error: "Elegí la sección del registro que querés consultar." };
  return { filtros, error: null };
}

function esFechaAuditoria(valor: string): boolean {
  if (!/^[12]\d{3}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

/** Intervalo cerrado por día argentino, con límite superior exclusivo. */
export function limiteFechaAuditoria(fecha: string, siguiente = false): string {
  const instante = new Date(`${fecha}T00:00:00-03:00`);
  if (siguiente) instante.setUTCDate(instante.getUTCDate() + 1);
  return instante.toISOString();
}

export function enlaceAuditoria(filtros: FiltrosAuditoria = {}, pagina = 1): string {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) if (valor) parametros.set(clave, valor);
  if (pagina > 1) parametros.set("pagina", String(pagina));
  return `/auditoria${parametros.size ? `?${parametros}` : ""}`;
}

export function regresoAuditoria(valor: unknown): string {
  if (typeof valor !== "string" || !valor.startsWith("/auditoria?")) return "/auditoria";
  const parametros = new URLSearchParams(valor.slice("/auditoria?".length));
  const entrada: Record<string, string | string[]> = {};
  for (const clave of parametros.keys()) {
    const valores = parametros.getAll(clave);
    entrada[clave] = valores.length === 1 ? valores[0] : valores;
  }
  const { filtros, error } = leerFiltrosAuditoria(entrada);
  if (error) return "/auditoria";
  const pagina = typeof entrada.pagina === "string" ? Number(entrada.pagina) : 1;
  return enlaceAuditoria(filtros, Number.isSafeInteger(pagina) && pagina > 0 ? pagina : 1);
}

const formatoMomento = new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "medium" });
export function formatearMomentoAuditoria(fecha: string): string {
  return formatoMomento.format(new Date(fecha));
}

export function valoresAuditoria(valor: EventoAuditoria["new_values"]): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor : {};
}

export function etiquetaTablaAuditoria(tabla: string): string {
  return esTablaAuditoria(tabla) ? ETIQUETAS_TABLA[tabla] : "Registro";
}

export function etiquetaAccionAuditoria(accion: string): string {
  return esAccionAuditoria(accion) ? ETIQUETAS_ACCION[accion] : "Evento";
}
