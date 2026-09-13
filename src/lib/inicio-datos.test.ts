import { beforeEach, expect, it, vi } from "vitest";
import { createClient as crearCliente } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { obtenerInicio } from "./inicio-datos";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
let solicitudes: URL[];
let fallarCuotas: boolean;
let omitirConteo: boolean;
beforeEach(() => {
  solicitudes = []; fallarCuotas = false; omitirConteo = false;
  const cliente = crearCliente<Database>("https://supabase.invalid", "clave-ficticia", {
    auth: { persistSession: false }, global: { fetch: async entrada => {
      const url = new URL(String(entrada)); solicitudes.push(url);
      const tabla = url.pathname.split("/").at(-1);
      const persona = { first_name: "Persona ficticia", last_name: "Prueba" };
      if (tabla === "monthly_charge_balances" && fallarCuotas) return new Response('{"message":"dato privado"}', { status: 403 });
      const total = tabla === "consulta" && url.searchParams.get("estado") === "eq.nuevo" ? 1255 : 1;
      const filas = tabla === "consulta"
        ? Array.from({ length: total }, (_, i) => ({ id: `consulta-${i}`, nombre: "Familia ficticia", telefono: "000000", visita_franja: "manana" }))
        : tabla === "admissions" ? [{ id: "ingreso", admitted_at: "2026-12-30", discharged_at: "2026-12-31", residents: persona }]
        : [{ id: "cuota", admission_id: "ingreso", due_date: "2025-01-01", balance: 60, currency: "ARS", admissions: { residents: persona } }];
      return new Response(JSON.stringify(filas.slice(0, Number(url.searchParams.get("limit")))), {
        headers: { "Content-Type": "application/json", ...(!omitirConteo ? { "Content-Range": `0-4/${total}` } : {}) },
      });
    } },
  });
  vi.mocked(createClient).mockResolvedValue(cliente);
});

it("usa totales exactos y resúmenes de cinco filas sin descargar todas las consultas", async () => {
  const bloques = await obtenerInicio("2026-12-31");
  expect(bloques[0].resumen?.total).toBe(1255);
  expect(bloques[0].resumen?.elementos).toHaveLength(5);
  expect(solicitudes).toHaveLength(5);
  expect(solicitudes.every(u => u.searchParams.get("limit") === "5")).toBe(true);
});
it("hoy y mañana cruzan el año y los ingresos abarcan siete días civiles", async () => {
  const bloques = await obtenerInicio("2026-12-31");
  const visitas = solicitudes.filter(u => u.searchParams.get("estado") === "eq.visita_agendada");
  expect(visitas.map(u => u.searchParams.get("visita_fecha"))).toEqual(["eq.2026-12-31", "eq.2027-01-01"]);
  const ingresos = solicitudes.find(u => u.pathname.endsWith("/admissions"))!;
  expect(ingresos.searchParams.getAll("admitted_at")).toEqual(["gte.2026-12-25", "lte.2026-12-31"]);
  expect(bloques[4].resumen?.elementos[0].detalle).toContain("Estadía finalizada");
});
it("las vencidas abarcan todos los meses y enlazan a su cuota exacta", async () => {
  const bloques = await obtenerInicio("2026-12-31");
  const cuotas = solicitudes.find(u => u.pathname.endsWith("/monthly_charge_balances"))!;
  expect(cuotas.searchParams.getAll("due_date")).toEqual([]);
  expect(cuotas.searchParams.get("is_overdue")).toBe("eq.true");
  expect(cuotas.searchParams.get("balance")).toBe("gt.0");
  expect(cuotas.searchParams.get("cancelled_at")).toBe("is.null");
  expect(bloques[3].href).toContain("alcance=todas");
  expect(bloques[3].resumen?.elementos[0].href).toBe("/contabilidad/ingreso/cuotas/cuota");
});
it("un fallo financiero no oculta las visitas ni se convierte en cero", async () => {
  fallarCuotas = true;
  const bloques = await obtenerInicio("2026-12-31");
  expect(bloques[3].resumen).toBeNull();
  expect(bloques[1].resumen?.total).toBe(1);
  expect(JSON.stringify(bloques)).not.toContain("dato privado");
});
it("conteos ausentes no se presentan como ceros", async () => {
  omitirConteo = true;
  expect((await obtenerInicio("2026-12-31")).every(b => b.resumen === null)).toBe(true);
});
