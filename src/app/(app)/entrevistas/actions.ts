"use server";

import { revalidatePath } from "next/cache";
import { requerirSesion } from "@/lib/auth";
import {
  type ConclusionEntrevista,
  type EstadoEntrevista,
  type EvaluacionCognitiva,
  type EvaluacionMovilidad,
  validarEntrevistaForm,
} from "@/lib/entrevistas";
import { createClient } from "@/lib/supabase/server";

export type ResultadoEntrevista = {
  ok: boolean;
  mensaje?: string;
  error?: string;
  errores?: Record<string, string>;
  id?: string;
};

export async function guardarEntrevistaAction(
  _previo: ResultadoEntrevista,
  formData: FormData,
): Promise<ResultadoEntrevista> {
  await requerirSesion("administration");

  const id = formData.get("id");
  const version = formData.get("expected_updated_at");
  const consultationId = formData.get("consultation_id");
  const candidateName = formData.get("candidate_name");
  const candidateDni = formData.get("candidate_dni");
  const candidateBirthDate = formData.get("candidate_birth_date");
  const companionName = formData.get("companion_name");
  const companionPhone = formData.get("companion_phone");
  const companionRelationship = formData.get("companion_relationship");
  const interviewDate = formData.get("interview_date");
  const interviewerEmployeeId = formData.get("interviewer_employee_id");
  const status = formData.get("status");
  const mobilityAssessment = formData.get("mobility_assessment");
  const cognitiveAssessment = formData.get("cognitive_assessment");
  const medicalNotes = formData.get("medical_notes");
  const socialNotes = formData.get("social_notes");
  const conclusion = formData.get("conclusion");
  const rejectionReason = formData.get("rejection_reason");

  const values = {
    id: typeof id === "string" && id.trim() ? id.trim() : undefined,
    consultation_id:
      typeof consultationId === "string" && consultationId.trim()
        ? consultationId.trim()
        : null,
    candidate_name: typeof candidateName === "string" ? candidateName.trim() : "",
    candidate_dni:
      typeof candidateDni === "string" && candidateDni.trim()
        ? candidateDni.trim()
        : null,
    candidate_birth_date:
      typeof candidateBirthDate === "string" && candidateBirthDate.trim()
        ? candidateBirthDate.trim()
        : null,
    companion_name:
      typeof companionName === "string" && companionName.trim()
        ? companionName.trim()
        : null,
    companion_phone:
      typeof companionPhone === "string" && companionPhone.trim()
        ? companionPhone.trim()
        : null,
    companion_relationship:
      typeof companionRelationship === "string" && companionRelationship.trim()
        ? companionRelationship.trim()
        : null,
    interview_date: typeof interviewDate === "string" ? interviewDate.trim() : "",
    interviewer_employee_id:
      typeof interviewerEmployeeId === "string" && interviewerEmployeeId.trim()
        ? interviewerEmployeeId.trim()
        : null,
    status: (typeof status === "string"
      ? status.trim()
      : "scheduled") as EstadoEntrevista,
    mobility_assessment: (typeof mobilityAssessment === "string" &&
    mobilityAssessment.trim()
      ? mobilityAssessment.trim()
      : null) as EvaluacionMovilidad | null,
    cognitive_assessment: (typeof cognitiveAssessment === "string" &&
    cognitiveAssessment.trim()
      ? cognitiveAssessment.trim()
      : null) as EvaluacionCognitiva | null,
    medical_notes:
      typeof medicalNotes === "string" && medicalNotes.trim()
        ? medicalNotes.trim()
        : null,
    social_notes:
      typeof socialNotes === "string" && socialNotes.trim() ? socialNotes.trim() : null,
    conclusion: (typeof conclusion === "string"
      ? conclusion.trim()
      : "pendiente") as ConclusionEntrevista,
    rejection_reason:
      typeof rejectionReason === "string" && rejectionReason.trim()
        ? rejectionReason.trim()
        : null,
  };

  const validacion = validarEntrevistaForm(values);
  if (!validacion.valido) {
    return {
      ok: false,
      error: "Por favor revisá los campos con observaciones.",
      errores: validacion.errores,
    };
  }

  if (values.id && !esVersionValida(version)) {
    return { ok: false, error: "Recargá la entrevista antes de guardar los cambios." };
  }

  try {
    const supabase = await createClient();
    const { data: interviewId, error } = await supabase.rpc("save_interview", {
      p_id: values.id || undefined,
      p_expected_updated_at: typeof version === "string" ? version : undefined,
      p_consultation_id: values.consultation_id ?? undefined,
      p_candidate_name: values.candidate_name ?? undefined,
      p_candidate_dni: values.candidate_dni ?? undefined,
      p_candidate_birth_date: values.candidate_birth_date ?? undefined,
      p_companion_name: values.companion_name ?? undefined,
      p_companion_phone: values.companion_phone ?? undefined,
      p_companion_relationship: values.companion_relationship ?? undefined,
      p_interview_date: values.interview_date ?? undefined,
      p_interviewer_employee_id: values.interviewer_employee_id ?? undefined,
      p_status: values.status ?? undefined,
      p_mobility_assessment: values.mobility_assessment ?? undefined,
      p_cognitive_assessment: values.cognitive_assessment ?? undefined,
      p_medical_notes: values.medical_notes ?? undefined,
      p_social_notes: values.social_notes ?? undefined,
      p_conclusion: values.conclusion ?? undefined,
      p_rejection_reason:
        values.conclusion === "no_apto"
          ? (values.rejection_reason ?? undefined)
          : undefined,
    });

    if (error) {
      const mensaje = traducirErrorEntrevista(error.code);
      if (mensaje) return { ok: false, error: mensaje };

      return {
        ok: false,
        error: "No se pudo registrar la entrevista. Intentá nuevamente.",
      };
    }

    revalidatePath("/entrevistas");
    if (interviewId) {
      revalidatePath(`/entrevistas/${interviewId}`);
    }

    return {
      ok: true,
      mensaje: values.id
        ? "Entrevista de admisión actualizada correctamente."
        : "Entrevista de admisión programada con éxito.",
      id: interviewId ?? undefined,
    };
  } catch {
    return {
      ok: false,
      error: "Ocurrió un error inesperado al procesar la entrevista.",
    };
  }
}

export async function cancelarEntrevistaAction(
  id: string,
  version: string,
): Promise<ResultadoEntrevista> {
  await requerirSesion("administration");
  return cambiarEstadoEntrevista(id, version, "cancelled");
}

export async function completarEntrevistaAction(
  id: string,
  version: string,
): Promise<ResultadoEntrevista> {
  await requerirSesion("administration");
  return cambiarEstadoEntrevista(id, version, "completed");
}

async function cambiarEstadoEntrevista(
  id: string,
  version: string,
  estado: "completed" | "cancelled",
): Promise<ResultadoEntrevista> {
  if (
    typeof id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return { ok: false, error: "Identificador de entrevista inválido." };
  }
  if (!esVersionValida(version)) {
    return { ok: false, error: "Recargá la entrevista antes de cambiar su estado." };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("transition_interview", {
      p_id: id,
      p_expected_updated_at: version,
      p_status: estado,
    });
    if (error) {
      return {
        ok: false,
        error:
          traducirErrorEntrevista(error.code) ??
          "No se pudo cambiar el estado de la entrevista. Intentá nuevamente.",
      };
    }
    revalidatePath("/entrevistas");
    revalidatePath(`/entrevistas/${id}`);
    return {
      ok: true,
      mensaje:
        estado === "completed"
          ? "Entrevista registrada como realizada."
          : "Entrevista cancelada correctamente.",
    };
  } catch {
    return {
      ok: false,
      error:
        "No pudimos confirmar el cambio. Recargá la entrevista para comprobar su estado antes de reintentar.",
    };
  }
}

function esVersionValida(valor: unknown): valor is string {
  return (
    typeof valor === "string" &&
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      valor,
    ) &&
    Number.isFinite(Date.parse(valor))
  );
}

function traducirErrorEntrevista(codigo: string): string | undefined {
  const VERSION_DESACTUALIZADA = "40001";
  const ENTREVISTA_INEXISTENTE = "P0002";
  const PERMISO_DENEGADO = "42501";
  const ESTADO_INVALIDO = "23514";
  switch (codigo) {
    case VERSION_DESACTUALIZADA:
      return "La entrevista cambió desde que abriste esta pantalla. Recargala para revisar los cambios antes de continuar.";
    case ENTREVISTA_INEXISTENTE:
      return "La entrevista ya no está disponible. Volvé al listado.";
    case PERMISO_DENEGADO:
      return "Tu cuenta ya no tiene permiso para modificar entrevistas.";
    case ESTADO_INVALIDO:
      return "La operación no es válida para el estado o los datos actuales de la entrevista. Revisalos antes de continuar.";
  }
}
