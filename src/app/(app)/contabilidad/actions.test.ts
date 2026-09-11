import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearCuota, registrarPago } from "./actions";

const mocks = vi.hoisted(() => ({ sesion: vi.fn(), cuenta: vi.fn(), cuota: vi.fn(),
  cliente: vi.fn(), rpc: vi.fn(), revalidar: vi.fn(), redirigir: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/pagos-datos", () => ({ obtenerCuenta: mocks.cuenta, obtenerCuota: mocks.cuota }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cliente }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirigir }));
const inicial = { errores: {}, mensaje: null, valores: {} };
const acciones = [
  (datos: FormData) => crearCuota("estadia", inicial, datos),
  (datos: FormData) => registrarPago("estadia", "cuota", inicial, datos),
];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.cuenta.mockResolvedValue({ id: "estadia", admitted_at: "2025-01-01", discharged_at: null });
  mocks.cuota.mockResolvedValue({ id: "cuota", balance: 1000, payment_status: "pending" });
  mocks.cliente.mockResolvedValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ data: "movimiento", error: null });
  mocks.redirigir.mockImplementation(() => { throw new Error("REDIRECT"); });
});
function formulario(): FormData {
  const datos = new FormData();
  Object.entries({ periodo: "2025-02", vencimiento: "2025-02-28", importe: "100",
    fecha: "2025-02-10", medio: "cash", notas: "", referencia: "" })
    .forEach(([campo, valor]) => datos.set(campo, valor));
  return datos;
}

describe.each(acciones)("escritura financiera", accion => {
  it("exige sesión antes de toda lectura o escritura", async () => {
    mocks.sesion.mockRejectedValue(new Error("LOGIN"));
    await expect(accion(formulario())).rejects.toThrow("LOGIN");
    expect(mocks.cuenta).not.toHaveBeenCalled();
    expect(mocks.cuota).not.toHaveBeenCalled();
    expect(mocks.cliente).not.toHaveBeenCalled();
  });
  it("solo revalida y redirige después de confirmar la operación", async () => {
    await expect(accion(formulario())).rejects.toThrow("REDIRECT");
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.revalidar).toHaveBeenCalledWith("/contabilidad/estadia");
    expect(mocks.revalidar).toHaveBeenCalledWith("/contabilidad/vencimientos");
    expect(mocks.redirigir).toHaveBeenCalledTimes(1);
  });
  it("no escribe datos inválidos", async () => {
    const datos = formulario(); datos.set("importe", "0");
    expect((await accion(datos)).errores.importe).toBeTruthy();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(["excepcion", "respuesta vacia", "error desconocido"])(
    "bloquea el reenvío ante resultado incierto: %s", async caso => {
      if (caso === "excepcion") mocks.rpc.mockRejectedValue(new Error("dato privado"));
      else mocks.rpc.mockResolvedValue({ data: null,
        error: caso === "respuesta vacia" ? null : { code: "XX000", message: "dato privado" } });
      const resultado = await accion(formulario());
      expect(resultado.bloqueado).toBe(true);
      expect(resultado.mensaje).not.toContain("dato privado");
      expect(mocks.rpc).toHaveBeenCalledTimes(1);
      expect(mocks.revalidar).not.toHaveBeenCalled();
      expect(mocks.redirigir).not.toHaveBeenCalled();
    },
  );
});
it("no registra un pago si la cuota no pertenece a la estadía", async () => {
  mocks.cuota.mockResolvedValue(null);
  expect((await registrarPago("estadia", "otra-cuota", inicial, formulario())).mensaje)
    .toContain("no pertenece");
  expect(mocks.cuota).toHaveBeenCalledWith("estadia", "otra-cuota");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
