import { beforeEach, expect, it, vi } from "vitest";
import { obtenerConsulta } from "./admision-datos";

const mocks = vi.hoisted(() => ({ eq: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/conversion-consulta-datos", () => ({
  listarVinculosConsultas: vi.fn(async () => ({})),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({ select: () => ({ eq: mocks.eq }) }),
  }),
}));

beforeEach(() => {
  mocks.eq.mockReset();
  mocks.eq.mockImplementation((_columna: string, id: string) => ({
    maybeSingle: async () => ({ data: { id, nombre: "Familia" }, error: null }),
  }));
});

it("abre una consulta con un UUID completo de cinco grupos", async () => {
  const id = "6425c2e5-db49-4cec-b327-6b7b29d251ed";
  expect(await obtenerConsulta(id)).toMatchObject({ id, ingreso_id: null });
  expect(mocks.eq).toHaveBeenCalledWith("id", id);
});

it("descarta identificadores que no son UUID sin consultar la base", async () => {
  expect(await obtenerConsulta("6425c2e5-db49-4cec-b327")).toBeNull();
  expect(await obtenerConsulta("../consulta")).toBeNull();
  expect(mocks.eq).not.toHaveBeenCalled();
});
