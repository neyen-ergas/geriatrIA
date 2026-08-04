/**
 * Modelo compartido del módulo de admisión: tipos y etiquetas que necesitan
 * tanto el servidor como los componentes cliente.
 *
 * Las consultas a la base viven aparte, en `admision-datos.ts`, porque usan la
 * clave service_role y no pueden entrar al bundle del navegador.
 *
 * El esquema está documentado en docs/admision-consultas-modelo.md.
 */

export type Consulta = {
  id: string;
  creado_en: string;
  nombre: string;
  telefono: string;
  momento_llamado: MomentoLlamado;
  mensaje: string | null;
  origen: string;
  estado: Estado;
  notas_internas: string | null;
  visita_fecha: string | null;
  visita_franja: Franja | null;
};

export const ESTADOS = [
  "nuevo",
  "contactado",
  "visita_agendada",
  "ingreso",
  "descartada",
] as const;

export type Estado = (typeof ESTADOS)[number];

export function esEstado(valor: unknown): valor is Estado {
  return ESTADOS.includes(valor as Estado);
}

/**
 * Estados a los que se puede saltar cambiando solo la columna `estado`.
 *
 * `visita_agendada` queda afuera a propósito: llegar ahí exige escribir también
 * `visita_fecha` y `visita_franja`, así que tiene su propia acción.
 */
export const ESTADOS_DIRECTOS = [
  "nuevo",
  "contactado",
  "ingreso",
  "descartada",
] as const satisfies readonly Estado[];

export type EstadoDirecto = (typeof ESTADOS_DIRECTOS)[number];

export function esEstadoDirecto(valor: unknown): valor is EstadoDirecto {
  return ESTADOS_DIRECTOS.includes(valor as EstadoDirecto);
}

// `momento_llamado` es el espejo de `momentosLlamado` en `lib/content.ts` de la
// landing y de la restricción CHECK de la tabla. Son dos aplicaciones deployadas
// por separado que no comparten código: agregar un valor obliga a tocar los tres
// lugares. Ver "Contrato compartido con la landing" en el documento del módulo.
export type MomentoLlamado = "manana" | "tarde" | "indistinto";

export const MOMENTOS_LLAMADO: Record<MomentoLlamado, string> = {
  manana: "Mañana (9 a 12 h)",
  tarde: "Tarde (14 a 19 h)",
  indistinto: "Indistinto",
};

/** `visita_franja` solo la escribe el CRM: no existe en la landing. */
export type Franja = "manana" | "tarde";

export const FRANJAS: Record<Franja, string> = {
  manana: "Mañana (9 a 12 h)",
  tarde: "Tarde (14 a 19 h)",
};

export function esFranja(valor: unknown): valor is Franja {
  return valor === "manana" || valor === "tarde";
}

export const ETIQUETAS_ESTADO: Record<Estado, string> = {
  nuevo: "Nueva",
  contactado: "Contactada",
  visita_agendada: "Visita agendada",
  ingreso: "Ingresó",
  descartada: "Descartada",
};

export const COLORES_ESTADO: Record<Estado, string> = {
  nuevo: "border-amber-200 bg-amber-50 text-amber-700",
  contactado: "border-sky-200 bg-sky-50 text-sky-700",
  visita_agendada: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ingreso: "border-violet-200 bg-violet-50 text-violet-700",
  descartada: "border-slate-200 bg-slate-100 text-slate-500",
};

const fechaLarga = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/**
 * `visita_fecha` es un `date` sin horario. Pasarlo directo a `new Date()` lo
 * interpreta como UTC y en Argentina lo corre un día para atrás.
 */
export function formatearDia(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return fechaLarga.format(new Date(anio, mes - 1, dia));
}
