import { expect, it } from "vitest";
import { enlaceVencimientos, limitesMesVencimientos, mesVencimientos } from "./vencimientos";

it("conserva un mes válido y normaliza parámetros inválidos al mes actual", () => {
  expect(mesVencimientos("2025-12", "2026-09-10")).toBe("2025-12");
  for (const valor of [undefined, "2026-13", "2026-2", "2026-09-01", ["2026-01"]]) {
    expect(mesVencimientos(valor, "2026-09-10")).toBe("2026-09");
  }
});
it("delimita meses cortos, bisiestos y diciembre sin incluir el mes siguiente", () => {
  expect(limitesMesVencimientos("2024-02")).toEqual({ inicio: "2024-02-01", fin: "2024-02-29" });
  expect(limitesMesVencimientos("2026-02").fin).toBe("2026-02-28");
  expect(limitesMesVencimientos("2026-12").fin).toBe("2026-12-31");
  expect(() => limitesMesVencimientos("2026-13")).toThrow();
});
it("conserva mes y filtro al navegar y vuelve a primera página sin perderlos", () => {
  expect(enlaceVencimientos("2026-09", true, 2))
    .toBe("/contabilidad/vencimientos?mes=2026-09&estado=vencidas&pagina=2");
  expect(enlaceVencimientos("2026-09", true))
    .toBe("/contabilidad/vencimientos?mes=2026-09&estado=vencidas");
});
