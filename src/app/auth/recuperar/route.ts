import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const codigo = request.nextUrl.searchParams.get("code");
  const flujo = request.nextUrl.searchParams.get("sb_flow_id");
  let destino = "/recuperar?error=enlace";
  if (codigo) {
    try {
      const supabase = await createClient();
      // El SDK distingue los verificadores de varios pedidos en un mismo navegador.
      const { data, error } =
        flujo === null
          ? await supabase.auth.exchangeCodeForSession(codigo)
          : await supabase.auth.exchangeCodeForSession(codigo, { flowId: flujo });
      if (!error && data.user) destino = "/restablecer";
    } catch {
      // Un enlace inválido o un fallo de conexión permite iniciar otro pedido.
    }
  }
  const respuesta = NextResponse.redirect(new URL(destino, request.url));
  respuesta.headers.set("Cache-Control", "private, no-store");
  respuesta.headers.set("Referrer-Policy", "no-referrer");
  return respuesta;
}
