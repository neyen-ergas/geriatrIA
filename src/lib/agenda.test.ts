import { describe, expect, it } from "vitest";
import { etiquetaDiaAgenda, semanaAgenda } from "./agenda";

describe("semanas de agenda", () => {
  it.each(["2026-09-07", "2026-09-12", "2026-09-13"])("normaliza %s de lunes a domingo", fecha => {
    const semana = semanaAgenda(fecha, "2026-09-12");
    expect(semana.inicio).toBe("2026-09-07");
    expect(semana.fin).toBe("2026-09-13");
    expect(semana.dias).toHaveLength(7);
    expect(semana.anterior).toBe("2026-08-31");
    expect(semana.siguiente).toBe("2026-09-14");
  });
  it.each([undefined, ["2026-01-01"], "2026-02-30", "basura", "9999-12-31"])(
    "recupera la semana actual ante parámetros inválidos o fuera de rango: %s", valor => {
      expect(semanaAgenda(valor, "2026-09-12").inicio).toBe("2026-09-07");
    },
  );
  it("conserva días al cruzar el año y el 29 de febrero", () => {
    expect(semanaAgenda("2026-01-01", "2026-09-12")).toMatchObject({ inicio: "2025-12-29", fin: "2026-01-04" });
    expect(semanaAgenda("2024-02-29", "2026-09-12").dias).toContain("2024-02-29");
  });
  it("las etiquetas no retroceden un día por la zona horaria", () => {
    expect(etiquetaDiaAgenda("2026-09-07")).toContain("lunes");
    expect(etiquetaDiaAgenda("2026-09-07")).toContain("7");
  });
});
