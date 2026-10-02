import { beforeEach, expect, it, vi } from "vitest";
import { crearConsultaManual } from "./actions";

const mocks = vi.hoisted(() => ({
  sesion: vi.fn(),
  cliente: vi.fn(),
  rpc: vi.fn(),
  revalidar: vi.fn(),
  redirigir: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cliente }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirigir }));

const id = "11111111-1111-4111-8111-111111111111";
const inicial = { error: null, duplicadoId: null, telefonoDuplicado: null };
function formulario() {
  const datos = new FormData();
  datos.set("nombre", "Ana Pérez");
  datos.set("telefono", "11 5555 1234");
  datos.set("motivo", "Consulta por vacante");
  datos.set("origen", "telefono");
  datos.set("momento", "indistinto");
  datos.set("proximo_paso", "visita");
  return datos;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.cliente.mockResolvedValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ data: { created_id: id }, error: null });
  mocks.redirigir.mockImplementation(() => {
    throw new Error("REDIRECT");
  });
});

it("comprueba acceso antes de leer o guardar", async () => {
  mocks.sesion.mockRejectedValue(new Error("LOGIN"));
  await expect(crearConsultaManual(inicial, formulario())).rejects.toThrow("LOGIN");
  expect(mocks.cliente).not.toHaveBeenCalled();
});

it("rechaza datos inválidos antes de llamar a la base", async () => {
  const datos = formulario();
  datos.set("telefono", "123");
  expect((await crearConsultaManual(inicial, datos)).error).toContain("teléfono");
  expect(mocks.cliente).not.toHaveBeenCalled();
});

it("muestra la consulta existente sin crear otra", async () => {
  mocks.rpc.mockResolvedValue({ data: { duplicate_id: id }, error: null });
  expect(await crearConsultaManual(inicial, formulario())).toEqual({
    error: null,
    duplicadoId: id,
    telefonoDuplicado: "1155551234",
  });
  expect(mocks.revalidar).not.toHaveBeenCalled();
  expect(mocks.redirigir).not.toHaveBeenCalled();
});

it("permite crear otra consulta sólo después de la elección explícita", async () => {
  const datos = formulario();
  datos.set("permitir_duplicado", "si");
  await expect(crearConsultaManual(inicial, datos)).rejects.toThrow("REDIRECT");
  expect(mocks.rpc).toHaveBeenCalledWith(
    "create_manual_consultation",
    expect.objectContaining({ p_allow_duplicate: true, p_source: "telefono" }),
  );
  expect(mocks.revalidar).toHaveBeenCalledWith("/admision");
  expect(mocks.redirigir).toHaveBeenCalledWith(`/admision/${id}?creada=1&paso=visita`);
});

it("ante una respuesta perdida no afirma que el guardado falló ni expone datos internos", async () => {
  mocks.rpc.mockRejectedValue(new Error("token privado"));
  const resultado = await crearConsultaManual(inicial, formulario());
  expect(resultado.error).toContain("Buscá el teléfono");
  expect(resultado.error).not.toContain("token privado");
});
