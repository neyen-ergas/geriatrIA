import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { contarPorEstado, listarConsultas } from "./admision-datos";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

// El cliente real de Supabase habla con una API sintética con límite de filas.
// Todas las fechas coinciden para que el orden necesite desempatar por id.
const filas = Array.from({ length: 1255 }, (_, indice) => ({
  id: String(indice + 1).padStart(8, "0"),
  creado_en: "2026-09-08T10:00:00Z",
  estado: indice < 1205 ? "nuevo" : "contactado",
}));
const solicitudes: { metodo: string; url: URL; preferencia: string | null }[] = [];
let fallar = false;
let omitirConteo = false;

beforeEach(() => {
  solicitudes.length = 0;
  fallar = false;
  omitirConteo = false;
  vi.mocked(createAdminClient).mockReturnValue(createClient<Database>(
    "https://supabase.invalid",
    "clave-ficticia",
    { global: { fetch: responder }, auth: { persistSession: false } },
  ));
});

describe("lecturas de Admisión con más de 1.000 consultas", () => {
  it("cuenta en la base sin descargar las filas ni truncar los totales", async () => {
    expect(await contarPorEstado()).toEqual({
      nuevo: 1205, contactado: 50, visita_agendada: 0, ingreso: 0, descartada: 0,
    });
    expect(solicitudes).toHaveLength(5);
    expect(solicitudes.every(s => s.metodo === "HEAD"
      && s.preferencia?.includes("count=exact"))).toBe(true);
  });

  it("recorre todas las páginas sin repetir ni perder consultas empatadas", async () => {
    const ids: string[] = [];
    for (let pagina = 1; pagina <= 26; pagina++) {
      const consultas = await listarConsultas(undefined, pagina);
      expect(consultas.length).toBeLessThanOrEqual(50);
      ids.push(...consultas.map(c => c.id));
    }
    expect(ids).toEqual(filas.map(f => f.id).reverse());
    expect(new Set(ids).size).toBe(1255);
    expect(solicitudes.every(s =>
      s.url.searchParams.get("order") === "creado_en.desc,id.desc")).toBe(true);
  });

  it("mantiene el filtro y alcanza la última página más allá de 1.000 filas", async () => {
    const consultas = await listarConsultas("nuevo", 25);
    expect(consultas).toHaveLength(5);
    expect(consultas.every(c => c.estado === "nuevo")).toBe(true);
    expect(consultas.map(c => c.id)).toEqual(
      filas.slice(0, 5).map(f => f.id).reverse(),
    );
  });

  it("no presenta un error de conteo como un cero válido", async () => {
    fallar = true;
    await expect(contarPorEstado()).rejects.toThrow(
      "No se pudieron contar las consultas.",
    );
  });

  it("rechaza una respuesta sin conteo exacto", async () => {
    omitirConteo = true;
    await expect(contarPorEstado()).rejects.toThrow();
  });

  it("rechaza páginas inválidas antes de consultar", async () => {
    await expect(listarConsultas(undefined, 0)).rejects.toThrow();
    expect(solicitudes).toHaveLength(0);
  });
});

async function responder(
  entrada: RequestInfo | URL,
  opciones?: RequestInit,
): Promise<Response> {
  const url = new URL(String(entrada));
  const metodo = opciones?.method ?? "GET";
  const cabeceras = new Headers(opciones?.headers);
  solicitudes.push({ metodo, url, preferencia: cabeceras.get("Prefer") });
  if (fallar) {
    return new Response(null, { status: 403 });
  }
  const estado = url.searchParams.get("estado")?.replace(/^eq\./, "");
  let resultado = filas.filter(f => !estado || f.estado === estado);
  const total = resultado.length;
  if (url.searchParams.get("order")?.includes("id.desc")) {
    resultado = [...resultado].sort((a, b) => b.id.localeCompare(a.id));
  }
  const inicio = Number(url.searchParams.get("offset") ?? 0);
  const limite = Math.min(1000, Number(url.searchParams.get("limit") ?? 1000));
  resultado = resultado.slice(inicio, inicio + limite);
  return new Response(metodo === "HEAD" ? null : JSON.stringify(resultado), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...(!omitirConteo ? { "Content-Range": `0-0/${total}` } : {}),
    },
  });
}
