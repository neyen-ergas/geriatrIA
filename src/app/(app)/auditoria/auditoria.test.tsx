import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import AuditoriaPage from "./page";
import EventoPage from "./[eventoId]/page";
import { CambiosAuditoria } from "./cambios-auditoria";
import type { EventoAuditoria } from "@/lib/auditoria";
const mocks = vi.hoisted(() => ({
  sesion: vi.fn(),
  listar: vi.fn(),
  detalle: vi.fn(),
  accesos: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/auditoria-datos", () => ({
  listarAuditoria: mocks.listar,
  obtenerEventoAuditoria: mocks.detalle,
}));
vi.mock("@/lib/accesos-datos", () => ({ listarAccesos: mocks.accesos }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
const evento: EventoAuditoria = {
  id: 1,
  table_name: "residents",
  record_id: "84000000-0000-4000-8000-000000000001",
  action: "update",
  actor_id: null,
  actor_label: null,
  record_label: "Ficticio <script>",
  occurred_at: "2026-09-14T02:30:00Z",
  old_values: { notes: null },
  new_values: { notes: "<script>alert(1)</script>" },
  changed_fields: ["notes"],
  origin: "live",
  source_key: null,
};
const parametros = {
  params: Promise.resolve({ eventoId: "1" }),
  searchParams: Promise.resolve({}),
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.detalle.mockResolvedValue(evento);
  mocks.accesos.mockResolvedValue([]);
  mocks.listar.mockResolvedValue({ eventos: [evento], total: 1, pagina: 1 });
});
it.each([
  () => AuditoriaPage({ searchParams: Promise.resolve({}) }),
  () => EventoPage(parametros),
])("exige administración antes de cualquier lectura", async pagina => {
  mocks.sesion.mockRejectedValue(new Error("DENEGADO"));
  await expect(pagina()).rejects.toThrow("DENEGADO");
  expect(mocks.sesion).toHaveBeenCalledWith("administration");
  expect(mocks.listar).not.toHaveBeenCalled();
  expect(mocks.detalle).not.toHaveBeenCalled();
  expect(mocks.accesos).not.toHaveBeenCalled();
});
it("no consulta una búsqueda inválida y muestra el error", async () => {
  const html = renderToStaticMarkup(
    await AuditoriaPage({ searchParams: Promise.resolve({ desde: "2026-02-30" }) }),
  );
  expect(html).toContain('role="alert"');
  expect(mocks.listar).not.toHaveBeenCalled();
});
it("la lista muestra referencia y autor sin publicar valores sensibles en el resumen", async () => {
  const html = renderToStaticMarkup(
    await AuditoriaPage({ searchParams: Promise.resolve({}) }),
  );
  expect(html).toContain("Ficticio &lt;script&gt;");
  expect(html).toContain("Sin usuario identificado");
  expect(html).not.toContain("alert(1)");
  expect(html).toContain("/auditoria/1");
});
it("detalle escapa valores y conserva regreso interno", async () => {
  const html = renderToStaticMarkup(
    await EventoPage({
      ...parametros,
      searchParams: Promise.resolve({ volver: "https://evil.invalid" }),
    }),
  );
  expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  expect(html).toContain("Vacío");
  expect(html).not.toContain("evil.invalid");
  expect(html).not.toContain("<script>");
});
it("el historial parcial distingue vacío conocido de dato desconocido", () => {
  const html = renderToStaticMarkup(
    <CambiosAuditoria
      evento={{
        ...evento,
        old_values: null,
        new_values: { notes: null },
        origin: "historical",
      }}
    />,
  );
  expect(html).toContain("No registrado");
  expect(html).toContain("Vacío");
  expect(
    renderToStaticMarkup(<CambiosAuditoria evento={{ ...evento, changed_fields: [] }} />),
  ).toContain("no es posible reconstruirlos");
});
it("evento inexistente responde no encontrado", async () => {
  mocks.detalle.mockResolvedValue(null);
  await expect(EventoPage(parametros)).rejects.toThrow("NOT_FOUND");
});
