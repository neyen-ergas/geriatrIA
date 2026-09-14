import { beforeEach, expect, it, vi } from "vitest";
import { leerFamiliar, validarFamiliar, type EstadoFamiliar } from "@/lib/familiares";
import { guardarFamiliar } from "./actions";
const mocks = vi.hoisted(() => ({ sesion: vi.fn(), cliente: vi.fn(), rpc: vi.fn(), revalidar: vi.fn(), redirigir: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cliente }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirigir }));
const residente = "87000000-0000-4000-8000-000000000010";
const contacto = "87000000-0000-4000-8000-000000000020";
const version = "2026-09-14T12:00:00.123456Z";
const inicial: EstadoFamiliar = { valores: leerFamiliar(new FormData()), errores: {}, mensaje: null };
beforeEach(() => {
  vi.resetAllMocks(); mocks.cliente.mockResolvedValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ data: contacto, error: null });
  mocks.redirigir.mockImplementation(() => { throw new Error("REDIRECT"); });
});
it("exige gestión antes de validar o escribir", async () => {
  mocks.sesion.mockRejectedValue(new Error("SIN_PERMISO"));
  await expect(guardarFamiliar(residente, contacto, version, inicial, formulario())).rejects.toThrow("SIN_PERMISO");
  expect(mocks.sesion).toHaveBeenCalledWith("operational.write");
  expect(mocks.cliente).not.toHaveBeenCalled();
});
it.each([null, version])("alta/edición conserva id y versión precisa (%s)", async fecha => {
  await expect(guardarFamiliar(residente, contacto, fecha, inicial, formulario())).rejects.toThrow("REDIRECT");
  expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("save_family_contact", expect.objectContaining({
    p_id: contacto, p_resident_id: residente, p_expected_updated_at: fecha ?? undefined,
    p_first_name: "Familiar", p_is_emergency_contact: true, p_is_payment_responsible: false,
  }));
  expect(mocks.revalidar).toHaveBeenCalledWith(`/residentes/ficha/${residente}`);
  expect(mocks.revalidar).toHaveBeenCalledWith("/residentes/[admissionId]/editar", "page");
});
it.each(["40001", "42501", "P0002", "otro"])("conserva entradas y no reintenta ni revela errores: %s", async code => {
  mocks.rpc.mockResolvedValue({ data: null, error: { code, message: "DATO PRIVADO" } });
  const resultado = await guardarFamiliar(residente, contacto, version, inicial, formulario());
  expect(resultado.valores.first_name).toBe("Familiar");
  expect(resultado.mensaje).toBeTruthy(); expect(resultado.mensaje).not.toContain("DATO PRIVADO");
  expect(mocks.rpc).toHaveBeenCalledTimes(1); expect(mocks.revalidar).not.toHaveBeenCalled();
});
it("campos obligatorios e identificadores inválidos no llegan a la base", async () => {
  expect(Object.keys(validarFamiliar(leerFamiliar(new FormData())))).toHaveLength(4);
  expect((await guardarFamiliar(residente, contacto, version, inicial, new FormData())).errores.phone).toBeTruthy();
  expect((await guardarFamiliar("invalido", contacto, version, inicial, formulario())).mensaje).toBeTruthy();
  expect(mocks.rpc).not.toHaveBeenCalled();
});
function formulario(): FormData {
  const datos = new FormData();
  for (const [campo, valor] of Object.entries({ first_name: " Familiar ", last_name: "Ficticio", relationship: "Hija", phone: "0000000", is_emergency_contact: "on" })) datos.set(campo, valor);
  return datos;
}
