import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { enlaceContabilidad, formatearFechaPago, type Cuota } from "@/lib/pagos";
import { TablaCuotas } from "./tabla-cuotas";

const base: Cuota = {
  id: "ficticio", period: "2026-09-01", due_date: "2026-09-10",
  amount_due: 1000, paid_amount: 250, balance: 750, currency: "ARS",
  payment_status: "partial", is_overdue: true, cancelled_reason: null,
};

describe("presentación de la cuenta", () => {
  it("muestra parcial y vencida al mismo tiempo, con importes de la vista", () => {
    const html = renderToStaticMarkup(<TablaCuotas cuotas={[base]} />);
    for (const texto of ["Parcial", "Vencida", "1.000,00", "250,00", "750,00"]) {
      expect(html).toContain(texto);
    }
  });

  it("distingue una cuota anulada de una pagada aunque ambas tengan saldo cero", () => {
    const html = renderToStaticMarkup(<TablaCuotas cuotas={[
      { ...base, id: "anulada", payment_status: "cancelled", is_overdue: false,
        paid_amount: 0, balance: 0, cancelled_reason: "<script>error</script>" },
      { ...base, id: "pagada", payment_status: "paid", is_overdue: false,
        paid_amount: 1000, balance: 0 },
    ]} />);
    expect(html).toContain("Anulada");
    expect(html).toContain("Pagada");
    expect(html).not.toContain("Vencida");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("mantiene el mes y el día sin corrimiento por zona horaria", () => {
    expect(formatearFechaPago("2026-09-01", true)).toBe("septiembre de 2026");
    expect(formatearFechaPago("2026-09-01")).toBe("01/09/2026");
  });

  it("conserva el filtro de bajas al paginar", () => {
    expect(enlaceContabilidad(2, true)).toBe("/contabilidad?estado=bajas&pagina=2");
    expect(enlaceContabilidad(1, true)).toBe("/contabilidad?estado=bajas");
  });
});
