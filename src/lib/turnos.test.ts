import { expect, it } from "vitest";
import {
  esFranjaTurno,
  esEstadoTurno,
  horarioTurno,
  esHoraGuardia,
  semanaTurnos,
  enlaceTurnos,
  etiquetaDiaSemana,
  FRANJAS_TURNO,
  ESTADOS_TURNO,
  ETIQUETAS_FRANJA_TURNO,
  ETIQUETAS_ESTADO_TURNO,
} from "./turnos";

it("muestra el cruce de medianoche para guardias y noches", () => {
  expect(horarioTurno({ shift_type: "guardia", guard_start: "19:30:00" })).toBe(
    "19:30–07:30 (+1 día)",
  );
  expect(horarioTurno({ shift_type: "guardia", guard_start: "07:00:00" })).toBe(
    "07:00–19:00",
  );
  expect(horarioTurno({ shift_type: "noche", guard_start: null })).toBe(
    "23:00–07:00 (+1 día)",
  );
  expect(horarioTurno({ shift_type: "franco", guard_start: null })).toBe("00:00–24:00");
  expect(esHoraGuardia("24:00")).toBe(false);
  expect(esHoraGuardia("23:59")).toBe(true);
});

it("valida todas las franjas y rechaza cadenas arbitrarias", () => {
  for (const franja of FRANJAS_TURNO) {
    expect(esFranjaTurno(franja)).toBe(true);
    expect(ETIQUETAS_FRANJA_TURNO[franja]).toBeDefined();
  }
  expect(esFranjaTurno("mediodia")).toBe(false);
  expect(esFranjaTurno(null)).toBe(false);
  expect(esFranjaTurno(123)).toBe(false);
});

it("valida los estados de turno permitidos", () => {
  for (const estado of ESTADOS_TURNO) {
    expect(esEstadoTurno(estado)).toBe(true);
    expect(ETIQUETAS_ESTADO_TURNO[estado]).toBeDefined();
  }
  expect(esEstadoTurno("en_espera")).toBe(false);
  expect(esEstadoTurno(undefined)).toBe(false);
});

it("calcula la semana completa de lunes a domingo para una fecha dada", () => {
  // Miércoles 16 de septiembre de 2026
  const semana = semanaTurnos("2026-09-16", "2026-09-16");
  expect(semana.inicio).toBe("2026-09-14"); // Lunes
  expect(semana.fin).toBe("2026-09-20"); // Domingo
  expect(semana.dias).toHaveLength(7);
  expect(semana.dias[0]).toBe("2026-09-14");
  expect(semana.dias[6]).toBe("2026-09-20");
  expect(semana.anterior).toBe("2026-09-07");
  expect(semana.siguiente).toBe("2026-09-21");
});

it("usa la fecha de hoy si el parámetro es inválido o ausente", () => {
  const semana = semanaTurnos(undefined, "2026-09-15");
  expect(semana.inicio).toBe("2026-09-14");
  expect(semana.fin).toBe("2026-09-20");
});

it("arma los enlaces de navegación semanal", () => {
  expect(enlaceTurnos()).toBe("/turnos");
  expect(enlaceTurnos("2026-09-14")).toBe("/turnos?semana=2026-09-14");
});

it("formatea la etiqueta corta del día", () => {
  const etiqueta = etiquetaDiaSemana("2026-09-15");
  expect(etiqueta.toLowerCase()).toContain("15");
});
