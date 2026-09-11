import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/auth";
import { BUCKET_COMPROBANTES, perteneceComprobante } from "@/lib/comprobantes";
import { obtenerCuota } from "@/lib/pagos-datos";
import { obtenerMovimiento } from "@/lib/movimientos-datos";
import { createClient } from "@/lib/supabase/server";

export async function GET(_peticion: Request, { params }: {
  params: Promise<{ admissionId: string; cuotaId: string; pagoId: string }>;
}): Promise<Response> {
  await requerirSesion();
  const { admissionId, cuotaId, pagoId } = await params;
  try {
    const cuota = await obtenerCuota(admissionId, cuotaId);
    if (!cuota) return respuestaError("La cuota no está disponible.", 404);
    const pago = await obtenerMovimiento(cuotaId, pagoId);
    if (!pago?.receipt_path || !perteneceComprobante(pago.receipt_path, admissionId, cuotaId)) {
      return respuestaError("Este pago no tiene un comprobante disponible.", 404);
    }
    const supabase = await createClient();
    const extension = pago.receipt_path.split(".").pop();
    const { data, error } = await supabase.storage.from(BUCKET_COMPROBANTES)
      .createSignedUrl(pago.receipt_path, 60, { download: `comprobante.${extension}` });
    if (error || !data?.signedUrl) return respuestaError("No pudimos descargar el comprobante. Volvé al detalle e intentá nuevamente.", 503);
    return NextResponse.redirect(data.signedUrl, {
      status: 307, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
    });
  } catch {
    return respuestaError("No pudimos descargar el comprobante. Volvé al detalle e intentá nuevamente.", 503);
  }
}

function respuestaError(mensaje: string, status: number): Response {
  return new Response(mensaje, { status, headers: {
    "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store",
  } });
}
