import { beforeEach, expect, it, vi } from "vitest";
import { createClient as crearSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { listarCuotasSinCrear } from "./cuotas-sin-crear";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const consultas: URL[] = [];
let fallarCuotas = false;

beforeEach(() => {
  consultas.length = 0;
  fallarCuotas = false;
  vi.mocked(createClient).mockResolvedValue(
    crearSupabase<Database>("https://supabase.invalid", "clave-ficticia", {
      auth: { persistSession: false },
      global: {
        fetch: async entrada => {
          const url = new URL(String(entrada));
          consultas.push(url);
          if (fallarCuotas && url.pathname.endsWith("/monthly_charges")) {
            return new Response(JSON.stringify({ message: "sin permiso" }), {
              status: 403,
            });
          }
          const filas = url.pathname.endsWith("/admissions")
            ? [
                { id: "ingreso-a", residents: { first_name: "Ana", last_name: "Pérez" } },
                {
                  id: "ingreso-b",
                  residents: { first_name: "Luis", last_name: "Rossi" },
                },
              ]
            : [{ admission_id: "ingreso-a" }];
          return new Response(JSON.stringify(filas), { status: 200 });
        },
      },
    }),
  );
});

it("señala sólo las cuotas ausentes de estadías activas con arancel y filtra el mes", async () => {
  expect(await listarCuotasSinCrear("2026-10")).toEqual([
    { admissionId: "ingreso-b", nombre: "Rossi, Luis" },
  ]);
  expect(consultas[0].searchParams.get("discharged_at")).toBe("is.null");
  expect(consultas[0].searchParams.get("admitted_at")).toBe("lt.2026-11-01");
  expect(consultas[0].searchParams.get("monthly_fee")).toBe("gt.0");
  expect(consultas[1].searchParams.get("period")).toBe("eq.2026-10-01");
  expect(consultas[1].searchParams.get("cancelled_at")).toBe("is.null");
});

it("no interpreta un error de lectura como ausencia de cuotas", async () => {
  fallarCuotas = true;
  await expect(listarCuotasSinCrear("2026-10")).rejects.toThrow(
    "No se pudieron consultar las cuotas del mes",
  );
});
