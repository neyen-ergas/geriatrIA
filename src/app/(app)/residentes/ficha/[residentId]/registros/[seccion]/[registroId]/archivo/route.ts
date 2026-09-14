import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/auth";
import { obtenerRegistroResidente } from "@/lib/registros-residente-datos";
import { createClient } from "@/lib/supabase/server";

export async function GET(_peticion: Request, { params }: {
  params: Promise<{ residentId: string; seccion: string; registroId: string }>;
}): Promise<Response> {
  await requerirSesion("operational.read");
  const { residentId, seccion, registroId } = await params;
  if (seccion !== "documentos") return fallo(404);
  try {
    const registro = await obtenerRegistroResidente(residentId, "documentos", registroId);
    if (!registro || !("file_path" in registro)) return fallo(404);
    const partes = registro.file_path.split("/");
    if (partes.length !== 3 || partes[1] !== residentId || !/^[0-9a-f-]{36}\.(jpg|png|pdf)$/i.test(partes[2])) return fallo(404);
    const cliente = await createClient();
    const { data, error } = await cliente.storage.from("resident-documents")
      .createSignedUrl(registro.file_path, 60, { download: `documento.${partes[2].split(".").pop()}` });
    if (error || !data?.signedUrl) return fallo(503);
    return NextResponse.redirect(data.signedUrl, { status: 307,
      headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  } catch { return fallo(503); }
}
function fallo(status: number): Response {
  return new Response(status === 404 ? "Documento no disponible." : "No se pudo descargar. Volvé a intentar.", {
    status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}
