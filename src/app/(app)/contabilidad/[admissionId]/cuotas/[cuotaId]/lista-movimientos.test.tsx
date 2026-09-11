import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import type { Movimiento } from "@/lib/movimientos";
import { ListaMovimientos } from "./lista-movimientos";

vi.mock("../../../anulaciones", () => ({ anularPago: vi.fn() }));
vi.mock("../../../formulario-anulacion", () => ({
  FormularioAnulacion: () => <span>FORMULARIO_ANULAR</span>,
}));
const pago: Movimiento = {
  id: "ficticio", amount: 1250.5, paid_on: "2026-09-01",
  payment_method: "bank_transfer", reference: "TEST-123", notes: "<script>privado</script>",
  created_at: "2026-09-01T02:00:00Z", voided_at: null, voided_reason: null, receipt_path: null,
};

it("presenta el pago original y su anulación sin ofrecer anularlo nuevamente", () => {
  const html = renderToStaticMarkup(<ListaMovimientos
    movimientos={[pago, { ...pago, id: "anulado", voided_at: "2026-09-02T12:00:00Z",
      voided_reason: "Carga duplicada" }]} moneda="ARS" admissionId="estadia" cuotaId="cuota" />);
  for (const texto of ["1.250,50", "Transferencia bancaria", "TEST-123", "Vigente",
    "Anulado", "Carga duplicada", "&lt;script&gt;"]) expect(html).toContain(texto);
  expect(html).not.toContain("<script>");
  expect(html.match(/FORMULARIO_ANULAR/g)).toHaveLength(1);
});

it("explica el listado vacío", () => {
  const html = renderToStaticMarkup(<ListaMovimientos movimientos={[]}
    moneda="ARS" admissionId="estadia" cuotaId="cuota" />);
  expect(html).toContain("Todavía no hay pagos registrados");
  expect(html).not.toContain("FORMULARIO_ANULAR");
});
