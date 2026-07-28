"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ResultadoAccion {
  ok: boolean;
  error?: string;
}

function limpiar(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

async function contextoOrg() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Sesión expirada" as const };

  const { data: perfil } = await supabase
    .from("usuario_perfil")
    .select("organizacion_id")
    .eq("id", user.id)
    .single();
  if (!perfil) return { supabase, error: "Perfil no encontrado" as const };

  const { data: sede } = await supabase
    .from("sede")
    .select("id")
    .eq("organizacion_id", perfil.organizacion_id)
    .limit(1)
    .single();

  return {
    supabase,
    organizacion_id: perfil.organizacion_id as string,
    sede_id: sede?.id as string | undefined,
  };
}

export async function crearResidente(
  _prev: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  const ctx = await contextoOrg();
  if (ctx.error) return { ok: false, error: ctx.error };

  const { error } = await ctx.supabase.from("residente").insert({
    organizacion_id: ctx.organizacion_id,
    sede_id: ctx.sede_id,
    nombre: limpiar(formData.get("nombre")),
    apellido: limpiar(formData.get("apellido")),
    dni: limpiar(formData.get("dni")),
    fecha_nacimiento: limpiar(formData.get("fecha_nacimiento")),
    sexo: limpiar(formData.get("sexo")),
    habitacion_id: limpiar(formData.get("habitacion_id")),
    observaciones: limpiar(formData.get("observaciones")),
  });

  if (error) {
    // RLS: un cuidador no puede crear residentes → mensaje claro.
    return {
      ok: false,
      error:
        error.code === "42501" || /row-level security/i.test(error.message)
          ? "Tu rol no tiene permiso para crear residentes."
          : error.message,
    };
  }

  revalidatePath("/residentes");
  return { ok: true };
}

export async function editarResidente(
  id: string,
  _prev: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("residente")
    .update({
      nombre: limpiar(formData.get("nombre")),
      apellido: limpiar(formData.get("apellido")),
      dni: limpiar(formData.get("dni")),
      fecha_nacimiento: limpiar(formData.get("fecha_nacimiento")),
      sexo: limpiar(formData.get("sexo")),
      habitacion_id: limpiar(formData.get("habitacion_id")),
      observaciones: limpiar(formData.get("observaciones")),
    })
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      error:
        error.code === "42501" || /row-level security/i.test(error.message)
          ? "Tu rol no tiene permiso para editar residentes."
          : error.message,
    };
  }

  revalidatePath("/residentes");
  return { ok: true };
}
