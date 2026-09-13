import { expect, it } from "vitest";
import { enlaceEmpleados, leerEmpleado, validarEmpleado, validarBajaEmpleado } from "./empleados";

const base = () => leerEmpleado(formulario());
it("normaliza DNI y admite contactos y nacimiento vacíos", () => {
  const resultado = validarEmpleado(base(), "2026-09-13");
  expect(resultado).toMatchObject({ ok: true, datos: { p_dni: "12345678", p_birth_date: undefined, p_email: undefined } });
});
it.each([
  ["first_name", ""], ["job_title", ""], ["dni", " . "], ["hired_at", "2999-01-01"],
  ["birth_date", "2026-02-01"], ["email", "incorrecto"], ["notes", "x".repeat(2001)],
])("rechaza %s inválido por campo", (campo, valor) => {
  const resultado = validarEmpleado({ ...base(), [campo]: valor }, "2026-09-13");
  expect(resultado.ok).toBe(false);
  if (!resultado.ok) expect(resultado.errores).toHaveProperty(campo);
});
it.each(["2024-12-31", "2999-01-01", "2026-02-30"])("rechaza fecha de baja %s", fecha => {
  expect(validarBajaEmpleado({ ...base(), terminated_at: fecha, termination_reason: "Fin ficticio" }, "2025-01-01", "2026-09-13")).toHaveProperty("terminated_at");
});
it("permite baja el mismo día del alta y exige motivo", () => {
  expect(validarBajaEmpleado({ ...base(), terminated_at: "2025-01-01", termination_reason: "Fin ficticio" }, "2025-01-01", "2026-09-13")).toEqual({});
  expect(validarBajaEmpleado({ ...base(), terminated_at: "2025-01-01" }, "2025-01-01", "2026-09-13")).toHaveProperty("termination_reason");
  expect(enlaceEmpleados(2, true)).toBe("/empleados?estado=bajas&pagina=2");
});
function formulario(): FormData {
  const datos = new FormData();
  for (const [campo, valor] of Object.entries({ first_name: "Persona ficticia", last_name: "Prueba", dni: "12.345.678", job_title: "Cuidador", hired_at: "2025-01-01" })) datos.set(campo, valor);
  return datos;
}
