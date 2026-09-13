import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import EmpleadosPage from "./page";
import EmpleadoPage from "./[empleadoId]/page";
import EditarEmpleadoPage from "./[empleadoId]/editar/page";
import BajaEmpleadoPage from "./[empleadoId]/baja/page";
import NuevoEmpleadoPage from "./nuevo/page";
const mocks = vi.hoisted(() => ({ sesion: vi.fn(), listar: vi.fn(), ficha: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/empleados-datos", () => ({ listarEmpleados: mocks.listar, obtenerEmpleado: mocks.ficha }));
vi.mock("./actions", () => ({ guardarEmpleado: vi.fn(), darBajaEmpleado: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
const parametros = { params: Promise.resolve({ empleadoId: "empleado" }) };
const empleado = { id: "empleado", first_name: "Ficticio <script>", last_name: "Prueba", dni: "TEST", job_title: "Cuidador", hired_at: "2025-01-01", terminated_at: null, updated_at: "2026-09-13T12:00:00Z" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.ficha.mockResolvedValue(empleado);
  mocks.listar.mockResolvedValue({ empleados: [empleado], total: 1, pagina: 1 });
});
it.each([
  () => EmpleadosPage({ searchParams: Promise.resolve({}) }),
  () => EmpleadoPage(parametros), () => EditarEmpleadoPage(parametros),
  () => BajaEmpleadoPage(parametros), () => NuevoEmpleadoPage(),
])("la pantalla exige sesión antes de leer", async pagina => {
  mocks.sesion.mockRejectedValue(new Error("LOGIN"));
  await expect(pagina()).rejects.toThrow("LOGIN");
  expect(mocks.listar).not.toHaveBeenCalled(); expect(mocks.ficha).not.toHaveBeenCalled();
});
it("la ficha activa ofrece editar y baja, con datos escapados", async () => {
  const html = renderToStaticMarkup(await EmpleadoPage(parametros));
  expect(html).toContain("Ficticio &lt;script&gt;");
  expect(html).toContain('/empleados/empleado/editar');
  expect(html).toContain('/empleados/empleado/baja');
});
it("la ficha dada de baja conserva motivo sin ofrecer escrituras", async () => {
  mocks.ficha.mockResolvedValue({ ...empleado, terminated_at: "2025-02-01", termination_reason: "Fin ficticio" });
  const html = renderToStaticMarkup(await EmpleadoPage(parametros));
  expect(html).toContain("Fin ficticio");
  expect(html).not.toContain("Editar ficha"); expect(html).not.toContain("Dar de baja");
  const editar = renderToStaticMarkup(await EditarEmpleadoPage(parametros));
  expect(editar).not.toContain("Guardar empleado");
});
it("la baja muestra su efecto y requiere fecha y motivo", async () => {
  const html = renderToStaticMarkup(await BajaEmpleadoPage(parametros));
  expect(html).toContain('name="terminated_at"');
  expect(html).toContain('name="termination_reason"');
  expect(html).toContain("solo de consulta");
});
