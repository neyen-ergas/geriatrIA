import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import type { Acceso } from "@/lib/accesos-datos";
import { CuentaEmpleado } from "./cuenta-empleado";
import { FormularioAcceso } from "../accesos/formulario-acceso";

vi.mock("./cuenta-actions", () => ({
  vincularCuenta: vi.fn(),
  desvincularCuenta: vi.fn(),
}));
vi.mock("../accesos/actions", () => ({ guardarAcceso: vi.fn() }));
const cuenta: Acceso = {
  user_id: "cuenta",
  email: "ficticio@example.invalid",
  role: "management",
  enabled: false,
  updated_at: "2026-09-14T12:00:00.123456Z",
  employee_id: null,
  employee_name: null,
  employee_terminated_at: null,
};
it("solo ofrece cuentas con perfil y sin otro vínculo", () => {
  const html = renderToStaticMarkup(
    <CuentaEmpleado
      empleadoId="empleado"
      inactivo={false}
      cuentas={[
        cuenta,
        {
          ...cuenta,
          user_id: "ocupada",
          email: "ocupada@example.invalid",
          employee_id: "otro",
        },
        {
          ...cuenta,
          user_id: "pendiente",
          email: "pendiente@example.invalid",
          role: null,
          updated_at: null,
        },
      ]}
    />,
  );
  expect(html).toContain("ficticio@example.invalid");
  expect(html).toContain("Suspendida");
  expect(html).not.toContain("ocupada@example.invalid");
  expect(html).not.toContain("pendiente@example.invalid");
  expect(html).toContain("no habilita el acceso");
  expect(html).toContain('name="cuenta"');
});
it("con vínculo habilitado indica suspender antes de la baja y permite corregirlo", () => {
  const html = renderToStaticMarkup(
    <CuentaEmpleado
      empleadoId="empleado"
      inactivo={false}
      cuentas={[{ ...cuenta, employee_id: "empleado", enabled: true }]}
    />,
  );
  expect(html).toContain("suspendé esta cuenta");
  expect(html).toContain("Desvincular cuenta");
  expect(html).toContain("No suspende el acceso");
  expect(html).not.toContain('name="cuenta"');
});
it("una baja sin vínculo no ofrece nuevas asignaciones", () => {
  const html = renderToStaticMarkup(
    <CuentaEmpleado empleadoId="empleado" inactivo cuentas={[cuenta]} />,
  );
  expect(html).toContain("No se asignan cuentas nuevas");
  expect(html).not.toContain("Vincular cuenta");
});
it("Accesos enlaza a la ficha e impide elegir habilitado para una baja", () => {
  const html = renderToStaticMarkup(
    <FormularioAcceso
      acceso={{
        ...cuenta,
        employee_id: "empleado",
        employee_name: "Persona <script>",
        employee_terminated_at: "2025-02-01",
      }}
    />,
  );
  expect(html).toContain('href="/empleados/empleado"');
  expect(html).toContain("Persona &lt;script&gt;");
  expect(html).toMatch(/<option value="si" disabled="">Habilitado/);
  expect(html).toContain("debe permanecer suspendida");
});
