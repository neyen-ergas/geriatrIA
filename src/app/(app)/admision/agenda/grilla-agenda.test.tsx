import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { semanaAgenda } from "@/lib/agenda";
import { GrillaAgenda } from "./grilla-agenda";

it("muestra ocupados, libres y días pasados con enlaces que conservan la semana", () => {
  const html = renderToStaticMarkup(<GrillaAgenda hoy="2026-09-09" semana={semanaAgenda("2026-09-07", "2026-09-09")}
    visitas={[{ id: "consulta", nombre: "Familia <script>", telefono: "000 000", visita_fecha: "2026-09-10", visita_franja: "manana" }]} />);
  expect(html.match(/<section/g)).toHaveLength(7);
  expect(html.match(/>Libre</g)).toHaveLength(9);
  expect(html.match(/Sin visita agendada/g)).toHaveLength(4);
  expect(html).toContain("Ocupado");
  expect(html).toContain("Hoy");
  expect(html).toContain("Familia &lt;script&gt;");
  expect(html).toContain('href="/admision/consulta?semana=2026-09-07"');
  expect(html).toContain('href="tel:000000"');
  expect(html.match(/>Reservar visita</g)).toHaveLength(9);
  expect(html).toContain('/reservar?fecha=2026-09-09&amp;franja=manana');
  expect(html).not.toContain('/reservar?fecha=2026-09-07');
  expect(html).not.toContain('/reservar?fecha=2026-09-10&amp;franja=manana');
});
