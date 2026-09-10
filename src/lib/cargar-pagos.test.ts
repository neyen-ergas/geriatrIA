import { describe, expect, it } from "vitest";
import { validarCargaCuota, validarCargaPago, vencimientoSugerido } from "./cargar-pagos";
import type { Cuota } from "./pagos";

const estadia = { id: "estadia", admitted_at: "2026-01-15", discharged_at: "2026-03-04" };
const valores = { periodo: "2026-02", vencimiento: "2026-02-28", importe: "1.000,50",
  fecha: "2026-02-10", medio: "cash", notas: "", referencia: "" };
const cuota: Cuota = { id: "cuota", period: "2026-02-01", due_date: "2026-02-10",
  amount_due: 2000, paid_amount: 500, balance: 1500, currency: "ARS",
  payment_status: "partial", is_overdue: false, cancelled_reason: null };

describe("carga de cuotas y pagos", () => {
  it.each([["2026-02", 31, "2026-02-28"], ["2024-02", 30, "2024-02-29"],
    ["2026-04", 31, "2026-04-30"], ["2026-09", 10, "2026-09-10"]] as const)(
    "ajusta el vencimiento de %s día %s", (mes, dia, esperado) => {
      expect(vencimientoSugerido(mes, dia)).toBe(esperado);
    },
  );
  it("crea argumentos con el importe argentino y el primer día del período", () => {
    expect(validarCargaCuota(valores, estadia)).toEqual({ ok: true, datos: {
      p_admission_id: "estadia", p_period: "2026-02-01",
      p_due_date: "2026-02-28", p_amount_due: 1000.5,
    } });
  });
  it.each(["2025-12", "2026-04", "2026-13"])("rechaza mes fuera de estadía o inválido: %s", periodo => {
    expect(validarCargaCuota({ ...valores, periodo }, estadia).ok).toBe(false);
  });
  it("acepta los meses de ingreso y baja sin prorratear", () => {
    for (const periodo of ["2026-01", "2026-03"]) {
      expect(validarCargaCuota({ ...valores, periodo, vencimiento: `${periodo}-28` }, estadia).ok).toBe(true);
    }
  });
  it.each(["2026-03-01", "2026-02-30"])("rechaza vencimiento %s", vencimiento => {
    expect(validarCargaCuota({ ...valores, vencimiento }, estadia).ok).toBe(false);
  });
  it.each(["0", "-1", "1,001", "10000000000", "NaN"])("rechaza importe %s", importe => {
    expect(validarCargaCuota({ ...valores, importe }, estadia).ok).toBe(false);
    expect(validarCargaPago({ ...valores, importe }, cuota, "2026-02-10").ok).toBe(false);
  });
  it("acepta pago parcial o total y rechaza exceso, cuota anulada y fecha futura", () => {
    expect(validarCargaPago(valores, cuota, "2026-02-10").ok).toBe(true);
    expect(validarCargaPago({ ...valores, importe: "1500" }, cuota, "2026-02-10").ok).toBe(true);
    expect(validarCargaPago({ ...valores, importe: "1500,01" }, cuota, "2026-02-10").ok).toBe(false);
    expect(validarCargaPago(valores, { ...cuota, payment_status: "cancelled" }, "2026-02-10").ok).toBe(false);
    expect(validarCargaPago(valores, cuota, "2026-02-09").ok).toBe(false);
  });
  it("valida el medio y exige aclaración para otro", () => {
    for (const medio of ["inventado", "other", "__proto__"]) {
      expect(validarCargaPago({ ...valores, medio }, cuota, "2026-02-10").ok).toBe(false);
    }
    expect(validarCargaPago({ ...valores, medio: "other", notas: "Cheque" }, cuota, "2026-02-10").ok).toBe(true);
  });
});
