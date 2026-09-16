import { beforeEach, expect, it, vi } from "vitest";
import { createClient as crearSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { listarAuditoria, obtenerEventoAuditoria } from "./auditoria-datos";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
let fallo: string | null;
let solicitudes: URL[];
beforeEach(() => {
  fallo = null;
  solicitudes = [];
  vi.mocked(createClient).mockResolvedValue(
    crearSupabase<Database>("https://supabase.invalid", "clave-ficticia", {
      auth: { persistSession: false },
      global: {
        fetch: async (entrada, opciones) => {
          const url = new URL(String(entrada));
          solicitudes.push(url);
          if (fallo === opciones?.method)
            return new Response('{"message":"DATO PRIVADO"}', { status: 403 });
          const inicio = Number(url.searchParams.get("offset") ?? 0);
          const filas = Array.from({ length: 1205 }, (_, id) => ({ id: id + 1 })).slice(
            inicio,
            inicio + Math.min(Number(url.searchParams.get("limit") ?? 1000), 1000),
          );
          return new Response(
            opciones?.method === "HEAD" ? null : JSON.stringify(filas),
            {
              headers: {
                "Content-Type": "application/json",
                ...(fallo === "count" ? {} : { "Content-Range": "0-0/1205" }),
              },
            },
          );
        },
      },
    }),
  );
});
it("llega a más de mil eventos con orden estable y sin descargar snapshots", async () => {
  const resultado = await listarAuditoria({}, "999");
  expect(resultado).toMatchObject({ total: 1205, pagina: 25 });
  expect(resultado.eventos).toHaveLength(5);
  expect(solicitudes[1].searchParams.get("order")).toBe("occurred_at.desc,id.desc");
  expect(solicitudes[1].searchParams.get("select")).not.toMatch(
    /old_values|new_values|source_key/,
  );
});
it("aplica todos los filtros tanto al conteo como a las filas", async () => {
  await listarAuditoria(
    {
      tabla: "payments",
      accion: "update",
      autor: "sin-usuario",
      desde: "2026-09-01",
      hasta: "2026-09-02",
      registro: "84000000-0000-4000-8000-000000000001",
    },
    "1",
  );
  for (const url of solicitudes) {
    expect(url.searchParams.get("table_name")).toBe("eq.payments");
    expect(url.searchParams.get("action")).toBe("eq.update");
    expect(url.searchParams.get("actor_id")).toBe("is.null");
    expect(url.searchParams.get("record_id")).toContain("84000000");
    expect(url.searchParams.getAll("occurred_at")).toEqual([
      "gte.2026-09-01T03:00:00.000Z",
      "lt.2026-09-03T03:00:00.000Z",
    ]);
  }
});
it.each(["HEAD", "GET", "count"])(
  "no oculta fallos ni conteos desconocidos: %s",
  async modo => {
    fallo = modo;
    await expect(listarAuditoria({}, "1")).rejects.toThrow(/^No se pudo/);
  },
);
it("rechaza ids inválidos antes de consultar y protege mensajes de error", async () => {
  for (const id of ["0", "-1", "1x", "9007199254740993", "1,2"])
    expect(await obtenerEventoAuditoria(id)).toBeNull();
  expect(solicitudes).toHaveLength(0);
  fallo = "GET";
  await expect(obtenerEventoAuditoria("12")).rejects.toThrow(
    "No se pudo cargar el detalle del cambio.",
  );
});
