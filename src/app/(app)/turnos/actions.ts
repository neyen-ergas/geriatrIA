"use server";

import { revalidatePath } from "next/cache";
import { requerirSesion } from "@/lib/auth";
import { esFranjaTurno } from "@/lib/turnos";
import { esFechaValida } from "@/lib/primer-ingreso";
import { createClient } from "@/lib/supabase/server";

export type ResultadoTurno = {
  ok: boolean;
  mensaje?: string;
  error?: string;
};

export async function asignarTurnoAction(
  _previo: ResultadoTurno,
  formData: FormData,
): Promise<ResultadoTurno> {
  await requerirSesion("administration");

  const id = formData.get("id");
  const employeeId = formData.get("employee_id");
  const shiftDate = formData.get("shift_date");
  const shiftType = formData.get("shift_type");
  const notes = formData.get("notes");

  if (typeof employeeId !== "string" || !employeeId.trim()) {
    return { ok: false, error: "Seleccioná un empleado." };
  }
  if (typeof shiftDate !== "string" || !esFechaValida(shiftDate)) {
    return { ok: false, error: "La fecha del turno no es válida." };
  }
  if (!esFranjaTurno(shiftType)) {
    return { ok: false, error: "La franja horaria no es válida." };
  }

  const shiftId = typeof id === "string" && id.trim() ? id.trim() : undefined;
  const shiftNotes = typeof notes === "string" && notes.trim() ? notes.trim() : undefined;

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("save_shift", {
      p_id: shiftId,
      p_employee_id: employeeId.trim(),
      p_shift_date: shiftDate,
      p_shift_type: shiftType,
      p_notes: shiftNotes,
    });

    if (error) {
      if (error.code === "23505") {
        return {
          ok: false,
          error: "El empleado ya tiene un turno asignado en esa fecha y franja horaria.",
        };
      }
      if (error.code === "23514") {
        return {
          ok: false,
          error:
            "La fecha del turno está fuera del período de contratación del empleado.",
        };
      }
      return { ok: false, error: "No se pudo guardar el turno: " + error.message };
    }
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Error inesperado al guardar el turno.";
    return { ok: false, error: msg };
  }

  revalidatePath("/turnos");
  return { ok: true, mensaje: "Turno guardado correctamente." };
}

export async function cubrirTurnoAction(
  _previo: ResultadoTurno,
  formData: FormData,
): Promise<ResultadoTurno> {
  await requerirSesion("administration");

  const shiftId = formData.get("shift_id");
  const coveredByEmployeeId = formData.get("covered_by_employee_id");
  const absenceReason = formData.get("absence_reason");
  const notes = formData.get("notes");

  if (typeof shiftId !== "string" || !shiftId.trim()) {
    return { ok: false, error: "Identificador de turno no válido." };
  }
  if (typeof coveredByEmployeeId !== "string" || !coveredByEmployeeId.trim()) {
    return { ok: false, error: "Seleccioná al empleado que cubrirá el turno." };
  }
  if (typeof absenceReason !== "string" || !absenceReason.trim()) {
    return { ok: false, error: "Ingresá el motivo de la ausencia." };
  }

  const shiftNotes = typeof notes === "string" && notes.trim() ? notes.trim() : undefined;

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("cover_shift", {
      p_shift_id: shiftId.trim(),
      p_covered_by_employee_id: coveredByEmployeeId.trim(),
      p_absence_reason: absenceReason.trim(),
      p_notes: shiftNotes,
    });

    if (error) {
      if (error.code === "23514") {
        return {
          ok: false,
          error:
            "El empleado que cubre no puede ser el mismo titular o no se encuentra activo.",
        };
      }
      return { ok: false, error: "No se pudo registrar la cobertura: " + error.message };
    }
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Error inesperado al registrar cobertura.";
    return { ok: false, error: msg };
  }

  revalidatePath("/turnos");
  return { ok: true, mensaje: "Ausencia y cobertura registradas correctamente." };
}

export async function cancelarTurnoAction(
  _previo: ResultadoTurno,
  formData: FormData,
): Promise<ResultadoTurno> {
  await requerirSesion("administration");

  const shiftId = formData.get("shift_id");
  if (typeof shiftId !== "string" || !shiftId.trim()) {
    return { ok: false, error: "Identificador de turno no válido." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("cancel_shift", {
      p_shift_id: shiftId.trim(),
    });

    if (error) {
      return { ok: false, error: "No se pudo cancelar el turno: " + error.message };
    }
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Error inesperado al cancelar el turno.";
    return { ok: false, error: msg };
  }

  revalidatePath("/turnos");
  return { ok: true, mensaje: "Turno cancelado." };
}
