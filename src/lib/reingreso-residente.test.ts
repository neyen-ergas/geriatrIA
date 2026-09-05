import { describe, expect, it } from "vitest";
import {
  validarReingreso,
  type ValoresReingreso,
} from "@/lib/reingreso-residente";

const ULTIMA_BAJA = "2026-02-01";
const HOY = "2026-03-05";

describe("validarReingreso", () => {
  it.each([ULTIMA_BAJA, HOY])(
    "acepta el límite de fecha %s y convierte la cuota argentina",
    (fecha) => {
      const formulario = crearFormulario({ admitted_at: fecha });

      expect(validarReingreso(formulario, ULTIMA_BAJA, HOY)).toEqual({
        ok: true,
        datos: {
          admitted_at: fecha,
          room: null,
          monthly_fee: 500000.5,
          due_day: 10,
          administrative_notes: null,
        },
      });
    },
  );

  it.each([
    ["anterior a la última baja", "2026-01-31"],
    ["en el futuro", "2026-03-06"],
    ["inexistente en el calendario", "2026-02-30"],
  ])("rechaza una fecha %s", (_caso, fecha) => {
    const formulario = crearFormulario({ admitted_at: fecha });

    expect(validarReingreso(formulario, ULTIMA_BAJA, HOY)).toMatchObject({
      ok: false,
      errores: { admitted_at: expect.any(String) },
    });
  });

  it("rechaza una cuota con formato ambiguo sin convertirla a otro importe", () => {
    const formulario = crearFormulario({ monthly_fee: "500,000" });

    expect(validarReingreso(formulario, ULTIMA_BAJA, HOY)).toMatchObject({
      ok: false,
      errores: { monthly_fee: expect.any(String) },
    });
  });
});

function crearFormulario(
  valores: Partial<ValoresReingreso> = {},
): FormData {
  const formulario = new FormData();
  const campos: ValoresReingreso = {
    admitted_at: "2026-03-03",
    room: "",
    monthly_fee: "500.000,50",
    due_day: "10",
    administrative_notes: "",
    ...valores,
  };

  for (const [campo, valor] of Object.entries(campos)) {
    formulario.set(campo, valor);
  }

  return formulario;
}
