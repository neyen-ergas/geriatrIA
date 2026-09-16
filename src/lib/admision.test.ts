import { describe, expect, it } from "vitest";
import {
  esEstado,
  esEstadoDirecto,
  esFranja,
  formatearDia,
  TRANSICIONES,
} from "./admision";

describe("admision (funciones puras y type guards)", () => {
  it("valida los estados de consulta", () => {
    expect(esEstado("nuevo")).toBe(true);
    expect(esEstado("contactado")).toBe(true);
    expect(esEstado("visita_agendada")).toBe(true);
    expect(esEstado("ingreso")).toBe(true);
    expect(esEstado("descartada")).toBe(true);
    expect(esEstado("invalido")).toBe(false);
    expect(esEstado(null)).toBe(false);
    expect(esEstado(123)).toBe(false);
  });

  it("valida los estados directos", () => {
    expect(esEstadoDirecto("nuevo")).toBe(true);
    expect(esEstadoDirecto("contactado")).toBe(true);
    expect(esEstadoDirecto("ingreso")).toBe(true);
    expect(esEstadoDirecto("descartada")).toBe(true);
    expect(esEstadoDirecto("visita_agendada")).toBe(false);
    expect(esEstadoDirecto("otro")).toBe(false);
  });

  it("valida las franjas horarias", () => {
    expect(esFranja("manana")).toBe(true);
    expect(esFranja("tarde")).toBe(true);
    expect(esFranja("noche")).toBe(false);
    expect(esFranja(null)).toBe(false);
  });

  it("cumple con las transiciones directas permitidas", () => {
    expect(TRANSICIONES.nuevo).toContain("contactado");
    expect(TRANSICIONES.nuevo).toContain("descartada");
    expect(TRANSICIONES.contactado).toContain("nuevo");
    expect(TRANSICIONES.ingreso).toEqual(["contactado"]);
    expect(TRANSICIONES.descartada).toEqual(["nuevo"]);
  });

  it("formatea el día correctamente sin desfasaje de huso horario", () => {
    const formateado = formatearDia("2026-09-15");
    // "martes, 15 de septiembre"
    expect(formateado.toLowerCase()).toContain("15");
    expect(formateado.toLowerCase()).toContain("septiembre");
  });
});
