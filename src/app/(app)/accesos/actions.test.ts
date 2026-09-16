import { beforeEach, expect, it, vi } from "vitest";
import { guardarAcceso } from "./actions";

const mocks = vi.hoisted(() => ({
  sesion: vi.fn(),
  cliente: vi.fn(),
  rpc: vi.fn(),
  revalidar: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cliente }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
const INICIAL = { ok: false, error: null };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.cliente.mockResolvedValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ error: null });
});
it("exige administración antes de procesar el formulario", async () => {
  mocks.sesion.mockRejectedValue(new Error("DENEGADO"));
  await expect(guardarAcceso("cuenta", null, INICIAL, new FormData())).rejects.toThrow(
    "DENEGADO",
  );
  expect(mocks.sesion).toHaveBeenCalledWith("administration");
  expect(mocks.cliente).not.toHaveBeenCalled();
});
it("conserva versión exacta, valida perfil y actualiza la navegación", async () => {
  const datos = new FormData();
  datos.set("rol", "management");
  datos.set("habilitado", "si");
  const version = "2026-09-13T12:00:00.123456Z";
  expect((await guardarAcceso("cuenta", version, INICIAL, datos)).ok).toBe(true);
  expect(mocks.rpc).toHaveBeenCalledWith("set_user_access", {
    p_user_id: "cuenta",
    p_role: "management",
    p_enabled: true,
    p_expected_updated_at: version,
  });
  expect(mocks.revalidar).toHaveBeenCalledWith("/", "layout");
  datos.set("rol", "inventado");
  expect((await guardarAcceso("cuenta", version, INICIAL, datos)).ok).toBe(false);
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
});
it.each([
  ["40001", "access_changed", "Volvé a cargar"],
  ["23514", "last_admin_required", "al menos un Administrador"],
  ["23514", "employee_inactive", "debe permanecer suspendida"],
  ["42501", "DATO PRIVADO", "Revisá tus permisos"],
])("traduce el rechazo %s sin reintentar", async (code, message, esperado) => {
  mocks.rpc.mockResolvedValue({ error: { code, message } });
  const datos = new FormData();
  datos.set("rol", "readonly");
  datos.set("habilitado", "no");
  const resultado = await guardarAcceso("cuenta", null, INICIAL, datos);
  expect(resultado.error).toContain(esperado);
  expect(resultado.error).not.toContain("DATO PRIVADO");
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
  expect(mocks.revalidar).not.toHaveBeenCalled();
});
