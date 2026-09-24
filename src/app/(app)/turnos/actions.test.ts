import { beforeEach, expect, it, vi } from "vitest";
import { asignarTurnoAction, cubrirTurnoAction, cancelarTurnoAction } from "./actions";

const mocks = vi.hoisted(() => ({
  sesion: vi.fn(),
  cliente: vi.fn(),
  rpc: vi.fn(),
  revalidar: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cliente }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
const version = "2026-09-23T10:00:00.123456+00:00";
const inicial = { ok: false };
const datos = (valores: Record<string, string>) => {
  const formulario = new FormData();
  for (const [campo, valor] of Object.entries(valores)) formulario.set(campo, valor);
  return formulario;
};
const asignacion = {
  employee_id: "empleado",
  shift_date: "2026-09-23",
  shift_type: "guardia",
  guard_start: "19:00",
};
const cobertura = {
  shift_id: "turno",
  covered_by_employee_id: "reemplazo",
  absence_reason: "Motivo ficticio",
  expected_updated_at: version,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.cliente.mockResolvedValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ error: null });
});

it.each([asignarTurnoAction, cubrirTurnoAction, cancelarTurnoAction])(
  "exige administración antes de consultar",
  async accion => {
    mocks.sesion.mockRejectedValue(new Error("sin permiso"));
    await expect(accion(inicial, new FormData())).rejects.toThrow("sin permiso");
    expect(mocks.sesion).toHaveBeenCalledWith("administration");
    expect(mocks.cliente).not.toHaveBeenCalled();
  },
);
it.each(["", "24:00", "19:99", "ayer"])(
  "rechaza inicio de guardia inválido: %s",
  async hora => {
    expect(
      (await asignarTurnoAction(inicial, datos({ ...asignacion, guard_start: hora }))).ok,
    ).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  },
);
it("envía el inicio explícito de una guardia", async () => {
  expect((await asignarTurnoAction(inicial, datos(asignacion))).ok).toBe(true);
  expect(mocks.rpc).toHaveBeenCalledWith(
    "save_shift",
    expect.objectContaining({ p_guard_start: "19:00" }),
  );
  expect(mocks.revalidar).toHaveBeenCalledWith("/turnos");
});
it("descarta hora de guardia al cambiar de franja", async () => {
  await asignarTurnoAction(inicial, datos({ ...asignacion, shift_type: "manana" }));
  expect(mocks.rpc).toHaveBeenCalledWith(
    "save_shift",
    expect.objectContaining({ p_guard_start: undefined }),
  );
});
it("editar exige la versión de la pantalla", async () => {
  expect(
    (await asignarTurnoAction(inicial, datos({ ...asignacion, id: "turno" }))).ok,
  ).toBe(false);
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it.each([cubrirTurnoAction, cancelarTurnoAction])(
  "rechaza una operación sin versión",
  async accion => {
    const sinVersion = datos(cobertura);
    sinVersion.delete("expected_updated_at");
    expect((await accion(inicial, sinVersion)).error).toContain("Recargá");
    expect(mocks.rpc).not.toHaveBeenCalled();
  },
);
it("conserva los microsegundos al cubrir", async () => {
  expect((await cubrirTurnoAction(inicial, datos(cobertura))).ok).toBe(true);
  expect(mocks.rpc).toHaveBeenCalledWith(
    "cover_shift",
    expect.objectContaining({ p_expected_updated_at: version }),
  );
});
it.each([
  ["23P01", "detalle privado", "superpone"],
  ["40001", "shift_changed", "El turno cambió"],
  ["42501", "permission_denied", "permiso"],
  ["P0002", "shift_not_found", "no está disponible"],
  ["23514", "franco_cannot_be_covered", "Un franco"],
  ["XX000", "detalle privado", "No se pudo guardar"],
])("traduce %s sin exponer el error interno", async (code, message, esperado) => {
  mocks.rpc.mockResolvedValue({ error: { code, message } });
  const resultado = await cubrirTurnoAction(inicial, datos(cobertura));
  expect(resultado.ok).toBe(false);
  expect(resultado.error).toContain(esperado);
  expect(resultado.error).not.toContain("detalle privado");
  expect(mocks.revalidar).not.toHaveBeenCalled();
});
it("cancelación envía versión y actualiza la grilla", async () => {
  expect((await cancelarTurnoAction(inicial, datos(cobertura))).ok).toBe(true);
  expect(mocks.rpc).toHaveBeenCalledWith("cancel_shift", {
    p_shift_id: "turno",
    p_expected_updated_at: version,
  });
  expect(mocks.revalidar).toHaveBeenCalledWith("/turnos");
});
it("no reenvía un cambio cuyo resultado es incierto", async () => {
  mocks.rpc.mockRejectedValue(new Error("timeout"));
  expect((await cubrirTurnoAction(inicial, datos(cobertura))).error).toContain(
    "comprobar el resultado",
  );
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
});
