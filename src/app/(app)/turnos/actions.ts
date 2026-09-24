"use server";

import { revalidatePath } from "next/cache";
import { requerirSesion } from "@/lib/auth";
import { esIdSolicitud } from "@/lib/id-solicitud";
import { esFranjaTurno, esHoraGuardia, esVersionTurno } from "@/lib/turnos";
import { esFechaValida } from "@/lib/primer-ingreso";
import { createClient } from "@/lib/supabase/server";

export type ResultadoTurno = { ok: boolean; mensaje?: string; error?: string };

export async function asignarTurnoAction(
  _previo: ResultadoTurno,
  formData: FormData,
): Promise<ResultadoTurno> {
  await requerirSesion("administration");
  const id = texto(formData, "id");
  const empleado = texto(formData, "employee_id");
  const fecha = texto(formData, "shift_date");
  const franja = texto(formData, "shift_type");
  const notas = texto(formData, "notes");
  const inicioGuardia = texto(formData, "guard_start");
  const version = texto(formData, "expected_updated_at");
  const idSolicitud = texto(formData, "request_id");
  if (!empleado) return { ok: false, error: "Seleccioná un empleado." };
  if (!esFechaValida(fecha))
    return { ok: false, error: "La fecha del turno no es válida." };
  if (!esFranjaTurno(franja))
    return { ok: false, error: "La franja horaria no es válida." };
  if (franja === "guardia" && !esHoraGuardia(inicioGuardia)) {
    return { ok: false, error: "Indicá la hora de inicio de la guardia de 12 horas." };
  }
  if (id && !esVersionTurno(version)) return versionInvalida();
  if (!id && !esIdSolicitud(idSolicitud)) {
    return { ok: false, error: "Recargá la grilla antes de asignar el turno." };
  }
  if (notas.length > 1000)
    return { ok: false, error: "Las observaciones admiten hasta 1000 caracteres." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("save_shift", {
      p_id: id || undefined,
      p_request_id: esIdSolicitud(idSolicitud) ? idSolicitud : undefined,
      p_employee_id: empleado,
      p_shift_date: fecha,
      p_shift_type: franja,
      p_notes: notas || undefined,
      p_guard_start: franja === "guardia" ? inicioGuardia : undefined,
      p_expected_updated_at: version || undefined,
    });
    if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  } catch {
    return resultadoIncierto();
  }
  revalidatePath("/turnos");
  return { ok: true, mensaje: "Turno guardado correctamente." };
}

export async function cubrirTurnoAction(
  _previo: ResultadoTurno,
  formData: FormData,
): Promise<ResultadoTurno> {
  await requerirSesion("administration");
  const id = texto(formData, "shift_id");
  const reemplazo = texto(formData, "covered_by_employee_id");
  const motivo = texto(formData, "absence_reason");
  const notas = texto(formData, "notes");
  const version = texto(formData, "expected_updated_at");
  if (!id) return { ok: false, error: "Identificador de turno no válido." };
  if (!esVersionTurno(version)) return versionInvalida();
  if (!reemplazo)
    return { ok: false, error: "Seleccioná al empleado que cubrirá el turno." };
  if (!motivo || motivo.length > 500)
    return {
      ok: false,
      error: "Ingresá el motivo de la ausencia (hasta 500 caracteres).",
    };
  if (notas.length > 1000)
    return { ok: false, error: "Las observaciones admiten hasta 1000 caracteres." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("cover_shift", {
      p_shift_id: id,
      p_covered_by_employee_id: reemplazo,
      p_absence_reason: motivo,
      p_notes: notas || undefined,
      p_expected_updated_at: version,
    });
    if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  } catch {
    return resultadoIncierto();
  }
  revalidatePath("/turnos");
  return { ok: true, mensaje: "Ausencia y cobertura registradas correctamente." };
}

export async function cancelarTurnoAction(
  _previo: ResultadoTurno,
  formData: FormData,
): Promise<ResultadoTurno> {
  await requerirSesion("administration");
  const id = texto(formData, "shift_id");
  const version = texto(formData, "expected_updated_at");
  if (!id) return { ok: false, error: "Identificador de turno no válido." };
  if (!esVersionTurno(version)) return versionInvalida();
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("cancel_shift", {
      p_shift_id: id,
      p_expected_updated_at: version,
    });
    if (error) return { ok: false, error: mensajeError(error.code, error.message) };
  } catch {
    return resultadoIncierto();
  }
  revalidatePath("/turnos");
  return { ok: true, mensaje: "Turno cancelado." };
}

function texto(datos: FormData, campo: string): string {
  const valor = datos.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function versionInvalida(): ResultadoTurno {
  return { ok: false, error: "Recargá la grilla antes de modificar el turno." };
}

function resultadoIncierto(): ResultadoTurno {
  return {
    ok: false,
    error:
      "No pudimos confirmar el cambio. Recargá la grilla para comprobar el resultado antes de reintentar.",
  };
}

function mensajeError(codigo: string, mensaje: string): string {
  const SOLAPAMIENTO = "23P01";
  const DUPLICADO = "23505";
  const VERSION_VIEJA = "40001";
  const NO_ENCONTRADO = "P0002";
  const SIN_PERMISO = "42501";
  const RESTRICCION = "23514";
  switch (codigo) {
    case SOLAPAMIENTO:
    case DUPLICADO:
      if (mensaje === "creation_request_reused") {
        return "El formulario cambió después del primer envío. Recargá la grilla antes de asignar otro turno.";
      }
      return "El titular o el reemplazante ya tiene un turno, cobertura o franco que se superpone con ese horario.";
    case VERSION_VIEJA:
      return "El turno cambió desde que abriste esta pantalla. Recargá la grilla antes de continuar.";
    case NO_ENCONTRADO:
      return "El turno ya no está disponible. Recargá la grilla.";
    case SIN_PERMISO:
      return "Tu cuenta ya no tiene permiso para modificar turnos.";
    case RESTRICCION:
      if (mensaje === "shift_not_editable")
        return "El estado actual del turno no permite esta operación.";
      if (mensaje === "franco_cannot_be_covered")
        return "Un franco no admite ausencia ni cobertura.";
      if (
        mensaje === "shift_outside_employment_dates" ||
        mensaje === "covering_employee_inactive"
      ) {
        return "La fecha del turno está fuera del período de contratación del titular o reemplazante.";
      }
      return "Revisá los datos: el reemplazante debe ser otra persona y las guardias requieren hora de inicio.";
    default:
      return "No se pudo guardar el cambio de turno. Revisá los datos e intentá nuevamente.";
  }
}
