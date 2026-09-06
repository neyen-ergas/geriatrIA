import {
  TRANSICIONES,
  esEstado,
  esEstadoDirecto,
  esFranja,
} from "@/lib/admision";
import { esFechaValida } from "@/lib/primer-ingreso";
import type { Database } from "@/types/database";

export type AccionConsulta =
  "change_state" | "schedule_visit" | "cancel_visit" | "save_notes";

type ArgumentosGestion =
  Database["public"]["Functions"]["update_consulta"]["Args"];

type ValidacionGestion =
  { ok: true; datos: ArgumentosGestion } | { ok: false; error: string };

/** La versión se conserva como texto para no perder microsegundos con Date. */
export function validarGestionConsulta(
  accion: AccionConsulta,
  formData: FormData,
  hoy: string,
): ValidacionGestion {
  const id = texto(formData, "id");
  const version = texto(formData, "actualizado_en");
  const estado = texto(formData, "estado_esperado");

  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)) {
    return { ok: false, error: "La consulta no es válida. Recargá la página." };
  }
  if (
    !esEstado(estado) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      version,
    ) ||
    !Number.isFinite(Date.parse(version))
  ) {
    return {
      ok: false,
      error: "Falta la versión de la consulta. Recargá la página.",
    };
  }

  const datos: ArgumentosGestion = {
    p_id: id,
    p_expected_updated_at: version,
    p_expected_state: estado,
    p_action: accion,
  };

  if (accion === "change_state") {
    const destino = formData.get("estado");
    if (!esEstadoDirecto(destino) || !TRANSICIONES[estado].includes(destino)) {
      return { ok: false, error: "Ese cambio de estado no está permitido." };
    }
    datos.p_state = destino;
  }

  if (accion === "schedule_visit") {
    if (estado === "ingreso" || estado === "descartada") {
      return {
        ok: false,
        error: "Reabrí la consulta antes de agendar una visita.",
      };
    }
    const fecha = texto(formData, "visita_fecha");
    const franja = formData.get("visita_franja");
    if (!esFechaValida(fecha))
      return { ok: false, error: "Elegí un día válido." };
    if (fecha < hoy) return { ok: false, error: "Ese día ya pasó." };
    if (!esFranja(franja))
      return { ok: false, error: "Elegí una franja horaria." };
    datos.p_visit_date = fecha;
    datos.p_visit_slot = franja;
  }

  if (accion === "cancel_visit" && estado !== "visita_agendada") {
    return { ok: false, error: "La consulta no tiene una visita agendada." };
  }

  if (accion === "save_notes")
    datos.p_notes = texto(formData, "notas_internas");

  return { ok: true, datos };
}

export function mensajeErrorGestionConsulta(error: { code: string }): string {
  const CONSULTA_CAMBIADA = "40001";
  const CONSULTA_INEXISTENTE = "P0002";
  const TURNO_OCUPADO = "23505";
  const ARGUMENTOS_INVALIDOS = "22023";

  if (error.code === CONSULTA_CAMBIADA) {
    return "La consulta cambió desde que abriste esta página. Recargala antes de volver a guardar.";
  }
  if (error.code === CONSULTA_INEXISTENTE)
    return "La consulta ya no está disponible.";
  if (error.code === TURNO_OCUPADO) {
    return "Ese turno ya está ocupado por otra consulta.";
  }
  if (error.code === ARGUMENTOS_INVALIDOS) {
    return "La acción no es válida para el estado o la fecha de esta consulta.";
  }
  return "No se pudo guardar el cambio. Intentá nuevamente en unos minutos.";
}

function texto(formData: FormData, nombre: string): string {
  const valor = formData.get(nombre);
  return typeof valor === "string" ? valor.trim() : "";
}
