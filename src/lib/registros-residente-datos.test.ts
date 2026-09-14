import { beforeEach, expect, it, vi } from "vitest";
import { createClient as crearSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { listarRegistrosResidente, obtenerRegistroResidente, obtenerEstadiaDeRegistro } from "./registros-residente-datos";
import { SECCIONES_REGISTRO } from "./registros-residente";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
const persona = "88000000-0000-4000-8000-000000000010";
let urls: URL[], fallo: boolean;
beforeEach(() => {
  urls = []; fallo = false;
  vi.mocked(createClient).mockResolvedValue(crearSupabase<Database>("https://supabase.invalid", "ficticia", {
    auth: { persistSession: false }, global: { fetch: async (entrada, opciones) => {
      const url = new URL(String(entrada)); urls.push(url);
      if (fallo) return new Response('{"message":"DATO PRIVADO"}', { status: 403 });
      const inicio = Number(url.searchParams.get("offset") || 0);
      const filas = Array.from({ length: 1205 }, (_, id) => ({ id: String(id) }))
        .slice(inicio, inicio + Number(url.searchParams.get("limit") || 1000));
      return new Response(opciones?.method === "HEAD" ? null : JSON.stringify(filas), {
        headers: { "Content-Type": "application/json", "Content-Range": "0-0/1205" },
      });
    } },
  }));
});
it.each(SECCIONES_REGISTRO)("%s filtra persona/archivo en conteo y página, con más de mil filas", async seccion => {
  const resultado = await listarRegistrosResidente(persona, seccion, true, "999");
  expect(resultado).toMatchObject({ pagina: 25, total: 1205 }); expect(resultado.registros).toHaveLength(5);
  expect(urls.every(u => u.searchParams.get("resident_id") === `eq.${persona}` && u.searchParams.get("archived_at") === "not.is.null")).toBe(true);
  expect(urls[1].searchParams.get("order")).toBe("created_at.desc,id.desc");
});
it("errores no equivalen a historial vacío e ids inválidos no consultan", async () => {
  expect(await obtenerRegistroResidente(persona, "medicacion", "invalido")).toBeNull();
  expect(await obtenerEstadiaDeRegistro(persona, "invalido")).toBeNull(); expect(urls).toHaveLength(0);
  fallo = true;
  await expect(listarRegistrosResidente(persona, "documentos", false, "1")).rejects.toThrow("No se pudo contar el historial.");
});
