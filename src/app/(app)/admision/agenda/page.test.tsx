import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import AgendaPage from "./page";
import ConsultaPage from "../[consultaId]/page";

const mocks = vi.hoisted(() => ({
  sesion: vi.fn(),
  visitas: vi.fn(),
  consulta: vi.fn(),
  noEncontrado: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/agenda-datos", () => ({ listarVisitasSemana: mocks.visitas }));
vi.mock("@/lib/admision-datos", () => ({ obtenerConsulta: mocks.consulta }));
vi.mock("next/navigation", () => ({ notFound: mocks.noEncontrado }));
vi.mock("../consulta-card", () => ({
  ConsultaCard: () => <div>Detalle de la consulta</div>,
}));
const parametros = { searchParams: Promise.resolve({ semana: "2026-09-12" }) };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.visitas.mockResolvedValue([]);
  mocks.noEncontrado.mockImplementation(() => {
    throw new Error("NOT_FOUND");
  });
});
it.each([
  () => AgendaPage(parametros),
  () =>
    ConsultaPage({ ...parametros, params: Promise.resolve({ consultaId: "consulta" }) }),
])("exige sesión antes de leer datos administrativos", async pagina => {
  mocks.sesion.mockRejectedValue(new Error("LOGIN"));
  await expect(pagina()).rejects.toThrow("LOGIN");
  expect(mocks.visitas).not.toHaveBeenCalled();
  expect(mocks.consulta).not.toHaveBeenCalled();
});
it("consulta la semana completa y conserva la navegación", async () => {
  const html = renderToStaticMarkup(await AgendaPage(parametros));
  expect(mocks.visitas).toHaveBeenCalledWith("2026-09-07");
  expect(html).toContain("0 visitas agendadas");
  expect(html).toContain('href="/admision/agenda?semana=2026-09-14"');
});
it("un fallo de carga llega a la pantalla recuperable, sin dibujar una agenda vacía", async () => {
  mocks.visitas.mockRejectedValue(
    new Error("No se pudo cargar la disponibilidad de la semana."),
  );
  await expect(AgendaPage(parametros)).rejects.toThrow("No se pudo cargar");
});
it("el detalle recupera la consulta y vuelve a la semana elegida", async () => {
  mocks.consulta.mockResolvedValue({ id: "consulta" });
  const html = renderToStaticMarkup(
    await ConsultaPage({
      ...parametros,
      params: Promise.resolve({ consultaId: "consulta" }),
    }),
  );
  expect(html).toContain("Detalle de la consulta");
  expect(html).toContain('href="/admision/agenda?semana=2026-09-07"');
});
it("una consulta inexistente devuelve no encontrado", async () => {
  mocks.consulta.mockResolvedValue(null);
  await expect(
    ConsultaPage({ ...parametros, params: Promise.resolve({ consultaId: "consulta" }) }),
  ).rejects.toThrow("NOT_FOUND");
});
