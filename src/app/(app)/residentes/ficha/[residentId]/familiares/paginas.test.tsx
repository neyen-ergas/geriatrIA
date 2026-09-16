import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import NuevoPage from "./nuevo/page";
import EditarPage from "./[contactId]/editar/page";
const mocks = vi.hoisted(() => ({ sesion: vi.fn(), datos: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/familiares-datos", () => ({ obtenerFormularioFamiliar: mocks.datos }));
vi.mock("./actions", () => ({ guardarFamiliar: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
const params = Promise.resolve({
  residentId: "87000000-0000-4000-8000-000000000010",
  contactId: "87000000-0000-4000-8000-000000000020",
});
beforeEach(() => {
  vi.resetAllMocks();
  mocks.datos.mockResolvedValue({
    residente: { first_name: "Persona <script>", last_name: "Ficticia" },
    contacto: {
      first_name: "Familiar",
      last_name: "Ficticio",
      relationship: "Hija",
      phone: "0000000",
      notes: null,
      is_emergency_contact: true,
      is_payment_responsible: false,
      updated_at: "2026-09-14T12:00:00Z",
    },
  });
});
it.each([NuevoPage, EditarPage])("exige permiso antes de leer", async pagina => {
  mocks.sesion.mockRejectedValue(new Error("SIN_PERMISO"));
  await expect(pagina({ params })).rejects.toThrow("SIN_PERMISO");
  expect(mocks.sesion).toHaveBeenCalledWith("operational.write");
  expect(mocks.datos).not.toHaveBeenCalled();
});
it("edición muestra datos escapados, campos y responsabilidades", async () => {
  const html = renderToStaticMarkup(await EditarPage({ params }));
  expect(html).toContain("Persona &lt;script&gt;");
  expect(html).toContain('value="Familiar"');
  expect(html).toContain('name="is_emergency_contact"');
  expect(html).toContain('name="is_payment_responsible"');
  expect(html).toContain("Guardar contacto");
});
it.each([NuevoPage, EditarPage])(
  "persona/contacto inexistente no abre el formulario",
  async pagina => {
    mocks.datos.mockResolvedValue(null);
    await expect(pagina({ params })).rejects.toThrow("NOT_FOUND");
  },
);
