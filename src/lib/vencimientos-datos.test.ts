import { beforeEach, expect, it, vi } from "vitest";
import { createClient as crearSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { listarVencimientos } from "./vencimientos-datos";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
const base = {
  id: "cuota", period: "2026-09-01", due_date: "2026-09-10",
  amount_due: 100, paid_amount: 40, balance: 60, currency: "ARS",
  payment_status: "partial", is_overdue: false, cancelled_reason: null,
  cancelled_at: null as string | null,
  admissions: { id: "estadia", admitted_at: "2026-01-01", discharged_at: "2026-09-02",
    residents: { first_name: "Persona ficticia", last_name: "Prueba", dni: "TEST" } },
};
const filas = [
  ...Array.from({ length: 1255 }, (_, indice) => ({ ...base,
    id: String(indice).padStart(5, "0"),
    due_date: indice % 2 ? "2026-09-10" : "2026-09-01", is_overdue: indice % 2 === 0,
  })),
  { ...base, id: "anterior", due_date: "2026-08-31" },
  { ...base, id: "siguiente", due_date: "2026-10-01" },
  { ...base, id: "pagada", balance: 0, paid_amount: 100, payment_status: "paid" },
  { ...base, id: "anulada", balance: 0, cancelled_at: "2026-09-01T12:00:00Z", payment_status: "cancelled" },
];
let solicitudes: { url: URL; metodo: string }[];
let fallo: "HEAD" | "GET" | null;
let conteoAusente: boolean;
beforeEach(() => {
  solicitudes = []; fallo = null; conteoAusente = false;
  vi.mocked(createClient).mockResolvedValue(crearSupabase<Database>(
    "https://supabase.invalid", "clave-ficticia", {
      auth: { persistSession: false },
      global: { fetch: async (entrada, opciones) => {
        const url = new URL(String(entrada));
        const metodo = opciones?.method ?? "GET";
        solicitudes.push({ url, metodo });
        if (fallo === metodo) return new Response(JSON.stringify({ message: "dato privado" }), { status: 403 });
        const parametros = url.searchParams;
        let resultado = [...filas];
        for (const filtro of parametros.getAll("due_date")) {
          const fecha = filtro.slice(4);
          resultado = resultado.filter(f => filtro.startsWith("gte.") ? f.due_date >= fecha : f.due_date <= fecha);
        }
        if (parametros.get("balance") === "gt.0") resultado = resultado.filter(f => f.balance > 0);
        if (parametros.get("cancelled_at") === "is.null") resultado = resultado.filter(f => f.cancelled_at === null);
        if (parametros.get("is_overdue") === "eq.true") resultado = resultado.filter(f => f.is_overdue);
        if (parametros.get("order") === "due_date.asc,id.asc") {
          resultado.sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id.localeCompare(b.id));
        }
        const total = resultado.length;
        const inicio = Number(parametros.get("offset") ?? 0);
        resultado = resultado.slice(inicio, inicio + Math.min(Number(parametros.get("limit") ?? 1000), 1000));
        return new Response(metodo === "HEAD" ? null : JSON.stringify(resultado), {
          headers: conteoAusente ? {} : { "content-range": `0-${resultado.length - 1}/${total}` },
        });
      } },
    },
  ));
});

it("recorre más de mil cuotas con saldo en orden estable y sin mezclar meses", async () => {
  const ids: string[] = [];
  for (let pagina = 1; pagina <= 26; pagina++) {
    const datos = await listarVencimientos("2026-09", false, String(pagina));
    expect(datos.total).toBe(1255);
    expect(datos.vencimientos.length).toBeLessThanOrEqual(50);
    ids.push(...datos.vencimientos.map(v => v.cuota.id));
  }
  expect(new Set(ids).size).toBe(1255);
  expect(ids).toEqual(filas.slice(0, 1255).sort((a, b) =>
    a.due_date.localeCompare(b.due_date) || a.id.localeCompare(b.id)).map(f => f.id));
  expect(solicitudes[0].metodo).toBe("HEAD");
});
it("filtra vencidas en conteo y filas, manteniendo cuotas de estadías finalizadas", async () => {
  const datos = await listarVencimientos("2026-09", true, "999");
  expect(datos.total).toBe(628);
  expect(datos.pagina).toBe(13);
  expect(datos.vencimientos.every(v => v.cuota.is_overdue && v.estadia.discharged_at)).toBe(true);
  expect(solicitudes.every(s => s.url.searchParams.get("is_overdue") === "eq.true")).toBe(true);
  expect(solicitudes.every(s => !s.url.searchParams.has("admissions.discharged_at"))).toBe(true);
});
it.each(["HEAD", "GET"] as const)("presenta error seguro si falla %s, no un listado vacío", async metodo => {
  fallo = metodo;
  await expect(listarVencimientos("2026-09", false, "1"))
    .rejects.toThrow(metodo === "HEAD" ? "No se pudieron contar los vencimientos." : "No se pudieron leer los vencimientos.");
});
it("no interpreta conteo ausente como cero", async () => {
  conteoAusente = true;
  await expect(listarVencimientos("2026-09", false, "1")).rejects.toThrow("contar");
  expect(solicitudes).toHaveLength(1);
});
it("muestra vacío cuando no existen cuotas del mes", async () => {
  expect(await listarVencimientos("2026-07", false, "5"))
    .toEqual({ vencimientos: [], total: 0, pagina: 1 });
});
