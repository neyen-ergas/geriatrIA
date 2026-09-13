import { renderConPermisos as renderToStaticMarkup } from "@/test/render-con-permisos";
import { beforeEach, expect, it, vi } from "vitest";
import InicioPage from "./page";
const mocks = vi.hoisted(() => ({ sesion: vi.fn(), datos: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/inicio-datos", () => ({ obtenerInicio: mocks.datos }));
beforeEach(() => vi.resetAllMocks());
it("exige sesión antes de leer pendientes", async () => {
  mocks.sesion.mockRejectedValue(new Error("LOGIN"));
  await expect(InicioPage()).rejects.toThrow("LOGIN");
  expect(mocks.datos).not.toHaveBeenCalled();
});
it("distingue grupos vacíos de fallidos y permite abrir cada pendiente", async () => {
  mocks.datos.mockResolvedValue([
    { titulo: "Consultas", descripcion: "Sin llamar", href: "/admision", resumen: { total: 1255, elementos: [
      { id: "consulta", titulo: "Familia <script>", detalle: "000000", href: "/admision/consulta" },
    ] } },
    { titulo: "Visitas", descripcion: "Hoy", href: "/admision/agenda", resumen: { total: 0, elementos: [] } },
    { titulo: "Cuotas", descripcion: "Vencidas", href: "/contabilidad", resumen: null },
  ]);
  const html = renderToStaticMarkup(await InicioPage());
  expect(html).toContain("Familia &lt;script&gt;");
  expect(html).toContain('href="/admision/consulta"');
  expect(html).toContain("Mostrando 1 de 1255");
  expect(html).toContain("No hay registros en este grupo");
  expect(html).toContain("No pudimos cargar este grupo");
});
