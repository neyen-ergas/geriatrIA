import type { EstadoAdministracion, EstadoVisual } from "./types";

// Ventana de tolerancia: a partir de acá una toma pendiente pasa a "atrasada".
const VENTANA_ATRASO_MIN = 30;
// A partir de acá, una toma pendiente ya vencida sin registrar se muestra "vencida".
const VENTANA_VENCIDA_MIN = 60;

// Deriva el estado visual a partir del estado guardado y del reloj.
// Los estados terminales (administrada/rechazada/omitida) no cambian.
export function estadoVisual(
  estado: EstadoAdministracion,
  programadaPara: string,
  ahora: Date = new Date(),
): EstadoVisual {
  if (estado !== "pendiente") return estado;

  const prog = new Date(programadaPara).getTime();
  const diffMin = (ahora.getTime() - prog) / 60000;

  if (diffMin < 0) return "a_tiempo"; // todavía no llegó la hora
  if (diffMin < VENTANA_ATRASO_MIN) return "a_tiempo";
  if (diffMin < VENTANA_VENCIDA_MIN) return "atrasada";
  return "vencida";
}

export const ESTADO_META: Record<
  EstadoVisual,
  { label: string; badge: string; dot: string }
> = {
  a_tiempo: {
    label: "A tiempo",
    badge: "bg-sky-100 text-sky-800 border-sky-200",
    dot: "bg-sky-500",
  },
  pendiente: {
    label: "Pendiente",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  atrasada: {
    label: "Atrasada",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  vencida: {
    label: "Vencida",
    badge: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
  administrada: {
    label: "Administrada",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  rechazada: {
    label: "Rechazada",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    dot: "bg-orange-500",
  },
  omitida: {
    label: "Omitida",
    badge: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
};

// Motivos de rechazo (lista corta, tap único).
export const MOTIVOS_RECHAZO = [
  "Paciente rechazó la medicación",
  "Paciente dormido",
  "Paciente descompuesto / náuseas",
  "Ayuno por estudio médico",
  "Medicación no disponible",
] as const;
