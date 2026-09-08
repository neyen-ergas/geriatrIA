import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient as crearSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import {
  contarEstadias,
  listarResidentesActivos,
  listarResidentesDadosDeBaja,
  obtenerResidenteParaReingreso,
} from "./residentes-datos";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const personas = Array.from({ length: 1256 }, (_, indice) => ({
  id: `persona-${indice + 1}`,
  first_name: "Nombre ficticio",
  last_name: String(1256 - indice).padStart(4, "0"),
  dni: String(indice + 1),
  birth_date: "1940-01-01",
}));
const bajas = personas.map((residente, indice) => ({
  id: `baja-${String(indice + 1).padStart(4, "0")}`,
  resident_id: residente.id,
  admitted_at: "2026-04-01",
  discharged_at: "2026-04-02",
  discharge_reason: "Ficticia",
  room: null, due_day: 10, monthly_fee: 100,
  residents: residente,
}));
const activos = personas.slice(0, 1255).map((residente, indice) => ({
  ...bajas[indice], id: `activo-${indice + 1}`,
  admitted_at: "2026-04-03", discharged_at: null,
  residents: residente,
}));
const filas = [
  ...activos, ...bajas,
  { ...bajas[1255], id: "ultima-a", admitted_at: "2026-04-02" },
  { ...bajas[1255], id: "ultima-b", admitted_at: "2026-04-02" },
];
type Fila = (typeof filas)[number];
const solicitudes: { url: URL; metodo: string }[] = [];
let fallar = false;

beforeEach(() => {
  solicitudes.length = 0;
  fallar = false;
  vi.mocked(createClient).mockResolvedValue(crearSupabase<Database>(
    "https://supabase.invalid", "clave-ficticia",
    { global: { fetch: responder }, auth: { persistSession: false } },
  ));
});

describe("páginas y reingreso con más de 1.000 estadías", () => {
  it("cuenta activos e historial sin descargar filas", async () => {
    expect(await contarEstadias(false)).toBe(1255);
    expect(await contarEstadias(true)).toBe(1258);
    expect(solicitudes.every(s => s.metodo === "HEAD")).toBe(true);
  });

  it("pagina activos en orden global de apellido, nombre e id", async () => {
    const ids: string[] = [];
    for (let pagina = 1; pagina <= 26; pagina++) {
      const resultado = await listarResidentesActivos(pagina);
      expect(resultado.length).toBeLessThanOrEqual(50);
      ids.push(...resultado.map(r => r.admissionId));
    }
    expect(ids).toEqual([...activos].sort((a, b) =>
      a.residents.last_name.localeCompare(b.residents.last_name)
        || a.residents.first_name.localeCompare(b.residents.first_name)
        || a.id.localeCompare(b.id),
    ).map(r => r.id));
    expect(new Set(ids).size).toBe(1255);
  });

  it("no permite reingresar si el ingreso activo está después del límite de 1.000", async () => {
    const primera = await listarResidentesDadosDeBaja(1);
    expect(primera.find(r => r.resident.id === "persona-1255")?.canBeReadmitted)
      .toBe(false);
    expect(solicitudes).toHaveLength(1);
  });

  it("solo la última baja habilita reingreso, aunque las otras estén en otra página", async () => {
    const resultado = [];
    for (let pagina = 1; pagina <= 26; pagina++) {
      resultado.push(...await listarResidentesDadosDeBaja(pagina));
    }
    expect(resultado).toHaveLength(1258);
    expect(new Set(resultado.map(r => r.admissionId)).size).toBe(1258);
    expect(resultado.filter(r => r.canBeReadmitted).map(r => r.admissionId))
      .toEqual(["ultima-b"]);
    expect(resultado.filter(r => r.resident.id === "persona-1256"))
      .toHaveLength(3);
  });

  it("el formulario usa el mismo desempate de última baja y revisa activos", async () => {
    expect(await obtenerResidenteParaReingreso("persona-1255")).toBeNull();
    const disponible = await obtenerResidenteParaReingreso("persona-1256");
    expect(disponible?.lastAdmission.admittedAt).toBe("2026-04-02");
    expect(solicitudes.some(s => s.url.searchParams.get("order")
      === "discharged_at.desc,admitted_at.desc,id.desc")).toBe(true);
  });

  it("no ofrece acciones basadas en una lectura fallida", async () => {
    fallar = true;
    await expect(listarResidentesDadosDeBaja()).rejects.toThrow();
    await expect(contarEstadias(false)).rejects.toThrow();
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER])(
    "rechaza la página inválida %s", async (pagina) => {
      await expect(listarResidentesActivos(pagina)).rejects.toThrow();
      await expect(listarResidentesDadosDeBaja(pagina)).rejects.toThrow();
      expect(solicitudes).toHaveLength(0);
    },
  );
});

function ordenar(a: Fila, b: Fila): number {
  return (b.discharged_at ?? "").localeCompare(a.discharged_at ?? "")
    || b.admitted_at.localeCompare(a.admitted_at)
    || b.id.localeCompare(a.id);
}

async function responder(
  entrada: RequestInfo | URL, opciones?: RequestInit,
): Promise<Response> {
  const url = new URL(String(entrada));
  const parametros = url.searchParams;
  const metodo = opciones?.method ?? "GET";
  solicitudes.push({ url, metodo });
  if (fallar) return new Response(null, { status: 403 });
  const cabeceras = new Headers(opciones?.headers);
  let resultado = filas.filter(f =>
    (!parametros.has("resident_id")
      || f.resident_id === parametros.get("resident_id")?.replace(/^eq\./, ""))
    && (parametros.get("discharged_at") === "is.null"
      ? f.discharged_at === null : f.discharged_at !== null),
  );
  const total = resultado.length;
  if (parametros.get("order")?.startsWith("residents(last_name)")) {
    resultado.sort((a, b) => a.residents.last_name.localeCompare(b.residents.last_name)
      || a.residents.first_name.localeCompare(b.residents.first_name)
      || a.id.localeCompare(b.id));
  } else if (parametros.has("order")) {
    resultado.sort(ordenar);
  }
  const inicio = Number(parametros.get("offset") ?? 0);
  resultado = resultado.slice(inicio,
    inicio + Math.min(1000, Number(parametros.get("limit") ?? 1000)));
  if (parametros.get("select")?.includes("activo:admissions")) {
    expect(parametros.get("residents.activo.discharged_at")).toBe("is.null");
    expect(parametros.get("residents.activo.limit")).toBe("1");
    expect(parametros.get("residents.ultima_baja.discharged_at")).toBe("not.is.null");
    expect(parametros.get("residents.ultima_baja.limit")).toBe("1");
    expect(parametros.get("residents.ultima_baja.order"))
      .toBe("discharged_at.desc,admitted_at.desc,id.desc");
    resultado = resultado.map(f => ({
      ...f,
      residents: {
        ...f.residents,
        activo: activos.filter(a => a.resident_id === f.resident_id)
          .slice(0, 1).map(a => ({ id: a.id })),
        ultima_baja: filas.filter(a => a.resident_id === f.resident_id
          && a.discharged_at !== null).sort(ordenar)
          .slice(0, 1).map(a => ({ id: a.id })),
      },
    }));
  }
  const cuerpo = cabeceras.get("Accept")?.includes("vnd.pgrst.object")
    ? resultado[0] ?? null : resultado;
  return new Response(metodo === "HEAD" ? null : JSON.stringify(cuerpo), {
    status: 200,
    headers: { "Content-Type": "application/json", "Content-Range": `0-0/${total}` },
  });
}
