import { describe, expect, it } from "vitest";
import { validarBajaResidente } from "@/lib/baja-residente";

describe("fechas de baja", () => {
  it.each([
    ["2026-03-01", true],
    ["2026-03-05", true],
    ["2026-02-28", false],
    ["2026-03-06", false],
    ["2026-02-30", false],
  ])("valida el límite %s", (fecha, esperado) => {
    const formulario = new FormData();
    formulario.set("discharged_at", fecha);
    formulario.set("discharge_reason", "Baja ficticia");
    expect(validarBajaResidente(
      formulario, "2026-03-01", "2026-03-05",
    ).ok).toBe(esperado);
  });
});
