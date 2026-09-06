import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registrarPrimerIngreso } from "./nuevo/actions";
import { actualizarPrimerIngreso } from "./[admissionId]/editar/actions";
import { darDeBajaResidente } from "./[admissionId]/baja/actions";
import { reingresarResidente } from "./reingreso/[residentId]/actions";

const mocks = vi.hoisted(() => ({
  sesion: vi.fn(),
  cliente: vi.fn(),
  rpc: vi.fn(),
  tabla: vi.fn(),
  insertar: vi.fn(),
  unico: vi.fn(),
  revalidar: vi.fn(),
  redirigir: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cliente }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirigir }));

const INICIAL = { errores: {}, mensaje: null, valores: {} };
const IDS = { admissionId: "ingreso", residentId: "persona", contactId: "contacto" };
const ACCIONES = [
  { nombre: "alta", ejecutar: (datos: FormData) =>
    registrarPrimerIngreso(INICIAL, datos) },
  { nombre: "edición", ejecutar: (datos: FormData) =>
    actualizarPrimerIngreso(IDS, INICIAL, datos) },
  { nombre: "baja", ejecutar: (datos: FormData) =>
    darDeBajaResidente({ admissionId: "ingreso", admittedAt: "2026-01-01" },
      INICIAL, datos) },
  { nombre: "reingreso", ejecutar: (datos: FormData) =>
    reingresarResidente("persona", INICIAL, datos) },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-05T15:00:00Z"));
  mocks.sesion.mockResolvedValue(undefined);
  const consulta = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: mocks.unico,
    insert: mocks.insertar,
  };
  mocks.tabla.mockReturnValue(consulta);
  mocks.cliente.mockResolvedValue({ rpc: mocks.rpc, from: mocks.tabla });
});
afterEach(() => vi.useRealTimers());

describe.each(ACCIONES)("fechas en la acción de $nombre", (accion) => {
  it("exige sesión antes de acceder a la base", async () => {
    mocks.sesion.mockRejectedValue(new Error("sin sesión"));
    await expect(accion.ejecutar(formulario())).rejects.toThrow("sin sesión");
    expect(mocks.cliente).not.toHaveBeenCalled();
  });

  it.each([
    ["23P01", "admissions_stays_overlap", "superponen"],
    ["23514", "admissions_birth_date_valid", "nacimiento"],
    ["40001", "", "Recargá"],
  ])("traduce %s y no confirma ni reintenta", async (code, message, texto) => {
    const respuesta = { data: null, error: { code, message } };
    mocks.rpc.mockResolvedValue(respuesta);
    mocks.insertar.mockResolvedValue(respuesta);
    if (accion.nombre === "reingreso") {
      mocks.unico.mockResolvedValueOnce({ data: null, error: null });
      mocks.unico.mockResolvedValueOnce({
        data: { discharged_at: "2026-01-01" }, error: null,
      });
    } else {
      mocks.unico.mockResolvedValue(respuesta);
    }
    const resultado = await accion.ejecutar(formulario());
    expect(resultado.mensaje).toContain(texto);
    expect(resultado.valores).not.toEqual({});
    expect(mocks.revalidar).not.toHaveBeenCalled();
    expect(mocks.redirigir).not.toHaveBeenCalled();
    if (accion.nombre === "alta" || accion.nombre === "edición") {
      expect(mocks.rpc).toHaveBeenCalledTimes(1);
    } else if (accion.nombre === "reingreso") {
      expect(mocks.insertar).toHaveBeenCalledTimes(1);
    } else {
      expect(mocks.unico).toHaveBeenCalledTimes(1);
    }
  });
});

it.each(ACCIONES.slice(0, 2))(
  "$nombre rechaza el ingreso futuro antes de escribir", async (accion) => {
    const datos = formulario();
    datos.set("admitted_at", "2026-03-06");
    expect((await accion.ejecutar(datos)).errores).toMatchObject({
      admitted_at: "El ingreso no puede estar en el futuro.",
    });
    expect(mocks.cliente).not.toHaveBeenCalled();
  },
);

function formulario(): FormData {
  const datos = new FormData();
  for (const [campo, valor] of Object.entries({
    resident_first_name: "Persona ficticia", resident_last_name: "Prueba",
    resident_dni: "TEST-ACCIONES", resident_birth_date: "1940-01-01",
    contact_first_name: "Contacto ficticio", contact_last_name: "Prueba",
    contact_relationship: "Familiar", contact_phone: "000000",
    admitted_at: "2026-02-01", monthly_fee: "100", due_day: "10",
    discharged_at: "2026-03-01", discharge_reason: "Baja ficticia",
  })) {
    datos.set(campo, valor);
  }
  return datos;
}
