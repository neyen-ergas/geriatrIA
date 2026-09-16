"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { esIdFamiliar } from "@/lib/familiares";
import { validarComprobante } from "@/lib/comprobantes";
import { obtenerRegistroResidente } from "@/lib/registros-residente-datos";
import {
  camposRegistro,
  CONFIG_REGISTRO,
  errorRegistro,
  esSeccionRegistro,
  rutaRegistros,
  validarRegistro,
  type EstadoRegistro,
} from "@/lib/registros-residente";
import type { Json } from "@/types/database";

export async function guardarRegistro(
  residenteId: string,
  seccion: string,
  registroId: string,
  version: string | null,
  _anterior: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  await requerirSesion("operational.write");
  const fallo = (mensaje: string): EstadoRegistro => ({
    valores: {},
    errores: {},
    mensaje,
  });
  if (
    !esSeccionRegistro(seccion) ||
    !esIdFamiliar(residenteId) ||
    !esIdFamiliar(registroId)
  ) {
    return fallo("Volvé a abrir el formulario desde la ficha.");
  }
  const estado = validarRegistro(seccion, formData, hoyEnArgentina());
  if (estado.mensaje) return estado;
  const valores: Record<string, Json> = {};
  for (const campo of camposRegistro(seccion)) {
    const texto = estado.valores[campo.nombre];
    valores[campo.nombre] = texto
      ? campo.tipo === "number"
        ? Number(texto)
        : texto
      : null;
  }
  try {
    const cliente = await createClient();
    if (seccion === "documentos") {
      if (version) {
        const anterior = await obtenerRegistroResidente(residenteId, seccion, registroId);
        if (!anterior || !("file_path" in anterior))
          return { ...estado, mensaje: "El documento no está disponible." };
        valores.file_path = anterior.file_path;
      } else {
        const archivo = await validarComprobante(formData.get("archivo"));
        if (!archivo.ok || !archivo.datos)
          return {
            ...estado,
            errores: {
              archivo: archivo.ok
                ? "Seleccioná un archivo."
                : archivo.error.replaceAll("comprobante", "documento"),
            },
            mensaje: "Revisá el archivo seleccionado.",
          };
        const { data: identidad, error: errorIdentidad } = await cliente.auth.getClaims();
        if (errorIdentidad || !identidad?.claims.sub)
          return { ...estado, mensaje: "Volvé a iniciar sesión." };
        const ruta = `${identidad.claims.sub}/${residenteId}/${randomUUID()}.${archivo.datos.extension}`;
        const { error: errorCarga } = await cliente.storage
          .from("resident-documents")
          .upload(ruta, archivo.datos.archivo, {
            upsert: false,
            contentType: archivo.datos.archivo.type,
          });
        if (errorCarga)
          return {
            ...estado,
            mensaje: "No se pudo cargar el archivo. Intentá nuevamente.",
          };
        valores.file_path = ruta;
      }
    }
    const { data, error } = await cliente.rpc("save_resident_record", {
      p_section: CONFIG_REGISTRO[seccion].tabla,
      p_resident_id: residenteId,
      p_id: registroId,
      p_values: valores,
      p_expected_updated_at: version ?? undefined,
    });
    if (error || data !== registroId) return { ...estado, mensaje: errorRegistro(error) };
  } catch (error) {
    return { ...estado, mensaje: errorRegistro(error) };
  }
  revalidatePath(rutaRegistros(residenteId, seccion));
  revalidatePath("/auditoria");
  redirect(`${rutaRegistros(residenteId, seccion)}?guardado=1`);
}

export async function archivarRegistro(
  residenteId: string,
  seccion: string,
  registroId: string,
  version: string,
  _anterior: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  await requerirSesion("operational.write");
  const valor = formData.get("motivo"),
    motivo = typeof valor === "string" ? valor.trim() : "";
  const estado: EstadoRegistro = { valores: { motivo }, errores: {}, mensaje: null };
  if (
    !esSeccionRegistro(seccion) ||
    !esIdFamiliar(residenteId) ||
    !esIdFamiliar(registroId)
  ) {
    return { ...estado, mensaje: "Volvé a abrir el registro desde la ficha." };
  }
  if (!motivo)
    return {
      ...estado,
      errores: { motivo: "Completá el motivo." },
      mensaje: "Indicá por qué se archiva.",
    };
  try {
    const cliente = await createClient();
    const { data, error } = await cliente.rpc("save_resident_record", {
      p_section: CONFIG_REGISTRO[seccion].tabla,
      p_resident_id: residenteId,
      p_id: registroId,
      p_expected_updated_at: version,
      p_archive_reason: motivo,
    });
    if (error || data !== registroId) return { ...estado, mensaje: errorRegistro(error) };
  } catch (error) {
    return { ...estado, mensaje: errorRegistro(error) };
  }
  revalidatePath(rutaRegistros(residenteId, seccion));
  revalidatePath("/auditoria");
  redirect(`${rutaRegistros(residenteId, seccion)}?estado=archivados&guardado=1`);
}
