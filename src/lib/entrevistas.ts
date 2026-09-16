import { esFechaValida } from "@/lib/primer-ingreso";
import type { Tables } from "@/types/database";

export const ESTADOS_ENTREVISTA = ["scheduled", "completed", "cancelled"] as const;
export type EstadoEntrevista = (typeof ESTADOS_ENTREVISTA)[number];

export const EVALUACIONES_MOVILIDAD = [
  "autovalido",
  "semidependiente",
  "dependiente_total",
] as const;
export type EvaluacionMovilidad = (typeof EVALUACIONES_MOVILIDAD)[number];

export const EVALUACIONES_COGNITIVAS = [
  "lucido",
  "deterioro_leve",
  "deterioro_moderado",
  "demencia_avanzada",
] as const;
export type EvaluacionCognitiva = (typeof EVALUACIONES_COGNITIVAS)[number];

export const CONCLUSIONES_ENTREVISTA = [
  "pendiente",
  "apto",
  "apto_con_observaciones",
  "no_apto",
] as const;
export type ConclusionEntrevista = (typeof CONCLUSIONES_ENTREVISTA)[number];

export const ETIQUETAS_ESTADO_ENTREVISTA: Record<EstadoEntrevista, string> = {
  scheduled: "Programada",
  completed: "Realizada",
  cancelled: "Cancelada",
};

export const ETIQUETAS_MOVILIDAD: Record<EvaluacionMovilidad, string> = {
  autovalido: "Autoválido (sin asistencia)",
  semidependiente: "Semidependiente (asistencia parcial)",
  dependiente_total: "Dependiente total (asistencia permanente)",
};

export const ETIQUETAS_CORTAS_MOVILIDAD: Record<EvaluacionMovilidad, string> = {
  autovalido: "Autoválido",
  semidependiente: "Semidependiente",
  dependiente_total: "Dependiente",
};

export const ETIQUETAS_COGNITIVA: Record<EvaluacionCognitiva, string> = {
  lucido: "Lúcido / Sin deterioro",
  deterioro_leve: "Deterioro leve",
  deterioro_moderado: "Deterioro moderado",
  demencia_avanzada: "Demencia avanzada / Severo",
};

export const ETIQUETAS_CONCLUSION: Record<ConclusionEntrevista, string> = {
  pendiente: "Pendiente de dictamen",
  apto: "Apto para ingreso",
  apto_con_observaciones: "Apto con observaciones",
  no_apto: "No apto (perfil asistencial)",
};

export const ETIQUETAS_CORTAS_CONCLUSION: Record<ConclusionEntrevista, string> = {
  pendiente: "Pendiente",
  apto: "Apto",
  apto_con_observaciones: "Con observaciones",
  no_apto: "No apto",
};

export const COLORES_ESTADO_ENTREVISTA: Record<
  EstadoEntrevista,
  { bg: string; text: string; badge: string }
> = {
  scheduled: {
    bg: "bg-sky-50",
    text: "text-sky-800",
    badge: "bg-sky-50 text-sky-800 border-sky-200",
  },
  completed: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  cancelled: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export const COLORES_CONCLUSION: Record<
  ConclusionEntrevista,
  { bg: string; text: string; badge: string }
> = {
  pendiente: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  apto: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  apto_con_observaciones: {
    bg: "bg-teal-50",
    text: "text-teal-800",
    badge: "bg-teal-50 text-teal-800 border-teal-200",
  },
  no_apto: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
  },
};

export const COLORES_MOVILIDAD: Record<EvaluacionMovilidad, string> = {
  autovalido: "bg-emerald-50 text-emerald-800 border-emerald-200",
  semidependiente: "bg-amber-50 text-amber-800 border-amber-200",
  dependiente_total: "bg-purple-50 text-purple-800 border-purple-200",
};

export const COLORES_COGNITIVA: Record<EvaluacionCognitiva, string> = {
  lucido: "bg-emerald-50 text-emerald-800 border-emerald-200",
  deterioro_leve: "bg-sky-50 text-sky-800 border-sky-200",
  deterioro_moderado: "bg-amber-50 text-amber-800 border-amber-200",
  demencia_avanzada: "bg-rose-50 text-rose-800 border-rose-200",
};

export type Entrevista = Tables<"interviews"> & {
  consultation?: {
    id: string;
    nombre: string;
    telefono: string;
    mensaje: string | null;
  } | null;
  interviewer?: {
    id: string;
    first_name: string;
    last_name: string;
    job_title: string;
  } | null;
};

export type ConsultaParaEntrevista = {
  id: string;
  nombre: string;
  telefono: string;
  mensaje: string | null;
  estado: string;
  creado_en: string;
};

export type Entrevistador = {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string;
};

export type EntrevistaFormValues = {
  id?: string;
  consultation_id?: string | null;
  candidate_name: string;
  candidate_dni?: string | null;
  candidate_birth_date?: string | null;
  companion_name?: string | null;
  companion_phone?: string | null;
  companion_relationship?: string | null;
  interview_date: string;
  interviewer_employee_id?: string | null;
  status: EstadoEntrevista;
  mobility_assessment?: EvaluacionMovilidad | null;
  cognitive_assessment?: EvaluacionCognitiva | null;
  medical_notes?: string | null;
  social_notes?: string | null;
  conclusion: ConclusionEntrevista;
  rejection_reason?: string | null;
};

export type KpisEntrevistas = {
  total: number;
  programadas: number;
  completadas: number;
  aptas: number;
  noAptas: number;
  pendientes: number;
};

export function calcularKpisEntrevistas(entrevistas: Entrevista[]): KpisEntrevistas {
  let programadas = 0;
  let completadas = 0;
  let aptas = 0;
  let noAptas = 0;
  let pendientes = 0;

  for (const ent of entrevistas) {
    if (ent.status === "scheduled") {
      programadas++;
    } else if (ent.status === "completed") {
      completadas++;
    }

    if (ent.conclusion === "apto" || ent.conclusion === "apto_con_observaciones") {
      aptas++;
    } else if (ent.conclusion === "no_apto") {
      noAptas++;
    } else if (ent.conclusion === "pendiente") {
      pendientes++;
    }
  }

  return {
    total: entrevistas.length,
    programadas,
    completadas,
    aptas,
    noAptas,
    pendientes,
  };
}

export function validarEntrevistaForm(values: Partial<EntrevistaFormValues>): {
  valido: boolean;
  errores: Record<string, string>;
} {
  const errores: Record<string, string> = {};

  const candidateName = values.candidate_name?.trim();
  if (!candidateName) {
    errores.candidate_name = "El nombre del postulante es obligatorio.";
  } else if (candidateName.length > 200) {
    errores.candidate_name = "El nombre no puede superar los 200 caracteres.";
  }

  if (!values.interview_date) {
    errores.interview_date = "La fecha de la entrevista es obligatoria.";
  } else if (!esFechaValida(values.interview_date)) {
    errores.interview_date = "La fecha de la entrevista no tiene un formato válido.";
  }

  if (values.candidate_dni) {
    const dni = values.candidate_dni.trim();
    if (dni.length < 6 || dni.length > 20) {
      errores.candidate_dni = "El documento debe tener entre 6 y 20 caracteres.";
    }
  }

  if (values.candidate_birth_date) {
    if (!esFechaValida(values.candidate_birth_date)) {
      errores.candidate_birth_date = "La fecha de nacimiento no es válida.";
    } else {
      const hoy = new Date().toISOString().slice(0, 10);
      if (values.candidate_birth_date > hoy) {
        errores.candidate_birth_date = "La fecha de nacimiento no puede ser futura.";
      }
    }
  }

  if (values.companion_name && values.companion_name.trim().length > 200) {
    errores.companion_name = "El nombre del acompañante no puede superar 200 caracteres.";
  }

  if (values.companion_phone && values.companion_phone.trim().length > 50) {
    errores.companion_phone =
      "El teléfono del acompañante no puede superar 50 caracteres.";
  }

  if (
    values.companion_relationship &&
    values.companion_relationship.trim().length > 100
  ) {
    errores.companion_relationship =
      "El vínculo del acompañante no puede superar 100 caracteres.";
  }

  if (values.status && !ESTADOS_ENTREVISTA.includes(values.status)) {
    errores.status = "El estado seleccionado no es válido.";
  }

  if (
    values.mobility_assessment &&
    !EVALUACIONES_MOVILIDAD.includes(values.mobility_assessment)
  ) {
    errores.mobility_assessment = "La evaluación de movilidad no es válida.";
  }

  if (
    values.cognitive_assessment &&
    !EVALUACIONES_COGNITIVAS.includes(values.cognitive_assessment)
  ) {
    errores.cognitive_assessment = "La evaluación cognitiva no es válida.";
  }

  if (values.conclusion && !CONCLUSIONES_ENTREVISTA.includes(values.conclusion)) {
    errores.conclusion = "La conclusión seleccionada no es válida.";
  }

  if (values.conclusion === "no_apto") {
    const motivo = values.rejection_reason?.trim();
    if (!motivo) {
      errores.rejection_reason = "Debe indicar el motivo del dictamen No Apto.";
    } else if (motivo.length > 1000) {
      errores.rejection_reason = "El motivo no puede superar los 1000 caracteres.";
    }
  }

  if (values.medical_notes && values.medical_notes.length > 4000) {
    errores.medical_notes =
      "Las observaciones médicas no pueden superar los 4000 caracteres.";
  }

  if (values.social_notes && values.social_notes.length > 4000) {
    errores.social_notes =
      "Las observaciones sociales no pueden superar los 4000 caracteres.";
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores,
  };
}
