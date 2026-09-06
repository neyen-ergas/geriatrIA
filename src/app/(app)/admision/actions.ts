"use server";

import { revalidatePath } from "next/cache";
import { requerirSesion } from "@/lib/auth";
import {
  mensajeErrorGestionConsulta,
  validarGestionConsulta,
  type AccionConsulta,
} from "@/lib/gestion-consulta";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { createAdminClient } from "@/lib/supabase/admin";

export type Resultado = { error: string | null; ok: boolean };

export async function cambiarEstado(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  await requerirSesion();
  return guardarCambio("change_state", formData);
}

export async function agendarVisita(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  await requerirSesion();
  return guardarCambio("schedule_visit", formData);
}

export async function cancelarVisita(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  await requerirSesion();
  return guardarCambio("cancel_visit", formData);
}

export async function guardarNotas(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  await requerirSesion();
  return guardarCambio("save_notes", formData);
}

async function guardarCambio(
  accion: AccionConsulta,
  formData: FormData,
): Promise<Resultado> {
  const validacion = validarGestionConsulta(accion, formData, hoyEnArgentina());
  if (!validacion.ok) return { ok: false, error: validacion.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    "update_consulta",
    validacion.datos,
  );

  if (error) return { ok: false, error: mensajeErrorGestionConsulta(error) };
  if (!data) return { ok: false, error: "No se pudo confirmar el cambio." };

  revalidatePath("/admision");
  return { ok: true, error: null };
}
