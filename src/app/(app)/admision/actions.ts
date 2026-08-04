"use server";

import { revalidatePath } from "next/cache";
import { requerirSesion } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { esEstadoDirecto, esFranja } from "@/lib/admision";

// Un módulo "use server" solo puede exportar funciones async: el estado inicial
// de cada formulario vive en el componente cliente.
export type Resultado = { error: string | null; ok: boolean };

/** Violación de restricción única en Postgres. */
const UNIQUE_VIOLATION = "23505";

const OK: Resultado = { error: null, ok: true };

function falla(error: string): Resultado {
  return { error, ok: false };
}

/** Hoy en Argentina, como `YYYY-MM-DD`. `en-CA` ya formatea así. */
function hoyEnArgentina(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

/**
 * Mueve la consulta entre los estados que solo tocan la columna `estado`.
 *
 * `visita_agendada` no entra acá: exige escribir la fecha y la franja en el
 * mismo update, así que tiene su propia acción.
 */
export async function cambiarEstado(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  await requerirSesion();

  const id = String(formData.get("id") ?? "");
  const estado = formData.get("estado");

  if (!id) return falla("Falta la consulta a modificar.");
  if (!esEstadoDirecto(estado)) {
    return falla("Ese estado no se puede aplicar directamente.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("consulta")
    .update({ estado })
    .eq("id", id);

  if (error) return falla(`No se pudo cambiar el estado: ${error.message}`);

  revalidatePath("/admision");
  return OK;
}

/**
 * Agenda o reprograma la visita presencial. Escribe el día, la franja y el
 * estado juntos, que es lo que exigen las dos garantías de la base:
 * `consulta_visita_completa` y el índice `consulta_visita_unica`.
 */
export async function agendarVisita(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  await requerirSesion();

  const id = String(formData.get("id") ?? "");
  const fecha = String(formData.get("visita_fecha") ?? "");
  const franja = formData.get("visita_franja");

  if (!id) return falla("Falta la consulta a modificar.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return falla("Elegí un día válido.");
  if (fecha < hoyEnArgentina()) return falla("Ese día ya pasó.");
  if (!esFranja(franja)) return falla("Elegí una franja horaria.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("consulta")
    .update({
      visita_fecha: fecha,
      visita_franja: franja,
      estado: "visita_agendada",
    })
    .eq("id", id);

  if (error) {
    // El índice `consulta_visita_unica` solo cubre las visitas vigentes, así que
    // este choque significa que otra consulta ya tiene ese día y esa franja.
    if (error.code === UNIQUE_VIOLATION) {
      return falla("Ese turno ya está ocupado por otra consulta.");
    }
    return falla(`No se pudo agendar la visita: ${error.message}`);
  }

  revalidatePath("/admision");
  return OK;
}

/**
 * Deja la visita sin efecto y devuelve la consulta a `contactado`. Borra el día
 * y la franja: la restricción exige que vayan juntos o no vaya ninguno, y el
 * turno queda libre para otra familia.
 */
export async function cancelarVisita(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  await requerirSesion();

  const id = String(formData.get("id") ?? "");
  if (!id) return falla("Falta la consulta a modificar.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("consulta")
    .update({
      visita_fecha: null,
      visita_franja: null,
      estado: "contactado",
    })
    .eq("id", id);

  if (error) return falla(`No se pudo cancelar la visita: ${error.message}`);

  revalidatePath("/admision");
  return OK;
}

export async function guardarNotas(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  await requerirSesion();

  const id = String(formData.get("id") ?? "");
  const notas = String(formData.get("notas_internas") ?? "").trim();

  if (!id) return falla("Falta la consulta a modificar.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("consulta")
    .update({ notas_internas: notas || null })
    .eq("id", id);

  if (error) return falla(`No se pudieron guardar las notas: ${error.message}`);

  revalidatePath("/admision");
  return OK;
}
