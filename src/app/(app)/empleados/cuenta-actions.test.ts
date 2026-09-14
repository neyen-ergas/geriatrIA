import { beforeEach, expect, it, vi } from "vitest";
import { vincularCuenta, desvincularCuenta } from "./cuenta-actions";

const mocks = vi.hoisted(() => ({ sesion: vi.fn(), cliente: vi.fn(), rpc: vi.fn(), revalidar: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cliente }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
const EMPLEADO = "82000000-0000-4000-8000-000000000001";
const CUENTA = "82000000-0000-4000-8000-000000000002";
const VERSION = "2026-09-14T12:00:00.123456Z";
const INICIAL = { ok: false, error: null };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.cliente.mockResolvedValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ error: null });
});
it.each([
  () => vincularCuenta(EMPLEADO, INICIAL, formulario()),
  () => desvincularCuenta(EMPLEADO, CUENTA, VERSION, INICIAL, new FormData()),
])("solo Administrador llega a la escritura", async accion => {
  mocks.sesion.mockRejectedValue(new Error("DENEGADO"));
  await expect(accion()).rejects.toThrow("DENEGADO");
  expect(mocks.sesion).toHaveBeenCalledWith("administration");
  expect(mocks.cliente).not.toHaveBeenCalled();
});
it("vincula conservando la versión exacta y sin modificar permisos", async () => {
  expect((await vincularCuenta(EMPLEADO, INICIAL, formulario())).ok).toBe(true);
  expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("set_employee_account", {
    p_user_id: CUENTA, p_employee_id: EMPLEADO, p_expected_updated_at: VERSION,
  });
  expect(mocks.revalidar).toHaveBeenCalledWith(`/empleados/${EMPLEADO}`);
  expect(mocks.revalidar).toHaveBeenCalledWith("/accesos");
});
it("desvincula con la misma función y su valor nulo por defecto", async () => {
  expect((await desvincularCuenta(EMPLEADO, CUENTA, VERSION, INICIAL, new FormData())).ok).toBe(true);
  expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("set_employee_account", { p_user_id: CUENTA, p_expected_updated_at: VERSION });
});
it("rechaza cuentas o versiones inválidas antes de consultar", async () => {
  expect((await vincularCuenta(EMPLEADO, INICIAL, new FormData())).ok).toBe(false);
  expect((await desvincularCuenta("incorrecto", CUENTA, VERSION, INICIAL, new FormData())).ok).toBe(false);
  const datos = formulario(); datos.set("version", "incorrecta");
  expect((await vincularCuenta(EMPLEADO, INICIAL, datos)).ok).toBe(false);
  expect(mocks.cliente).not.toHaveBeenCalled();
});
it.each([
  ["40001", "access_changed", "La cuenta cambió"],
  ["23505", "DATO PRIVADO", "ya tiene una cuenta"],
  ["23514", "employee_inactive", "empleado dado de baja"],
  ["23514", "account_already_linked", "otra ficha"],
  ["P0002", "account_access_missing", "asigná un perfil"],
  ["42501", "DATO PRIVADO", "Revisá tus permisos"],
])("traduce %s sin filtrar datos ni reintentar", async (code, message, esperado) => {
  mocks.rpc.mockResolvedValue({ error: { code, message } });
  const resultado = await vincularCuenta(EMPLEADO, INICIAL, formulario());
  expect(resultado.error).toContain(esperado);
  expect(resultado.error).not.toContain("DATO PRIVADO");
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
  expect(mocks.revalidar).not.toHaveBeenCalled();
});
function formulario(): FormData {
  const datos = new FormData(); datos.set("cuenta", CUENTA); datos.set("version", VERSION); return datos;
}
