"use server";

import { revalidatePath } from "next/cache";
import { requerirSesion } from "@/lib/auth";
import { errorVinculo, esIdCuenta, type ResultadoVinculo } from "@/lib/cuentas-empleados";
import { createClient } from "@/lib/supabase/server";

export async function vincularCuenta(
  empleadoId: string, _previo: ResultadoVinculo, datos: FormData,
): Promise<ResultadoVinculo> {
  await requerirSesion("administration");
  return guardarVinculo(empleadoId, datos.get("cuenta"), datos.get("version"), false);
}

export async function desvincularCuenta(
  empleadoId: string, usuarioId: string, version: string | null,
  _previo: ResultadoVinculo, _datos: FormData,
): Promise<ResultadoVinculo> {
  await requerirSesion("administration");
  return guardarVinculo(empleadoId, usuarioId, version, true);
}

async function guardarVinculo(empleadoId: string, usuarioId: unknown, version: unknown, desvincular: boolean): Promise<ResultadoVinculo> {
  if (!esIdCuenta(empleadoId) || !esIdCuenta(usuarioId) || typeof version !== "string" || !Number.isFinite(Date.parse(version))) {
    return { error: "Elegí una cuenta con perfil asignado. Si no aparece, revisá Accesos.", ok: false };
  }
  try {
    const cliente = await createClient();
    const { error } = await cliente.rpc("set_employee_account", {
      p_user_id: usuarioId, p_expected_updated_at: version,
      ...(!desvincular ? { p_employee_id: empleadoId } : {}),
    });
    if (error) return { error: errorVinculo(error), ok: false };
  } catch (error) { return { error: errorVinculo(error), ok: false }; }
  revalidatePath(`/empleados/${empleadoId}`);
  revalidatePath("/accesos");
  return { error: null, ok: true };
}
