import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({ exchangeCodeForSession: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: mocks }),
}));
beforeEach(() => vi.resetAllMocks());

it("sin código no intenta crear una sesión", async () => {
  const respuesta = await GET(new NextRequest("https://residencia.test/auth/recuperar"));
  expect(respuesta.headers.get("location")).toBe(
    "https://residencia.test/recuperar?error=enlace",
  );
  expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
});

it("el intercambio válido tiene destino fijo y no filtra el código", async () => {
  mocks.exchangeCodeForSession.mockResolvedValue({ data: { user: {} }, error: null });
  const respuesta = await GET(
    new NextRequest(
      "https://residencia.test/auth/recuperar?code=un-uso&next=https://ajeno.test",
    ),
  );
  expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("un-uso");
  expect(respuesta.headers.get("location")).toBe("https://residencia.test/restablecer");
  expect(respuesta.headers.get("cache-control")).toContain("no-store");
  expect(respuesta.headers.get("referrer-policy")).toBe("no-referrer");
});

it.each(["vencido", "red"])("permite repetir el pedido si falla: %s", async fallo => {
  if (fallo === "red")
    mocks.exchangeCodeForSession.mockRejectedValue(new Error("privado"));
  else mocks.exchangeCodeForSession.mockResolvedValue({ data: {}, error: {} });
  const respuesta = await GET(
    new NextRequest("https://residencia.test/auth/recuperar?code=invalido"),
  );
  expect(respuesta.headers.get("location")).toBe(
    "https://residencia.test/recuperar?error=enlace",
  );
});

it("conserva el identificador del pedido y no usa el de otra pestaña", async () => {
  mocks.exchangeCodeForSession.mockResolvedValue({ data: { user: {} }, error: null });
  await GET(
    new NextRequest(
      "https://residencia.test/auth/recuperar?code=un-uso&sb_flow_id=flujo-del-correo",
    ),
  );
  expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("un-uso", {
    flowId: "flujo-del-correo",
  });
});
