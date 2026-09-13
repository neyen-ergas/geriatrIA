import { beforeEach, expect, it, vi } from "vitest";
import { requerirSesion } from "./auth";
import { puedeVerSeccion, tienePermiso } from "./permisos";

const mocks = vi.hoisted(() => ({ claims: vi.fn(), rpc: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getClaims: mocks.claims }, rpc: mocks.rpc }) }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.claims.mockResolvedValue({ data: { claims: { sub: "cuenta-ficticia" } } });
  mocks.rpc.mockResolvedValue({ data: "admin", error: null });
  mocks.redirect.mockImplementation((ruta: string) => { throw new Error(ruta); });
});
it("sin identidad verificada corta antes de leer permisos", async () => {
  mocks.claims.mockResolvedValue({ data: null });
  await expect(requerirSesion()).rejects.toThrow("/login");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("una cuenta suspendida pierde acceso sin renovar su JWT", async () => {
  expect(await requerirSesion()).toBe("admin");
  mocks.rpc.mockResolvedValue({ data: null, error: null });
  await expect(requerirSesion()).rejects.toThrow("/sin-acceso");
  expect(mocks.rpc).toHaveBeenCalledTimes(2);
});
it.each(["readonly", "management"])("%s no abre administración", async rol => {
  mocks.rpc.mockResolvedValue({ data: rol, error: null });
  await expect(requerirSesion("administration")).rejects.toThrow("/sin-permiso");
});
it("Solo lectura no abre formularios ni ejecuta acciones de escritura", async () => {
  mocks.rpc.mockResolvedValue({ data: "readonly", error: null });
  expect(await requerirSesion()).toBe("readonly");
  await expect(requerirSesion("operational.write")).rejects.toThrow("/sin-permiso");
});
it("un error de permisos falla cerrado y no expone detalles", async () => {
  mocks.rpc.mockResolvedValue({ data: "admin", error: { message: "DATO PRIVADO" } });
  await expect(requerirSesion()).rejects.toThrow("No se pudo verificar");
  expect(mocks.redirect).not.toHaveBeenCalled();
});
it("la navegación refleja el reparto acordado y no habilita permisos sin rol", () => {
  for (const rol of ["management", "readonly"] as const) {
    for (const ruta of ["/", "/admision", "/residentes", "/contabilidad"]) expect(puedeVerSeccion(rol, ruta)).toBe(true);
    for (const ruta of ["/empleados", "/accesos", "/turnos", "/entrevistas"]) expect(puedeVerSeccion(rol, ruta)).toBe(false);
  }
  expect(tienePermiso(null, "operational.read")).toBe(false);
});
