import { describe, expect, it } from "vitest";
import { mensajeErrorEstadia } from "@/lib/errores-estadias";

describe("errores de estadías", () => {
  it.each([
    ["23514", "admissions_birth_date_valid", "nacimiento"],
    ["23514", "residents_birth_date_valid", "nacimiento"],
    ["23514", "admissions_admitted_date_valid", "ingreso"],
    ["23514", "admissions_discharged_date_valid", "baja"],
    ["23514", "admissions_discharge_date_valid", "baja"],
    ["23P01", "admissions_stays_overlap", "superponen"],
    ["40001", "", "Recargá"],
    ["40P01", "", "Recargá"],
  ])("traduce %s %s sin exponer datos", (code, restriccion, esperado) => {
    const mensaje = mensajeErrorEstadia({
      code,
      message: `violates check constraint "${restriccion}" DATO_PRIVADO`,
    });
    expect(mensaje).toContain(esperado);
    expect(mensaje).not.toContain("DATO_PRIVADO");
  });

  it("conserva el tratamiento específico de otros errores", () => {
    expect(mensajeErrorEstadia({ code: "23505", message: "dni" })).toBeNull();
    expect(mensajeErrorEstadia({ code: "23514", message: "cuota" })).toBeNull();
  });
});
