import { beforeEach, describe, expect, it, vi } from "vitest";
import { buscarPersonaIngreso, convertirPersonaNueva, convertirReingreso } from "./[consultaId]/ingreso/actions";

const mocks = vi.hoisted(() => ({
  sesion: vi.fn(), cliente: vi.fn(), rpc: vi.fn(), vinculos: vi.fn(),
  residente: vi.fn(), unico: vi.fn(), eq: vi.fn(), revalidar: vi.fn(), redirigir: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cliente }));
vi.mock("@/lib/conversion-consulta-datos", () => ({ listarVinculosConsultas: mocks.vinculos }));
vi.mock("@/lib/residentes-datos", () => ({ obtenerResidenteParaReingreso: mocks.residente }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirigir }));
const INICIAL = { errores: {}, mensaje: null, valores: {} };
const VERSION = "2026-01-01T00:00:00Z";
const ACCIONES = [
  (datos: FormData) => convertirPersonaNueva("consulta", VERSION, INICIAL, datos),
  (datos: FormData) => convertirReingreso("consulta", VERSION, "persona", INICIAL, datos),
];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.vinculos.mockResolvedValue({});
  mocks.residente.mockResolvedValue({ lastAdmission: { dischargedAt: "2025-01-01" } });
  mocks.rpc.mockResolvedValue({ data: "estadia", error: null });
  mocks.redirigir.mockImplementation(() => { throw new Error("REDIRECT"); });
  mocks.eq.mockReturnValue({ maybeSingle: mocks.unico });
  mocks.cliente.mockResolvedValue({ rpc: mocks.rpc, from: () => ({ select: () => ({ eq: mocks.eq }) }) });
});

describe.each(ACCIONES)("conversión desde una consulta", (accion) => {
  it("exige sesión antes de leer o escribir", async () => {
    mocks.sesion.mockRejectedValue(new Error("sesión"));
    await expect(accion(formulario())).rejects.toThrow("sesión");
    expect(mocks.vinculos).not.toHaveBeenCalled();
    expect(mocks.cliente).not.toHaveBeenCalled();
  });
  it("usa una sola transacción con la versión de la consulta y abre su cuenta", async () => {
    await expect(accion(formulario())).rejects.toThrow("REDIRECT");
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("convert_consultation_admission",
      expect.objectContaining({ p_consultation_id: "consulta", p_expected_updated_at: VERSION,
        p_admitted_at: "2025-02-01", p_monthly_fee: 100, p_due_day: 10 }));
    expect(mocks.redirigir).toHaveBeenCalledWith("/contabilidad/estadia");
    expect(mocks.revalidar).toHaveBeenCalledWith("/admision/agenda");
    expect(mocks.revalidar).toHaveBeenCalledWith("/admision/[consultaId]", "page");
    expect(mocks.revalidar).toHaveBeenCalledWith("/residentes");
    expect(mocks.revalidar).toHaveBeenCalledWith("/contabilidad");
  });
  it("recupera el ingreso ya creado incluso si el formulario reenviado está vacío", async () => {
    mocks.vinculos.mockResolvedValue({ consulta: "anterior" });
    await expect(accion(new FormData())).rejects.toThrow("REDIRECT");
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.residente).not.toHaveBeenCalled();
    expect(mocks.redirigir).toHaveBeenCalledWith("/contabilidad/anterior");
  });
  it.each(["40001", "23505", "23514", "23P01", "22023", "42501", "desconocido"])(
    "conserva valores sin reintentar ni exponer errores internos (%s)", async (code) => {
      mocks.rpc.mockResolvedValue({ data: null, error: { code, message: "DATO PRIVADO" } });
      const resultado = await accion(formulario());
      expect(resultado.mensaje).toBeTruthy();
      expect(resultado.mensaje).not.toContain("DATO PRIVADO");
      expect(resultado.valores.monthly_fee).toBe("100");
      expect(mocks.rpc).toHaveBeenCalledTimes(1);
      expect(mocks.redirigir).not.toHaveBeenCalled();
      expect(mocks.revalidar).not.toHaveBeenCalled();
    },
  );
  it("rechaza fechas futuras antes de escribir", async () => {
    const datos = formulario(); datos.set("admitted_at", "2999-01-01");
    expect((await accion(datos)).errores.admitted_at).toBeTruthy();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

it("el reingreso conserva la ficha y no envía datos de contacto nuevos", async () => {
  await expect(ACCIONES[1](formulario())).rejects.toThrow("REDIRECT");
  expect(mocks.rpc.mock.calls[0][1].p_resident_id).toBe("persona");
  expect(mocks.rpc.mock.calls[0][1]).not.toHaveProperty("p_contact_first_name");
});
it("rechaza el reingreso cuando la ficha ya no está disponible", async () => {
  mocks.residente.mockResolvedValue(null);
  expect((await ACCIONES[1](formulario())).mensaje).toContain("ingreso activo");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("busca DNI normalizado sin incluirlo en la URL", async () => {
  mocks.unico.mockResolvedValue({ data: { id: "persona" }, error: null });
  const datos = new FormData(); datos.set("dni", "12.345.678");
  await expect(buscarPersonaIngreso("consulta", { error: null }, datos)).rejects.toThrow("REDIRECT");
  expect(mocks.eq).toHaveBeenCalledWith("dni", "12345678");
  expect(mocks.redirigir).toHaveBeenCalledWith("/admision/consulta/ingreso?residente=persona");
});

function formulario(): FormData {
  const datos = new FormData();
  for (const [campo, valor] of Object.entries({
    resident_first_name: "Persona ficticia", resident_last_name: "Prueba",
    resident_dni: "TEST-CONVERSION", resident_birth_date: "1940-01-01",
    contact_first_name: "Contacto ficticio", contact_last_name: "Prueba",
    contact_relationship: "Familiar", contact_phone: "000000",
    admitted_at: "2025-02-01", monthly_fee: "100", due_day: "10",
  })) datos.set(campo, valor);
  return datos;
}
