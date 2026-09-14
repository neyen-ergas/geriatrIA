import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import Listado from "./page";
import Nuevo from "./nuevo/page";
import Editar from "./[registroId]/editar/page";
import Archivar from "./[registroId]/archivar/page";
const mocks = vi.hoisted(() => ({ sesion: vi.fn(), persona: vi.fn(), lista: vi.fn(), registro: vi.fn(), ingreso: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/familiares-datos", () => ({ obtenerFormularioFamiliar: mocks.persona }));
vi.mock("@/lib/registros-residente-datos", () => ({ listarRegistrosResidente: mocks.lista, obtenerRegistroResidente: mocks.registro, obtenerEstadiaDeRegistro: mocks.ingreso }));
vi.mock("./actions", () => ({ guardarRegistro: vi.fn(), archivarRegistro: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
const params = Promise.resolve({ residentId: "persona", seccion: "indicaciones", registroId: "registro" });
const registro = { id: "registro", title: "Texto <script>", instructions: "Indicación ficticia", professional: "Profesional ficticio", starts_on: "2025-01-01", ends_on: "2025-02-01", archived_at: null, updated_at: "2026-09-14T12:00:00Z" };
beforeEach(() => {
  vi.resetAllMocks(); mocks.sesion.mockResolvedValue("admin");
  mocks.persona.mockResolvedValue({ residente: { first_name: "Persona", last_name: "Ficticia" } });
  mocks.lista.mockResolvedValue({ registros: [registro], total: 1, pagina: 1 }); mocks.registro.mockResolvedValue(registro);
});
it.each([
  () => Listado({ params, searchParams: Promise.resolve({}) }),
  () => Nuevo({ params, searchParams: Promise.resolve({}) }),
  () => Editar({ params }), () => Archivar({ params }),
])("autoriza antes de leer", async pagina => {
  mocks.sesion.mockRejectedValue(new Error("SIN_PERMISO"));
  await expect(pagina()).rejects.toThrow("SIN_PERMISO"); expect(mocks.persona).not.toHaveBeenCalled(); expect(mocks.registro).not.toHaveBeenCalled();
});
it("Solo lectura consulta vigencia y texto escapado sin escrituras", async () => {
  mocks.sesion.mockResolvedValue("readonly");
  const html = renderToStaticMarkup(await Listado({ params, searchParams: Promise.resolve({}) }));
  expect(html).toContain("Vigencia finalizada"); expect(html).toContain("Texto &lt;script&gt;");
  expect(html).not.toMatch(/\/editar|\/archivar|\/nuevo/);
});
it("registros archivados no muestran formulario de edición", async () => {
  mocks.registro.mockResolvedValue({ ...registro, archived_at: "2026-09-14" });
  const html = renderToStaticMarkup(await Editar({ params }));
  expect(html).toContain("solo de consulta"); expect(html).not.toContain("Guardar registro");
});
it("alta de pertenencia exige una estadía de la persona", async () => {
  mocks.ingreso.mockResolvedValue(null);
  await expect(Nuevo({ params: Promise.resolve({ residentId: "persona", seccion: "pertenencias" }), searchParams: Promise.resolve({ ingreso: "ajeno" }) })).rejects.toThrow("NOT_FOUND");
});
it("formulario de medicación incluye pauta completa y profesional", async () => {
  const html = renderToStaticMarkup(await Nuevo({ params: Promise.resolve({ residentId: "persona", seccion: "medicacion" }), searchParams: Promise.resolve({}) }));
  for (const campo of ["name", "dose", "frequency", "schedule", "professional", "starts_on", "ends_on"]) expect(html).toContain(`name="${campo}"`);
});
