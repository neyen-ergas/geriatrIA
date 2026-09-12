import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import type { Consulta } from "@/lib/admision";
import { ConsultaCard } from "./consulta-card";

vi.mock("./actions", () => ({
  agendarVisita: vi.fn(), cambiarEstado: vi.fn(), cancelarVisita: vi.fn(), guardarNotas: vi.fn(),
}));
const CONSULTA: Consulta = {
  id: "consulta", creado_en: "2026-01-01T12:00:00Z", actualizado_en: "2026-01-01T12:00:00Z",
  nombre: "Contacto ficticio", telefono: "000000", momento_llamado: "manana",
  mensaje: null, origen: "web", estado: "visita_agendada", notas_internas: null,
  visita_fecha: "2026-01-02", visita_franja: "manana",
};

it("la visita abre el formulario en lugar de marcar ingreso sin crear estadía", () => {
  const html = renderToStaticMarkup(<ConsultaCard consulta={CONSULTA} />);
  expect(html).toContain('href="/admision/consulta/ingreso"');
  expect(html).not.toContain('name="estado" value="ingreso"');
});
it("una consulta vinculada muestra la cuenta y permite notas, sin reabrir", () => {
  const html = renderToStaticMarkup(<ConsultaCard consulta={{ ...CONSULTA, estado: "ingreso", ingreso_id: "estadia" }} />);
  expect(html).toContain('href="/contabilidad/estadia"');
  expect(html).toContain("Guardar notas");
  expect(html).not.toContain("Marcar contactada");
  expect(html).not.toContain("Registrar ingreso");
});
