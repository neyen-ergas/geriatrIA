import { beforeEach, expect, it, vi } from "vitest";
import {
  cancelarEntrevistaAction,
  completarEntrevistaAction,
  guardarEntrevistaAction,
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

const id = "92000000-0000-4000-8000-000000000010";
const version = "2026-09-22T10:00:00.123456+00:00";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.cliente.mockResolvedValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ data: id, error: null });
});

it.each([cancelarEntrevistaAction, completarEntrevistaAction])(
  "rechaza falta de permiso antes de crear el cliente",
  async accion => {
    mocks.sesion.mockRejectedValue(new Error("sin permiso"));
    await expect(accion(id, version)).rejects.toThrow("sin permiso");
    expect(mocks.sesion).toHaveBeenCalledWith("administration");
    expect(mocks.cliente).not.toHaveBeenCalled();
  },
);

it.each([
  ["invalido", version],
  [id, ""],
  [id, "ayer"],
])("rechaza identificador o versión inválidos", async (identificador, fecha) => {
  expect((await completarEntrevistaAction(identificador, fecha)).ok).toBe(false);
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it.each([
  [completarEntrevistaAction, "completed"],
  [cancelarEntrevistaAction, "cancelled"],
] as const)(
  "cambia estado mediante RPC y refresca ambas rutas",
  async (accion, estado) => {
    expect((await accion(id, version)).ok).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("transition_interview", {
      p_id: id,
      p_expected_updated_at: version,
      p_status: estado,
    });
    expect(mocks.revalidar.mock.calls).toEqual([
      ["/entrevistas"],
      [`/entrevistas/${id}`],
    ]);
  },
);

it.each([
  ["40001", "La entrevista cambió"],
  ["P0002", "ya no está disponible"],
  ["42501", "ya no tiene permiso"],
  ["23514", "no es válida"],
  ["XX000", "No se pudo cambiar"],
])("traduce el error %s sin anunciar éxito", async (code, mensaje) => {
  mocks.rpc.mockResolvedValue({ error: { code } });
  expect(await cancelarEntrevistaAction(id, version)).toEqual({
    ok: false,
    error: expect.stringContaining(mensaje),
  });
  expect(mocks.revalidar).not.toHaveBeenCalled();
});

it("un error de conexión pide comprobar el resultado, sin reenviar", async () => {
  mocks.rpc.mockRejectedValue(new Error("timeout"));
  expect((await completarEntrevistaAction(id, version)).error).toContain(
    "comprobar su estado",
  );
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
});

function formulario(): FormData {
  const datos = new FormData();
  datos.set("id", id);
  datos.set("candidate_name", "Persona ficticia");
  datos.set("interview_date", "2026-09-22");
  datos.set("status", "scheduled");
  datos.set("conclusion", "pendiente");
  return datos;
}

it("la edición sin versión no llega a la base", async () => {
  const resultado = await guardarEntrevistaAction({ ok: false }, formulario());
  expect(resultado.error).toContain("Recargá");
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it("la edición envía la versión exacta y muestra conflictos", async () => {
  const datos = formulario();
  datos.set("expected_updated_at", version);
  mocks.rpc.mockResolvedValue({ error: { code: "40001" } });
  const resultado = await guardarEntrevistaAction({ ok: false }, datos);
  expect(mocks.rpc).toHaveBeenCalledWith(
    "save_interview",
    expect.objectContaining({ p_id: id, p_expected_updated_at: version }),
  );
  expect(resultado.error).toContain("La entrevista cambió");
  expect(mocks.revalidar).not.toHaveBeenCalled();
});
