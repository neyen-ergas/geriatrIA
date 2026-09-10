import { beforeEach, expect, it, vi } from "vitest";
import { createClient as crearSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { listarMovimientos, obtenerMovimiento } from "./movimientos-datos";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
const pagoId = "22222222-2222-4222-8222-222222222222";
let solicitudes: { url: URL; metodo: string; preferencia: string | null }[];
let fallo: boolean;
beforeEach(() => {
  solicitudes = []; fallo = false;
  vi.mocked(createClient).mockResolvedValue(crearSupabase<Database>(
    "https://supabase.invalid", "clave-ficticia", {
      auth: { persistSession: false },
      global: { fetch: async (entrada, opciones) => {
        const metodo = opciones?.method ?? "GET";
        solicitudes.push({ url: new URL(String(entrada)), metodo,
          preferencia: new Headers(opciones?.headers).get("prefer") });
        if (fallo) return new Response(JSON.stringify({ message: "dato privado" }), { status: 403 });
        return new Response(metodo === "HEAD" ? null : JSON.stringify([
          { id: pagoId, voided_at: "2026-09-10T12:00:00Z" },
        ]), { headers: { "content-range": "0-49/1255" } });
      } },
    },
  ));
});
it("pagina todos los pagos de la cuota, incluidos anulados, sin truncar el conteo", async () => {
  const datos = await listarMovimientos("cuota", "999");
  expect(datos.total).toBe(1255); expect(datos.pagina).toBe(26);
  expect(datos.movimientos[0].voided_at).toBeTruthy();
  expect(solicitudes[0].metodo).toBe("HEAD");
  expect(solicitudes[0].preferencia).toContain("count=exact");
  expect(solicitudes.every(s => s.url.searchParams.get("monthly_charge_id") === "eq.cuota")).toBe(true);
  expect(solicitudes[1].url.searchParams.get("offset")).toBe("1250");
  expect(solicitudes[1].url.searchParams.get("limit")).toBe("50");
  expect(solicitudes[1].url.searchParams.get("order")).toBe("paid_on.desc,created_at.desc,id.desc");
  expect(solicitudes[1].url.searchParams.has("voided_at")).toBe(false);
});
it("consulta el pago dentro de su cuota, no solo por id", async () => {
  await obtenerMovimiento("cuota", pagoId);
  expect(solicitudes[0].url.searchParams.get("monthly_charge_id")).toBe("eq.cuota");
  expect(solicitudes[0].url.searchParams.get("id")).toBe(`eq.${pagoId}`);
});
it("no presenta un error como listado vacío", async () => {
  fallo = true;
  await expect(listarMovimientos("cuota", "1")).rejects.toThrow("No se pudieron contar los pagos.");
  expect(solicitudes).toHaveLength(1);
});
