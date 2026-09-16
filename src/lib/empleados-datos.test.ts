import { beforeEach, expect, it, vi } from "vitest";
import { createClient as crearSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { listarEmpleados, obtenerEmpleado } from "./empleados-datos";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
let fallo: boolean;
let solicitudes: URL[];
beforeEach(() => {
  fallo = false;
  solicitudes = [];
  vi.mocked(createClient).mockResolvedValue(
    crearSupabase<Database>("https://supabase.invalid", "clave-ficticia", {
      auth: { persistSession: false },
      global: {
        fetch: async (entrada, opciones) => {
          const url = new URL(String(entrada));
          solicitudes.push(url);
          if (fallo) return new Response('{"message":"DATO PRIVADO"}', { status: 403 });
          const bajas = url.searchParams.get("terminated_at") === "not.is.null";
          const total = bajas ? 1 : 1205;
          const inicio = Number(url.searchParams.get("offset") ?? 0);
          const filas = Array.from({ length: total }, (_, i) => ({
            id: String(i),
            first_name: "Ficticio",
            last_name: "Prueba",
            dni: `TEST-${i}`,
            job_title: "Cuidador",
            hired_at: "2025-01-01",
            terminated_at: bajas ? "2025-02-01" : null,
          })).slice(
            inicio,
            inicio + Math.min(Number(url.searchParams.get("limit") ?? 1000), 1000),
          );
          return new Response(
            opciones?.method === "HEAD" ? null : JSON.stringify(filas),
            {
              headers: {
                "Content-Type": "application/json",
                "Content-Range": `0-0/${total}`,
              },
            },
          );
        },
      },
    }),
  );
});
it("cuenta más de mil personas y llega a la última página en orden estable", async () => {
  const resultado = await listarEmpleados(false, "999");
  expect(resultado).toMatchObject({ total: 1205, pagina: 25 });
  expect(resultado.empleados).toHaveLength(5);
  expect(solicitudes[1].searchParams.get("order")).toBe(
    "last_name.asc,first_name.asc,id.asc",
  );
});
it("las bajas se filtran tanto en conteo como en filas", async () => {
  const resultado = await listarEmpleados(true, "1");
  expect(resultado.total).toBe(1);
  expect(
    solicitudes.every(u => u.searchParams.get("terminated_at") === "not.is.null"),
  ).toBe(true);
});
it("rechaza ids inválidos y no presenta errores como listas vacías", async () => {
  expect(await obtenerEmpleado("invalido")).toBeNull();
  expect(solicitudes).toHaveLength(0);
  fallo = true;
  await expect(listarEmpleados(false, "1")).rejects.toThrow(
    /^No se pudo contar el personal\.$/,
  );
});
