import { beforeEach, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createClient as crearClienteSesion } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { listarVisitasSemana } from "./agenda-datos";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
const visita = { id: "consulta", nombre: "Prueba ficticia", telefono: "000000", estado: "visita_agendada",
  visita_fecha: "2026-09-07", visita_franja: "manana" };
let solicitudes: URL[];
let fallo: boolean;
let respuestaForzada: unknown[] | undefined;
beforeEach(() => {
  solicitudes = []; fallo = false; respuestaForzada = undefined;
  vi.mocked(crearClienteSesion).mockResolvedValue(createClient<Database>("https://supabase.invalid", "clave-ficticia", {
    auth: { persistSession: false }, global: { fetch: async entrada => {
      const url = new URL(String(entrada)); solicitudes.push(url);
      if (fallo) return new Response(JSON.stringify({ message: "DATO PRIVADO" }), { status: 500 });
      const filas = [visita, { ...visita, id: "domingo", visita_fecha: "2026-09-13", visita_franja: "tarde" },
        { ...visita, id: "siguiente", visita_fecha: "2026-09-14" },
        ...Array.from({ length: 1200 }, (_, i) => ({ ...visita, id: `cerrada-${i}`, estado: "ingreso" }))];
      const limites = url.searchParams.getAll("visita_fecha");
      const filtradas = filas.filter(f => f.estado === url.searchParams.get("estado")?.slice(3)
        && limites.every(l => l.startsWith("gte.") ? f.visita_fecha >= l.slice(4) : f.visita_fecha <= l.slice(4)));
      return new Response(JSON.stringify(respuestaForzada ?? filtradas.slice(0, Number(url.searchParams.get("limit")))), {
        headers: { "Content-Type": "application/json" },
      });
    } },
  }));
});

it("filtra en la base por estado y semana antes de limitar, incluso con más de mil cerradas", async () => {
  expect((await listarVisitasSemana("2026-09-07")).map(v => v.id)).toEqual(["consulta", "domingo"]);
  expect(solicitudes).toHaveLength(1);
  expect(solicitudes[0].searchParams.get("limit")).toBe("15");
  expect(solicitudes[0].searchParams.get("select")).not.toContain("notas_internas");
});
it("distingue una semana vacía de una carga fallida", async () => {
  expect(await listarVisitasSemana("2026-10-05")).toEqual([]);
  fallo = true;
  await expect(listarVisitasSemana("2026-09-07")).rejects.toThrow(/^No se pudo cargar la disponibilidad de la semana\.$/);
});
it.each([
  [visita, visita], [{ ...visita, visita_franja: null }],
  [{ ...visita, visita_fecha: "2026-09-14" }], Array.from({ length: 15 }, () => visita),
])("rechaza datos inconsistentes en lugar de mostrar turnos libres", async (...filas) => {
  respuestaForzada = filas;
  await expect(listarVisitasSemana("2026-09-07")).rejects.toThrow();
});
it("rechaza rangos inválidos antes de consultar", async () => {
  await expect(listarVisitasSemana("basura")).rejects.toThrow();
  await expect(listarVisitasSemana("2026-09-08")).rejects.toThrow();
  expect(solicitudes).toHaveLength(0);
});
