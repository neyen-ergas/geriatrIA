import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient as crearSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { listarCuentas, listarCuotas, obtenerCuenta, obtenerCuota } from "./pagos-datos";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const estadia = "11111111-1111-4111-8111-111111111111";
const cuota = {
  id: "cuota-ficticia", period: "2026-09-01", due_date: "2026-09-10",
  amount_due: 1000, paid_amount: 250, balance: 750, currency: "ARS",
  payment_status: "partial", is_overdue: true, cancelled_reason: null,
};
let solicitudes: { url: URL; metodo: string; preferencia: string | null }[];
let respuesta: unknown;
let total: number | null;
let fallo: "HEAD" | "GET" | null;

beforeEach(() => {
  solicitudes = [];
  respuesta = [cuota];
  total = 1255;
  fallo = null;
  vi.mocked(createClient).mockResolvedValue(crearSupabase<Database>(
    "https://supabase.invalid", "clave-ficticia", {
      auth: { persistSession: false },
      global: { fetch: async (entrada, opciones) => {
        const url = new URL(String(entrada));
        const metodo = opciones?.method ?? "GET";
        const cabeceras = new Headers(opciones?.headers);
        solicitudes.push({ url, metodo, preferencia: cabeceras.get("prefer") });
        if (fallo === metodo) return new Response(JSON.stringify({
          code: "42501", message: "Información privada del servidor",
        }), { status: 403 });
        return new Response(metodo === "HEAD" ? null : JSON.stringify(respuesta), {
          status: 200,
          headers: total === null ? {} : { "content-range": `0-49/${total}` },
        });
      } },
    },
  ));
});

describe("lecturas de cuentas y cuotas", () => {
  it("busca la cuota por su id y por estadía antes de permitir un pago", async () => {
    const cuotaId = "22222222-2222-4222-8222-222222222222";
    respuesta = [{ ...cuota, id: cuotaId }];
    expect((await obtenerCuota(estadia, cuotaId))?.id).toBe(cuotaId);
    expect(solicitudes[0].url.searchParams.get("id")).toBe(`eq.${cuotaId}`);
    expect(solicitudes[0].url.searchParams.get("admission_id")).toBe(`eq.${estadia}`);
  });
  it("cuenta sin descargar cuotas y aplica el mismo filtro de estadía a ambas lecturas", async () => {
    const resultado = await listarCuotas(estadia, "26");
    expect(resultado).toEqual({ cuotas: [cuota], total: 1255, pagina: 26 });
    expect(solicitudes.map(s => s.metodo)).toEqual(["HEAD", "GET"]);
    expect(solicitudes[0].preferencia).toContain("count=exact");
    expect(solicitudes.every(s => s.url.pathname.endsWith("/monthly_charge_balances")
      && s.url.searchParams.get("admission_id") === `eq.${estadia}`)).toBe(true);
    expect(solicitudes[1].url.searchParams.get("offset")).toBe("1250");
    expect(solicitudes[1].url.searchParams.get("limit")).toBe("50");
    expect(solicitudes[1].url.searchParams.get("order")).toBe("period.desc,id.desc");
    expect(solicitudes[1].url.searchParams.has("cancelled_at")).toBe(false);
  });

  it.each([false, true])("permite consultar cuentas activas o finalizadas: bajas=%s", async bajas => {
    respuesta = [];
    const resultado = await listarCuentas(bajas, "999");
    expect(resultado.pagina).toBe(26);
    expect(solicitudes.every(s => s.url.searchParams.get("discharged_at")
      === (bajas ? "not.is.null" : "is.null"))).toBe(true);
    expect(solicitudes[1].url.searchParams.get("order"))
      .toBe("residents(last_name).asc,residents(first_name).asc,admitted_at.desc,id.asc");
  });

  it("distingue una cuenta vacía de un error", async () => {
    respuesta = [];
    total = 0;
    expect(await listarCuotas(estadia, "99"))
      .toEqual({ cuotas: [], total: 0, pagina: 1 });
  });

  it.each(["HEAD", "GET"] as const)("no devuelve saldos ni detalles privados ante error %s", async metodo => {
    fallo = metodo;
    await expect(listarCuotas(estadia, "1"))
      .rejects.toThrow(metodo === "HEAD"
        ? "No se pudieron contar las cuotas." : "No se pudieron leer las cuotas.");
    expect(solicitudes).toHaveLength(metodo === "HEAD" ? 1 : 2);
  });

  it("no trata un conteo ausente como cero", async () => {
    total = null;
    await expect(listarCuotas(estadia, "1")).rejects.toThrow("contar las cuotas");
    expect(solicitudes).toHaveLength(1);
  });

  it.each([{ balance: null }, { payment_status: "desconocido" }])(
    "rechaza datos incompletos sin inventar un saldo o estado", async cambio => {
      respuesta = [{ ...cuota, ...cambio }];
      await expect(listarCuotas(estadia, "1")).rejects.toThrow("interpretar una cuota");
    },
  );

  it("no consulta identificadores inválidos y admite una estadía ya finalizada", async () => {
    expect(await obtenerCuenta("invalido")).toBeNull();
    expect(solicitudes).toHaveLength(0);
    respuesta = [{ id: estadia, admitted_at: "2026-01-01", discharged_at: "2026-02-01",
      residents: { first_name: "Ejemplo", last_name: "Ficticio", dni: "123" } }];
    expect((await obtenerCuenta(estadia))?.discharged_at).toBe("2026-02-01");
    expect(solicitudes[0].url.searchParams.get("id")).toBe(`eq.${estadia}`);
    expect(solicitudes[0].url.searchParams.has("discharged_at")).toBe(false);
  });
});
