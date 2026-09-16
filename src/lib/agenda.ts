import { esFechaValida } from "@/lib/primer-ingreso";
import type { Franja } from "@/lib/admision";
import type { Tables } from "@/types/database";

const DIAS_POR_SEMANA = 7;
export const TURNOS_POR_SEMANA = DIAS_POR_SEMANA * 2;
export type VisitaAgenda = Pick<Tables<"consulta">, "id" | "nombre" | "telefono"> & {
  visita_fecha: string;
  visita_franja: Franja;
};
export type SemanaAgenda = {
  inicio: string;
  fin: string;
  dias: string[];
  anterior: string | null;
  siguiente: string | null;
};

/** Las fechas son días civiles argentinos; UTC solo se usa para sumar días. */
export function semanaAgenda(valor: unknown, hoy: string): SemanaAgenda {
  const dias = diasSemana(valor) ?? diasSemana(hoy);
  if (!dias) throw new Error("No se pudo determinar la semana.");
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

export function enlaceAgenda(inicio: string): string {
  return `/admision/agenda?semana=${encodeURIComponent(inicio)}`;
}

export function etiquetaDiaAgenda(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
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
