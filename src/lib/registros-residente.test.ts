import { expect, it } from "vitest";
import {
  estadoRegistro,
  validarRegistro,
  type RegistroResidente,
} from "./registros-residente";

function formulario(valores: Record<string, string>): FormData {
  const datos = new FormData();
  for (const [campo, valor] of Object.entries(valores)) datos.set(campo, valor);
  return datos;
}
const indicacion = {
  title: "Prueba",
  instructions: "Texto ficticio",
  professional: "Ficticio",
  starts_on: "2026-09-01",
  ends_on: "2026-09-30",
};
it("transcripción médica exige contenido, profesional y vigencia coherente", () => {
  expect(
    validarRegistro("indicaciones", formulario(indicacion), "2026-09-14").errores,
  ).toEqual({});
  expect(
    validarRegistro(
      "indicaciones",
      formulario({ ...indicacion, ends_on: "2026-08-01" }),
      "2026-09-14",
    ).errores,
  ).toHaveProperty("ends_on");
  expect(
    validarRegistro("medicacion", new FormData(), "2026-09-14").errores,
  ).toMatchObject({
    name: expect.any(String),
    dose: expect.any(String),
    professional: expect.any(String),
    schedule: expect.any(String),
  });
});
it("pertenencias no admite cantidades fraccionarias ni fechas futuras o invertidas", () => {
  const datos = formulario({
    admission_id: "ingreso",
    description: "Objeto",
    quantity: "1.5",
    received_on: "2026-09-20",
    returned_on: "2026-09-01",
  });
  expect(validarRegistro("pertenencias", datos, "2026-09-14").errores).toMatchObject({
    quantity: expect.any(String),
    received_on: expect.any(String),
    returned_on: expect.any(String),
  });
});
it("valida categorías y fechas reales, con observaciones opcionales", () => {
  expect(
    validarRegistro(
      "cuidados",
      formulario({ category: "sql", details: "Texto" }),
      "2026-09-14",
    ).errores,
  ).toHaveProperty("category");
  expect(
    validarRegistro(
      "documentos",
      formulario({ title: "Prueba", document_type: "DNI", issued_on: "2026-02-30" }),
      "2026-09-14",
    ).errores,
  ).toHaveProperty("issued_on");
});
it("vigencia inclusiva diferencia programado, actual, finalizado y archivado", () => {
  const registro = { ...indicacion, archived_at: null } as RegistroResidente;
  expect(estadoRegistro(registro, "2026-08-31")).toBe("Programado");
  expect(estadoRegistro(registro, "2026-09-30")).toBe("Vigente");
  expect(estadoRegistro(registro, "2026-10-01")).toBe("Vigencia finalizada");
  expect(estadoRegistro({ ...registro, archived_at: "2026-09-02" }, "2026-09-14")).toBe(
    "Archivado",
  );
});
