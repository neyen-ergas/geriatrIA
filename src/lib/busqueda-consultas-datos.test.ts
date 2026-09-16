import { beforeEach, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createClient as crearClienteSesion } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { contarPorEstado, listarConsultas } from "./admision-datos";
import { listarCandidatasVisita } from "./reserva-visita-datos";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/conversion-consulta-datos", () => ({
  listarVinculosConsultas: async () => ({}),
}));
let solicitudes: URL[];
const filas = Array.from({ length: 1255 }, (_, i) => ({
  id: String(i).padStart(5, "0"),
  nombre: i < 1205 ? "Ana" : "Otra",
  telefono: "000000",
  estado: i < 1205 ? "nuevo" : "ingreso",
}));
beforeEach(() => {
  solicitudes = [];
  vi.mocked(crearClienteSesion).mockResolvedValue(
    createClient<Database>("https://supabase.invalid", "clave-ficticia", {
      auth: { persistSession: false },
      global: {
        fetch: async (entrada, opciones) => {
          const url = new URL(String(entrada));
          solicitudes.push(url);
          let resultado = [...filas];
          const estado = url.searchParams.get("estado");
          if (estado?.startsWith("eq."))
            resultado = resultado.filter(f => f.estado === estado.slice(3));
          if (estado?.startsWith("in."))
            resultado = resultado.filter(f => ["nuevo", "contactado"].includes(f.estado));
          const filtro = url.searchParams.get("or");
          if (filtro) {
            expect(filtro).toBe("(nombre.ilike.*Ana*,telefono.ilike.*Ana*)");
            resultado = resultado.filter(f => f.nombre === "Ana");
          }
          resultado.reverse();
          const total = resultado.length;
          const inicio = Number(url.searchParams.get("offset") ?? 0);
          resultado = resultado.slice(
            inicio,
            inicio + Math.min(Number(url.searchParams.get("limit") ?? 1000), 1000),
          );
          return new Response(
            opciones?.method === "HEAD" ? null : JSON.stringify(resultado),
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
it("busca en conteos y filas sin limitar a mil, manteniendo estado y página", async () => {
  const conteo = await contarPorEstado("Ana");
  expect(conteo.nuevo).toBe(1205);
  expect(conteo.ingreso).toBe(0);
  expect(await listarConsultas("nuevo", 25, "Ana")).toHaveLength(5);
  expect(solicitudes.every(u => u.searchParams.has("or"))).toBe(true);
});
it("las candidatas excluyen cerradas y conservan búsqueda al ajustar una página fuera de rango", async () => {
  const resultado = await listarCandidatasVisita("Ana", "999");
  expect(resultado).toMatchObject({ total: 1205, pagina: 25 });
  expect(resultado.consultas).toHaveLength(5);
  expect(
    solicitudes.every(u => u.searchParams.get("estado") === "in.(nuevo,contactado)"),
  ).toBe(true);
  expect(solicitudes.every(u => !u.searchParams.get("select")?.includes("notas"))).toBe(
    true,
  );
});
