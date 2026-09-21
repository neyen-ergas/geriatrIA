import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { expect, it } from "vitest";

it("el SDK conserva el verificador del correo en cookies y crea sesión en el servidor", async () => {
  const almacen = new Map<string, string>();
  const cookies = {
    getAll: () => Array.from(almacen, ([name, value]) => ({ name, value })),
    setAll: (valores: Array<{ name: string; value: string }>) => {
      for (const { name, value } of valores) {
        if (value) almacen.set(name, value);
        else almacen.delete(name);
      }
    },
  };
  const pedidos: Array<{ url: URL; cuerpo: Record<string, string> }> = [];
  const usuario = { id: "usuario-sintetico", email: "cuenta@example.test" };
  const jwt = [
    { alg: "HS256", typ: "JWT" },
    { sub: usuario.id, exp: Math.floor(Date.now() / 1000) + 3600 },
  ]
    .map(parte => Buffer.from(JSON.stringify(parte)).toString("base64url"))
    .join(".");
  const fetchFalso: typeof fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    pedidos.push({ url, cuerpo: JSON.parse(String(init?.body ?? "{}")) });
    if (url.pathname.endsWith("/recover")) return Response.json({});
    if (url.pathname.endsWith("/token")) {
      return Response.json({
        access_token: `${jwt}.c2ludGV0aWNh`,
        refresh_token: "refresh-sintetico",
        expires_in: 3600,
        token_type: "bearer",
        user: usuario,
      });
    }
    if (url.pathname.endsWith("/user")) return Response.json(usuario);
    throw new Error("Solicitud inesperada en el test");
  };
  const opciones = { cookies, global: { fetch: fetchFalso } };
  const navegador = createBrowserClient("https://prueba.supabase.co", "publicable", {
    ...opciones,
    isSingleton: false,
    auth: { autoRefreshToken: false },
  });
  const envio = await navegador.auth.resetPasswordForEmail(usuario.email, {
    redirectTo: "https://residencia.test/auth/recuperar",
  });
  expect(envio.error).toBeNull();
  const correo = pedidos.find(pedido => pedido.url.pathname.endsWith("/recover"))!;
  const retorno = new URL(correo.url.searchParams.get("redirect_to")!);
  expect(retorno.origin + retorno.pathname).toBe(
    "https://residencia.test/auth/recuperar",
  );
  expect(correo.cuerpo.code_challenge).toBeTruthy();
  expect(almacen.size).toBeGreaterThan(0);

  const servidor = createServerClient(
    "https://prueba.supabase.co",
    "publicable",
    opciones,
  );
  const intercambio = await servidor.auth.exchangeCodeForSession("codigo-sintetico");
  expect(intercambio.error).toBeNull();
  expect(intercambio.data.user?.id).toBe(usuario.id);
  const token = pedidos.find(pedido => pedido.url.pathname.endsWith("/token"))!;
  expect(token.cuerpo.auth_code).toBe("codigo-sintetico");
  expect(token.cuerpo.code_verifier).toBeTruthy();

  const otroPedido = createServerClient(
    "https://prueba.supabase.co",
    "publicable",
    opciones,
  );
  const verificado = await otroPedido.auth.getUser();
  expect(verificado.data.user?.id).toBe(usuario.id);

  const sinCookies = createServerClient("https://prueba.supabase.co", "publicable", {
    global: { fetch: fetchFalso },
    cookies: { getAll: () => [], setAll: () => {} },
  });
  const cantidad = pedidos.length;
  const ajeno = await sinCookies.auth.exchangeCodeForSession("codigo-sintetico");
  expect(ajeno.error).not.toBeNull();
  expect(pedidos).toHaveLength(cantidad);
});
