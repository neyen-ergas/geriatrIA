import { esFechaValida } from "@/lib/primer-ingreso";
import type { Tables } from "@/types/database";

export const FRANJAS_TURNO = ["manana", "tarde", "noche", "guardia", "franco"] as const;
export type FranjaTurno = (typeof FRANJAS_TURNO)[number];

export const ESTADOS_TURNO = ["scheduled", "completed", "absent", "cancelled"] as const;
export type EstadoTurno = (typeof ESTADOS_TURNO)[number];

export const ETIQUETAS_FRANJA_TURNO: Record<FranjaTurno, string> = {
  manana: "Mañana (07 a 15 hs)",
  tarde: "Tarde (15 a 23 hs)",
  noche: "Noche (23 a 07 hs)",
  guardia: "Guardia",
  franco: "Franco",
};

export const ETIQUETAS_CORTAS_FRANJA: Record<FranjaTurno, string> = {
  manana: "Mañana",
  tarde: "Tarde",
  noche: "Noche",
  guardia: "Guardia",
  franco: "Franco",
};

export const ETIQUETAS_ESTADO_TURNO: Record<EstadoTurno, string> = {
  scheduled: "Programado",
  completed: "Cumplido",
  absent: "Ausente",
  cancelled: "Cancelado",
};

export const COLORES_FRANJA: Record<FranjaTurno, { bg: string; text: string; badge: string }> = {
  manana: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  tarde: {
    bg: "bg-sky-50",
    text: "text-sky-800",
    badge: "bg-sky-50 text-sky-800 border-sky-200",
  },
  noche: {
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  guardia: {
    bg: "bg-purple-50",
    text: "text-purple-800",
    badge: "bg-purple-50 text-purple-800 border-purple-200",
  },
  franco: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
};

export type Turno = Pick<
  Tables<"shifts">,
  | "id"
  | "employee_id"
  | "shift_date"
  | "shift_type"
  | "status"
  | "absence_reason"
  | "covered_by_employee_id"
  | "notes"
  | "created_at"
  | "updated_at"
> & {
  employee?: {
    first_name: string;
    last_name: string;
    job_title: string;
  };
  covered_by?: {
    first_name: string;
    last_name: string;
  } | null;
};

export type EmpleadoTurno = {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string;
  hired_at: string;
  terminated_at: string | null;
};

export type SemanaTurnos = {
  inicio: string;
  fin: string;
  dias: string[];
  anterior: string | null;
  siguiente: string | null;
};

export function esFranjaTurno(valor: unknown): valor is FranjaTurno {
  return FRANJAS_TURNO.includes(valor as FranjaTurno);
}

export function esEstadoTurno(valor: unknown): valor is EstadoTurno {
  return ESTADOS_TURNO.includes(valor as EstadoTurno);
}

const DIAS_POR_SEMANA = 7;

export function semanaTurnos(valor: unknown, hoy: string): SemanaTurnos {
  const dias = diasSemana(valor) ?? diasSemana(hoy);
  if (!dias) throw new Error("No se pudo determinar la semana para turnos.");
  const anterior = diasSemana(sumarDias(dias[0], -DIAS_POR_SEMANA));
  const siguiente = diasSemana(sumarDias(dias[0], DIAS_POR_SEMANA));
  return {
    inicio: dias[0],
    fin: dias[6],
    dias,
    anterior: anterior?.[0] ?? null,
    siguiente: siguiente?.[0] ?? null,
  };
}

export function enlaceTurnos(inicio?: string): string {
  if (!inicio) return "/turnos";
  return `/turnos?semana=${encodeURIComponent(inicio)}`;
}

export function etiquetaDiaSemana(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T12:00:00Z`));
}

function diasSemana(valor: unknown): string[] | null {
  if (typeof valor !== "string" || !esFechaValida(valor)) return null;
  const dia = new Date(`${valor}T12:00:00Z`).getUTCDay();
  const lunes = sumarDias(valor, -((dia + 6) % DIAS_POR_SEMANA));
  const dias = Array.from({ length: DIAS_POR_SEMANA }, (_, i) => sumarDias(lunes, i));
  return dias.every(esFechaValida) ? dias : null;
}

function sumarDias(fecha: string, dias: number): string {
  const resultado = new Date(`${fecha}T12:00:00Z`);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().split("T")[0];
}
