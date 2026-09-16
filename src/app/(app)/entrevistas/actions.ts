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

  try {
    const supabase = await createClient();
    const { data: interviewId, error } = await supabase.rpc("save_interview", {
      p_id: values.id || null,
      p_consultation_id: values.consultation_id,
      p_candidate_name: values.candidate_name,
      p_candidate_dni: values.candidate_dni,
      p_candidate_birth_date: values.candidate_birth_date,
      p_companion_name: values.companion_name,
      p_companion_phone: values.companion_phone,
      p_companion_relationship: values.companion_relationship,
      p_interview_date: values.interview_date,
      p_interviewer_employee_id: values.interviewer_employee_id,
      p_status: values.status,
      p_mobility_assessment: values.mobility_assessment,
      p_cognitive_assessment: values.cognitive_assessment,
      p_medical_notes: values.medical_notes,
      p_social_notes: values.social_notes,
      p_conclusion: values.conclusion,
      p_rejection_reason:
        values.conclusion === "no_apto" ? values.rejection_reason : null,
    });

    if (error) {
      if (error.code === "23514") {
        return {
          ok: false,
          error:
            "Los datos no cumplen las restricciones clínicas (ej. motivo obligatorio si es no apto).",
        };
      }
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

export async function cancelarEntrevistaAction(id: string): Promise<ResultadoEntrevista> {
  await requerirSesion("administration");

  if (!id || typeof id !== "string") {
    return { ok: false, error: "Identificador de entrevista inválido." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("interviews")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      return { ok: false, error: "No se pudo cancelar la entrevista." };
    }

    revalidatePath("/entrevistas");
    revalidatePath(`/entrevistas/${id}`);

    return { ok: true, mensaje: "Entrevista cancelada correctamente." };
  } catch {
    return { ok: false, error: "Error inesperado al cancelar la entrevista." };
  }
}

export async function completarEntrevistaAction(
  id: string,
): Promise<ResultadoEntrevista> {
  await requerirSesion("administration");

  if (!id || typeof id !== "string") {
    return { ok: false, error: "Identificador de entrevista inválido." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("interviews")
      .update({ status: "completed" })
      .eq("id", id);

    if (error) {
      return { ok: false, error: "No se pudo marcar la entrevista como realizada." };
    }

    revalidatePath("/entrevistas");
    revalidatePath(`/entrevistas/${id}`);

    return { ok: true, mensaje: "Entrevista registrada como realizada." };
  } catch {
    return { ok: false, error: "Error inesperado al actualizar la entrevista." };
  }
}
