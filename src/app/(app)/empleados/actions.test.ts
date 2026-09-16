import { beforeEach, expect, it, vi } from "vitest";
import { guardarEmpleado, darBajaEmpleado } from "./actions";
const mocks = vi.hoisted(() => ({
  sesion: vi.fn(),
  cliente: vi.fn(),
  rpc: vi.fn(),
  empleado: vi.fn(),
  revalidar: vi.fn(),
  redirigir: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cliente }));
vi.mock("@/lib/empleados-datos", () => ({ obtenerEmpleado: mocks.empleado }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirigir }));
const INICIAL = { valores: {}, errores: {}, mensaje: null };
const VERSION = "2026-09-13T12:00:00.123456Z";
const acciones = [
  (datos: FormData) => guardarEmpleado(null, null, INICIAL, datos),
  (datos: FormData) => guardarEmpleado("empleado", VERSION, INICIAL, datos),
  (datos: FormData) => darBajaEmpleado("empleado", VERSION, INICIAL, datos),
];
beforeEach(() => {
  vi.resetAllMocks();
  mocks.cliente.mockResolvedValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ data: "empleado", error: null });
  mocks.empleado.mockResolvedValue({ hired_at: "2025-01-01", terminated_at: null });
  mocks.redirigir.mockImplementation(() => {
    throw new Error("REDIRECT");
  });
});
it.each(acciones)("exige sesión antes de cualquier lectura o escritura", async accion => {
  mocks.sesion.mockRejectedValue(new Error("LOGIN"));
  await expect(accion(formulario())).rejects.toThrow("LOGIN");
  expect(mocks.cliente).not.toHaveBeenCalled();
  expect(mocks.empleado).not.toHaveBeenCalled();
});
it.each(acciones)("confirma una sola escritura antes de abrir la ficha", async accion => {
  await expect(accion(formulario())).rejects.toThrow("REDIRECT");
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
  expect(mocks.revalidar).toHaveBeenCalledWith("/empleados");
  expect(mocks.redirigir).toHaveBeenCalledWith("/empleados/empleado");
});
it("conserva los microsegundos de la versión", async () => {
  await expect(acciones[1](formulario())).rejects.toThrow("REDIRECT");
  expect(mocks.rpc).toHaveBeenCalledWith(
    "save_employee",
    expect.objectContaining({ p_expected_updated_at: VERSION }),
  );
});
it.each(["40001", "23505", "23514", "42501", "desconocido"])(
  "no reintenta ni expone detalles al fallar (%s)",
  async code => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code, message: "DATO PRIVADO" } });
    const resultado = await acciones[1](formulario());
    expect(resultado.mensaje).toBeTruthy();
    expect(resultado.mensaje).not.toContain("DATO PRIVADO");
    expect(resultado.valores.first_name).toBe("Persona ficticia");
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.revalidar).not.toHaveBeenCalled();
  },
);
it("valida antes de escribir y no repite una baja existente", async () => {
  expect((await acciones[0](new FormData())).errores).toHaveProperty("first_name");
  mocks.empleado.mockResolvedValue({ terminated_at: "2025-02-01" });
  expect((await acciones[2](formulario())).mensaje).toContain("no está disponible");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
function formulario(): FormData {
  const datos = new FormData();
  for (const [campo, valor] of Object.entries({
    first_name: "Persona ficticia",
    last_name: "Prueba",
    dni: "TEST-EMP",
    job_title: "Cuidador",
    hired_at: "2025-01-01",
    terminated_at: "2025-02-01",
    termination_reason: "Fin ficticio",
  }))
    datos.set(campo, valor);
  return datos;
}
