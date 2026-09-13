"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import { errorEmpleado, leerEmpleado, validarEmpleado, validarBajaEmpleado, type EstadoEmpleado } from "@/lib/empleados";
import { obtenerEmpleado } from "@/lib/empleados-datos";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { createClient } from "@/lib/supabase/server";

export async function guardarEmpleado(id: string | null, version: string | null, _previo: EstadoEmpleado, datos: FormData): Promise<EstadoEmpleado> {
  await requerirSesion("administration");
  const valores = leerEmpleado(datos);
  const validacion = validarEmpleado(valores, hoyEnArgentina());
  if (!validacion.ok) return { valores, errores: validacion.errores, mensaje: "Revisá los campos marcados." };
  let empleado: string;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("save_employee", {
      ...validacion.datos, p_id: id ?? undefined, p_expected_updated_at: version ?? undefined,
    });
    if (error || !data) return { valores, errores: {}, mensaje: errorEmpleado(error) };
    empleado = data;
  } catch (error) { return { valores, errores: {}, mensaje: errorEmpleado(error) }; }
  revalidatePath("/empleados");
  revalidatePath(`/empleados/${empleado}`);
  redirect(`/empleados/${empleado}`);
}

export async function darBajaEmpleado(id: string, version: string, _previo: EstadoEmpleado, datos: FormData): Promise<EstadoEmpleado> {
  await requerirSesion("administration");
  const valores = leerEmpleado(datos);
  try {
    const empleado = await obtenerEmpleado(id);
    if (!empleado || empleado.terminated_at) return { valores, errores: {}, mensaje: "La ficha no está disponible para dar de baja. Volvé al listado para revisarla." };
    const errores = validarBajaEmpleado(valores, empleado.hired_at, hoyEnArgentina());
    if (Object.keys(errores).length) return { valores, errores, mensaje: "Revisá los campos marcados." };
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("terminate_employee", {
      p_id: id, p_expected_updated_at: version, p_terminated_at: valores.terminated_at, p_reason: valores.termination_reason,
    });
    if (error || !data) return { valores, errores: {}, mensaje: errorEmpleado(error) };
  } catch (error) { return { valores, errores: {}, mensaje: errorEmpleado(error) }; }
  revalidatePath("/empleados");
  revalidatePath(`/empleados/${id}`);
  redirect(`/empleados/${id}`);
}
