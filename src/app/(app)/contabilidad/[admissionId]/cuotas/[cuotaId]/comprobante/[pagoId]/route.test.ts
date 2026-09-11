import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({ sesion: vi.fn(), cuota: vi.fn(), pago: vi.fn(), firmar: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/pagos-datos", () => ({ obtenerCuota: mocks.cuota }));
vi.mock("@/lib/movimientos-datos", () => ({ obtenerMovimiento: mocks.pago }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  storage: { from: () => ({ createSignedUrl: mocks.firmar }) },
}) }));
const ruta = "11111111-1111-4111-8111-111111111111/estadia/cuota/22222222-2222-4222-8222-222222222222.pdf";
const peticion = new Request("https://ejemplo.invalid");
const contexto = { params: Promise.resolve({ admissionId: "estadia", cuotaId: "cuota", pagoId: "pago" }) };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.cuota.mockResolvedValue({ id: "cuota" });
  mocks.pago.mockResolvedValue({ receipt_path: ruta, voided_at: "2026-09-01" });
  mocks.firmar.mockResolvedValue({ data: { signedUrl: "https://supabase.invalid/descarga?token=ficticio" }, error: null });
});
it("exige sesión también en la ruta de descarga", async () => {
  mocks.sesion.mockRejectedValue(new Error("LOGIN"));
  await expect(GET(peticion, contexto)).rejects.toThrow("LOGIN");
  expect(mocks.cuota).not.toHaveBeenCalled(); expect(mocks.firmar).not.toHaveBeenCalled();
});
it("firma por 60 segundos como descarga privada, incluso para pagos anulados", async () => {
  const respuesta = await GET(peticion, contexto);
  expect(respuesta.status).toBe(307);
  expect(respuesta.headers.get("cache-control")).toBe("private, no-store");
  expect(mocks.cuota).toHaveBeenCalledWith("estadia", "cuota");
  expect(mocks.pago).toHaveBeenCalledWith("cuota", "pago");
  expect(mocks.firmar).toHaveBeenCalledWith(ruta, 60, { download: "comprobante.pdf" });
});
it("rechaza ruta de otra cuota sin firmar", async () => {
  mocks.pago.mockResolvedValue({ receipt_path: ruta.replace("/cuota/", "/otra/") });
  expect((await GET(peticion, contexto)).status).toBe(404);
  expect(mocks.firmar).not.toHaveBeenCalled();
});
it("no expone errores del almacenamiento", async () => {
  mocks.firmar.mockRejectedValue(new Error("detalle privado"));
  const respuesta = await GET(peticion, contexto);
  expect(respuesta.status).toBe(503);
  expect(await respuesta.text()).not.toContain("detalle privado");
});
