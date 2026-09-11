import { beforeEach, expect, it, vi } from "vitest";
import { registrarPago } from "./actions";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ sesion: vi.fn(), cuota: vi.fn(), rpc: vi.fn(),
  claims: vi.fn(), upload: vi.fn(), revalidar: vi.fn(), redirigir: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/pagos-datos", () => ({ obtenerCuota: mocks.cuota, obtenerCuenta: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  auth: { getClaims: mocks.claims }, rpc: mocks.rpc,
  storage: { from: () => ({ upload: mocks.upload }) },
}) }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirigir }));
const inicial = { errores: {}, mensaje: null, valores: {} };
const usuario = "11111111-1111-4111-8111-111111111111";
function datos(): FormData {
  const form = new FormData();
  for (const [campo, valor] of Object.entries({ importe: "50", fecha: "2025-01-01", medio: "cash" })) form.set(campo, valor);
  form.set("comprobante", new File(["%PDF-1.7"], "apellido-privado.pdf", { type: "application/pdf" }));
  return form;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.cuota.mockResolvedValue({ id: "cuota", balance: 100, payment_status: "pending" });
  mocks.claims.mockResolvedValue({ data: { claims: { sub: usuario } }, error: null });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.rpc.mockResolvedValue({ data: "pago", error: null });
  mocks.redirigir.mockImplementation(() => { throw new Error("REDIRECT"); });
});
it("sube con nombre generado y vincula la ruta al pago solo tras subir", async () => {
  await expect(registrarPago("estadia", "cuota", inicial, datos())).rejects.toThrow("REDIRECT");
  const ruta = mocks.upload.mock.calls[0][0];
  expect(ruta).toMatch(new RegExp(`^${usuario}/estadia/cuota/[a-f0-9-]+\\.pdf$`));
  expect(ruta).not.toContain("apellido");
  expect(mocks.upload.mock.calls[0][2]).toEqual({ contentType: "application/pdf", upsert: false });
  expect(mocks.rpc).toHaveBeenCalledWith("record_payment", expect.objectContaining({ p_receipt_path: ruta }));
  expect(mocks.upload.mock.invocationCallOrder[0]).toBeLessThan(mocks.rpc.mock.invocationCallOrder[0]);
});
it.each(["rechazo", "interrupcion"])("no cobra si falla la carga: %s", async caso => {
  if (caso === "rechazo") mocks.upload.mockResolvedValue({ error: { message: "detalle privado" } });
  else mocks.upload.mockRejectedValue(new Error("detalle privado"));
  const resultado = await registrarPago("estadia", "cuota", inicial, datos());
  expect(resultado.errores.comprobante).toContain("no se registró");
  expect(resultado.mensaje).not.toContain("detalle privado");
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.revalidar).not.toHaveBeenCalled();
});
it("no sube ni cobra un archivo con firma inválida", async () => {
  const form = datos(); form.set("comprobante", new File(["falso"], "foto.jpg", { type: "image/jpeg" }));
  expect((await registrarPago("estadia", "cuota", inicial, form)).errores.comprobante).toBeTruthy();
  expect(mocks.upload).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
});
it("conserva el archivo y bloquea el reenvío cuando el pago tiene resultado incierto", async () => {
  mocks.rpc.mockRejectedValue(new Error("Respuesta perdida"));
  expect((await registrarPago("estadia", "cuota", inicial, datos())).bloqueado).toBe(true);
  expect(mocks.upload).toHaveBeenCalledTimes(1); expect(mocks.rpc).toHaveBeenCalledTimes(1);
  expect(mocks.revalidar).not.toHaveBeenCalled();
});
