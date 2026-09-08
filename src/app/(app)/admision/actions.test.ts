import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  agendarVisita,
  cambiarEstado,
  cancelarVisita,
  guardarNotas,
} from "./actions";

const mocks = vi.hoisted(() => ({
  sesion: vi.fn(),
  cliente: vi.fn(),
  rpc: vi.fn(),
  revalidar: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cliente }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));

const VERSION = "2026-09-06T10:00:00.123456+00:00";
const INICIAL = { ok: false, error: null };
const ACCIONES = [cambiarEstado, agendarVisita, cancelarVisita, guardarNotas];

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-06T15:00:00Z"));
  mocks.sesion.mockResolvedValue(undefined);
  mocks.cliente.mockReturnValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({
    data: "00000000-0000-4000-8000-000000000001",
    error: null,
  });
});

afterEach(() => vi.useRealTimers());

describe("Server Actions de Admisión", () => {
  it.each(ACCIONES)(
    "%s exige sesión antes de acceder a la base",
    async (accion) => {
      mocks.sesion.mockRejectedValue(new Error("sin sesión"));
      await expect(accion(INICIAL, formulario())).rejects.toThrow("sin sesión");
      expect(mocks.cliente).not.toHaveBeenCalled();
    },
  );

  it("rechaza una transición prohibida antes de abrir el cliente", async () => {
    const datos = formulario();
    datos.set("estado", "ingreso");
    expect((await cambiarEstado(INICIAL, datos)).ok).toBe(false);
    expect(mocks.cliente).not.toHaveBeenCalled();
  });

  it("envía la versión vista y solo revalida después de confirmar la escritura", async () => {
    expect(await cambiarEstado(INICIAL, formulario())).toEqual({
      ok: true,
      error: null,
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      "update_consulta",
      expect.objectContaining({
        p_expected_updated_at: VERSION,
        p_expected_state: "nuevo",
        p_action: "change_state",
      }),
    );
    expect(mocks.revalidar).toHaveBeenCalledWith("/admision");
  });

  it.each(ACCIONES)(
    "%s no reintenta ni confirma una escritura desactualizada",
    async (accion) => {
      const datos = formulario();
      if (accion === cancelarVisita)
        datos.set("estado_esperado", "visita_agendada");
      mocks.rpc.mockResolvedValue({ data: null, error: { code: "40001" } });

      expect(await accion(INICIAL, datos)).toMatchObject({
        ok: false,
        error: expect.stringContaining("Recargala"),
      });
      expect(mocks.rpc).toHaveBeenCalledTimes(1);
      expect(mocks.revalidar).not.toHaveBeenCalled();
    },
  );

  it.each([
    { data: null, error: null },
    { data: null, error: { code: "P0002" } },
  ])(
    "no informa éxito cuando no se modificó una consulta",
    async (respuesta) => {
      mocks.rpc.mockResolvedValue(respuesta);
      expect((await guardarNotas(INICIAL, formulario())).ok).toBe(false);
      expect(mocks.revalidar).not.toHaveBeenCalled();
    },
  );
});

function formulario(): FormData {
  const datos = new FormData();
  datos.set("id", "00000000-0000-4000-8000-000000000001");
  datos.set("actualizado_en", VERSION);
  datos.set("estado_esperado", "nuevo");
  datos.set("estado", "contactado");
  datos.set("visita_fecha", "2026-09-07");
  datos.set("visita_franja", "manana");
  return datos;
}
