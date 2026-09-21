import { beforeEach, expect, it, vi } from "vitest";
import { actualizarContrasena } from "./actions";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), updateUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: mocks }),
}));
vi.mock("next/navigation", () => ({
  redirect: (ruta: string) => {
    throw new Error(ruta);
  },
}));

function formulario(contrasena = "clave-sintetica-123", confirmacion = contrasena) {
  const datos = new FormData();
  datos.set("contrasena", contrasena);
  datos.set("confirmacion", confirmacion);
  return datos;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "cuenta" } }, error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
});

it("sin identidad verificada no cambia contraseñas", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  await expect(actualizarContrasena({}, formulario())).rejects.toThrow(
    "/recuperar?error=sesion",
  );
  expect(mocks.updateUser).not.toHaveBeenCalled();
});

it("un error verificando la sesión impide la actualización", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "cuenta" } }, error: {} });
  await expect(actualizarContrasena({}, formulario())).rejects.toThrow(
    "/recuperar?error=sesion",
  );
  expect(mocks.updateUser).not.toHaveBeenCalled();
});

it.each([
  ["corta", "corta", "12 caracteres"],
  ["x".repeat(129), "x".repeat(129), "128 caracteres"],
  ["clave-sintetica-123", "otra-clave-123", "no coinciden"],
])("rechaza contraseña inválida: %s", async (clave, confirmacion, mensaje) => {
  const resultado = await actualizarContrasena({}, formulario(clave, confirmacion));
  expect(resultado.error).toContain(mensaje);
  expect(mocks.updateUser).not.toHaveBeenCalled();
});

it("actualiza solo la propia cuenta y no devuelve la contraseña", async () => {
  const datos = formulario();
  datos.set("user_id", "otra-cuenta");
  expect(await actualizarContrasena({}, datos)).toEqual({ actualizada: true });
  expect(mocks.updateUser).toHaveBeenCalledWith({ password: "clave-sintetica-123" });
});

it("no reintenta un cambio con respuesta incierta", async () => {
  mocks.updateUser.mockRejectedValue(new Error("detalle privado"));
  const resultado = await actualizarContrasena({}, formulario());
  expect(resultado.error).toContain("No se pudo confirmar");
  expect(mocks.updateUser).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(resultado)).not.toContain("detalle privado");
});

it.each([
  [{ code: "same_password" }, "diferente"],
  [{ code: "weak_password" }, "más segura"],
  [{ status: 429 }, "Esperá"],
  [{ message: "detalle privado" }, "No se pudo"],
])("traduce los errores sin revelar detalles: %j", async (error, mensaje) => {
  mocks.updateUser.mockResolvedValue({ error });
  const resultado = await actualizarContrasena({}, formulario());
  expect(resultado.error).toContain(mensaje);
  expect(resultado.actualizada).toBeUndefined();
  expect(JSON.stringify(resultado)).not.toContain("detalle privado");
});
