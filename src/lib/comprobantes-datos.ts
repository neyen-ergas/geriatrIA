import "server-only";

import { createClient } from "@/lib/supabase/server";
import { BUCKET_COMPROBANTES, validarComprobante } from "@/lib/comprobantes";

type CargaComprobante = { ok: true; ruta: string | null }
  | { ok: false; error: string };

export async function cargarComprobante(
  supabase: Awaited<ReturnType<typeof createClient>>,
  admissionId: string, cuotaId: string, archivo: FormDataEntryValue | null,
): Promise<CargaComprobante> {
  const validacion = await validarComprobante(archivo);
  if (!validacion.ok) return validacion;
  if (!validacion.datos) return { ok: true, ruta: null };
  try {
    const { data, error: errorSesion } = await supabase.auth.getClaims();
    if (errorSesion || !data?.claims.sub) return { ok: false, error: "Tu sesión venció. Volvé a iniciar sesión." };
    const { archivo: comprobante, extension } = validacion.datos;
    const ruta = `${data.claims.sub}/${admissionId}/${cuotaId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(BUCKET_COMPROBANTES)
      .upload(ruta, comprobante, { contentType: comprobante.type, upsert: false });
    if (error) return { ok: false, error: "No se pudo subir el comprobante. El pago no se registró; seleccioná el archivo de nuevo o continuá sin adjunto." };
    return { ok: true, ruta };
  } catch {
    return { ok: false, error: "Se interrumpió la carga del comprobante. El pago no se registró; podés intentarlo nuevamente." };
  }
}
