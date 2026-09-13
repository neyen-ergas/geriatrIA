"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import { normalizarDni } from "@/lib/dni-residente";
import { errorConversionConsulta } from "@/lib/conversion-consulta";
import { listarVinculosConsultas } from "@/lib/conversion-consulta-datos";
import { hoyEnArgentina, leerValoresPrimerIngreso, validarPrimerIngreso, type EstadoFormularioIngreso } from "@/lib/primer-ingreso";
import { leerValoresReingreso, validarReingreso, type EstadoReingreso } from "@/lib/reingreso-residente";
import { obtenerResidenteParaReingreso } from "@/lib/residentes-datos";
import { createClient } from "@/lib/supabase/server";

export async function buscarPersonaIngreso(
  consultaId: string, _anterior: { error: string | null }, datos: FormData,
): Promise<{ error: string | null }> {
  await requerirSesion("operational.write");
  const valor = datos.get("dni");
  const dni = typeof valor === "string" ? normalizarDni(valor) : "";
  if (!dni) return { error: "Ingresá el DNI del residente." };
  let id: string;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("residents").select("id").eq("dni", dni).maybeSingle();
    if (error) return { error: "No se pudo buscar la ficha. Intentá nuevamente." };
    if (!data) return { error: "No encontramos ese DNI. Completá el formulario de persona nueva." };
    id = data.id;
  } catch { return { error: "No se pudo buscar la ficha. Intentá nuevamente." }; }
  redirect(`/admision/${consultaId}/ingreso?residente=${id}`);
}

export async function convertirPersonaNueva(
  consultaId: string, version: string,
  _anterior: EstadoFormularioIngreso, datos: FormData,
): Promise<EstadoFormularioIngreso> {
  await requerirSesion("operational.write");
  const valores = leerValoresPrimerIngreso(datos);
  let previo: string | undefined;
  try { previo = (await listarVinculosConsultas([consultaId]))[consultaId]; }
  catch (error) { return { valores, errores: {}, mensaje: errorConversionConsulta(error) }; }
  if (previo) irACuenta(previo);
  const validacion = validarPrimerIngreso(datos, hoyEnArgentina());
  if (!validacion.ok) return { valores, errores: validacion.errores, mensaje: "Revisá los campos marcados." };
  let ingreso: string;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("convert_consultation_admission", {
      ...validacion.datos, p_consultation_id: consultaId, p_expected_updated_at: version,
    });
    if (error || !data) return { valores, errores: {}, mensaje: errorConversionConsulta(error) };
    ingreso = data;
  } catch (error) { return { valores, errores: {}, mensaje: errorConversionConsulta(error) }; }
  irACuenta(ingreso);
}

export async function convertirReingreso(
  consultaId: string, version: string, residentId: string,
  _anterior: EstadoReingreso, datos: FormData,
): Promise<EstadoReingreso> {
  await requerirSesion("operational.write");
  const valores = leerValoresReingreso(datos);
  let previo: string | undefined;
  try { previo = (await listarVinculosConsultas([consultaId]))[consultaId]; }
  catch (error) { return { valores, errores: {}, mensaje: errorConversionConsulta(error) }; }
  if (previo) irACuenta(previo);
  let ingreso: string;
  try {
    const residente = await obtenerResidenteParaReingreso(residentId);
    if (!residente) return { valores, errores: {}, mensaje: "La persona tiene un ingreso activo o no hay una baja anterior. Volvé a abrir la consulta para revisar el vínculo." };
    const validacion = validarReingreso(datos, residente.lastAdmission.dischargedAt, hoyEnArgentina());
    if (!validacion.ok) return { valores, errores: validacion.errores, mensaje: "Revisá los campos marcados." };
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("convert_consultation_admission", {
      p_consultation_id: consultaId, p_expected_updated_at: version, p_resident_id: residentId,
      p_admitted_at: validacion.datos.admitted_at,
      p_monthly_fee: validacion.datos.monthly_fee, p_due_day: validacion.datos.due_day,
      p_room: validacion.datos.room ?? undefined,
      p_administrative_notes: validacion.datos.administrative_notes ?? undefined,
    });
    if (error || !data) return { valores, errores: {}, mensaje: errorConversionConsulta(error) };
    ingreso = data;
  } catch (error) { return { valores, errores: {}, mensaje: errorConversionConsulta(error) }; }
  irACuenta(ingreso);
}

function irACuenta(ingreso: string): never {
  revalidatePath("/");
  revalidatePath("/admision");
  revalidatePath("/admision/agenda");
  revalidatePath("/admision/[consultaId]", "page");
  revalidatePath("/residentes");
  revalidatePath("/contabilidad");
  redirect(`/contabilidad/${ingreso}`);
}
