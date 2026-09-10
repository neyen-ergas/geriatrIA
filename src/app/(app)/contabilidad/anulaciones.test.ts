import { beforeEach, describe, expect, it, vi } from "vitest";
import { anularPago, cancelarCuota } from "./anulaciones";

const mocks = vi.hoisted(() => ({ sesion: vi.fn(), cuota: vi.fn(), pago: vi.fn(),
  cliente: vi.fn(), rpc: vi.fn(), revalidar: vi.fn(), redirigir: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/pagos-datos", () => ({ obtenerCuota: mocks.cuota }));
vi.mock("@/lib/movimientos-datos", () => ({ obtenerMovimiento: mocks.pago }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cliente }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirigir }));
const inicial = { motivo: "", error: null };
const acciones = [
  (datos: FormData) => anularPago("estadia", "cuota", "pago", inicial, datos),
  (datos: FormData) => cancelarCuota("estadia", "cuota", inicial, datos),
];
function formulario(motivo = "  Error de carga  "): FormData {
  const datos = new FormData(); datos.set("motivo", motivo); return datos;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.cuota.mockResolvedValue({ paid_amount: 0, payment_status: "pending" });
  mocks.pago.mockResolvedValue({ voided_at: null });
  mocks.cliente.mockResolvedValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ data: "resultado", error: null });
  mocks.redirigir.mockImplementation(() => { throw new Error("REDIRECT"); });
});

describe.each(acciones)("anulación financiera", accion => {
  it("exige sesión antes de leer o escribir", async () => {
    mocks.sesion.mockRejectedValue(new Error("LOGIN"));
    await expect(accion(formulario())).rejects.toThrow("LOGIN");
    expect(mocks.cuota).not.toHaveBeenCalled();
    expect(mocks.cliente).not.toHaveBeenCalled();
  });
  it("rechaza motivo vacío antes de leer o escribir", async () => {
    expect((await accion(formulario("   "))).error).toContain("motivo");
    expect(mocks.cuota).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("valida pertenencia de cuota a estadía", async () => {
    mocks.cuota.mockResolvedValue(null);
    expect((await accion(formulario())).error).toContain("cuenta");
    expect(mocks.cuota).toHaveBeenCalledWith("estadia", "cuota");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(["excepcion", "sin resultado"])("no confirma ni reintenta un resultado incierto: %s", async caso => {
    if (caso === "excepcion") mocks.rpc.mockRejectedValue(new Error("dato privado"));
    else mocks.rpc.mockResolvedValue({ data: null, error: null });
    const resultado = await accion(formulario());
    expect(resultado.bloqueado).toBe(true);
    expect(resultado.motivo).toBe("Error de carga");
    expect(resultado.error).not.toContain("dato privado");
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.revalidar).not.toHaveBeenCalled();
    expect(mocks.redirigir).not.toHaveBeenCalled();
  });
  it("revalida cuenta y detalle al confirmar", async () => {
    await expect(accion(formulario())).rejects.toThrow("REDIRECT");
    expect(mocks.revalidar.mock.calls).toEqual([
      ["/contabilidad/estadia"], ["/contabilidad/estadia/cuotas/cuota"],
    ]);
  });
});

it("anula solo un pago vigente de la cuota y transmite el motivo normalizado", async () => {
  await expect(acciones[0](formulario())).rejects.toThrow("REDIRECT");
  expect(mocks.pago).toHaveBeenCalledWith("cuota", "pago");
  expect(mocks.rpc).toHaveBeenCalledWith("void_payment", {
    p_payment_id: "pago", p_reason: "Error de carga",
  });
});
it.each([null, { voided_at: "2026-09-10" }])("rechaza pago ajeno o ya anulado", async pago => {
  mocks.pago.mockResolvedValue(pago);
  expect((await acciones[0](formulario())).error).toContain("pago");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("rechaza cancelar con pagos vigentes incluso fuera de la página visible", async () => {
  mocks.cuota.mockResolvedValue({ paid_amount: 1, payment_status: "partial" });
  expect((await acciones[1](formulario())).error).toContain("pagos vigentes");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("explica el rechazo si ingresó otro pago entre lectura y cancelación", async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { code: "23514", message: "dato privado" } });
  expect((await acciones[1](formulario())).error).toContain("pagos vigentes");
  expect(mocks.revalidar).not.toHaveBeenCalled();
});
it("cancela la cuota sin pagos con la operación controlada", async () => {
  await expect(acciones[1](formulario())).rejects.toThrow("REDIRECT");
  expect(mocks.rpc).toHaveBeenCalledWith("cancel_monthly_charge", {
    p_monthly_charge_id: "cuota", p_reason: "Error de carga",
  });
});
