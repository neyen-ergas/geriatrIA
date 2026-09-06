import { describe, expect, it, vi } from "vitest";
import {
  hoyEnArgentina,
  validarPrimerIngreso,
} from "@/lib/primer-ingreso";

const HOY = "2026-03-05";

describe("fechas de primer ingreso y edición", () => {
  it.each(["1940-02-29", HOY])("acepta el límite %s", (fecha) => {
    expect(validarPrimerIngreso(crearFormulario(fecha), HOY).ok).toBe(true);
  });

  it.each([
    ["1940-02-28", "El ingreso no puede ser anterior al nacimiento."],
    ["2026-03-06", "El ingreso no puede estar en el futuro."],
    ["2026-02-29", "Ingresá una fecha válida."],
    ["", "Ingresá una fecha válida."],
  ])("rechaza el ingreso %s con error por campo", (fecha, mensaje) => {
    expect(validarPrimerIngreso(crearFormulario(fecha), HOY)).toMatchObject({
      ok: false,
      errores: { admitted_at: mensaje },
    });
  });

  it.each(["2026-03-06", "1941-02-29", ""])(
    "rechaza el nacimiento %s", (fecha) => {
      const formulario = crearFormulario(HOY);
      formulario.set("resident_birth_date", fecha);
      expect(validarPrimerIngreso(formulario, HOY)).toMatchObject({
        ok: false,
        errores: { resident_birth_date: expect.any(String) },
      });
    },
  );

  it("usa el día argentino cuando UTC ya cambió de fecha", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-03-06T01:00:00Z"));
      expect(hoyEnArgentina()).toBe(HOY);
    } finally {
      vi.useRealTimers();
    }
  });
});

function crearFormulario(fecha: string): FormData {
  const formulario = new FormData();
  const campos = {
    resident_first_name: "Persona ficticia",
    resident_last_name: "Prueba",
    resident_dni: "PRUEBA-FECHAS",
    resident_birth_date: "1940-02-29",
    contact_first_name: "Contacto ficticio",
    contact_last_name: "Prueba",
    contact_relationship: "Familiar",
    contact_phone: "000000",
    admitted_at: fecha,
    monthly_fee: "500.000,50",
    due_day: "10",
  };
  for (const [campo, valor] of Object.entries(campos)) {
    formulario.set(campo, valor);
  }
  return formulario;
}
