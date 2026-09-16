import { beforeEach, expect, it, vi } from "vitest";
import { createClient as crearSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { obtenerFormularioFamiliar } from "./familiares-datos";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
const persona = "87000000-0000-4000-8000-000000000010";
const contacto = "87000000-0000-4000-8000-000000000020";
let urls: URL[];
beforeEach(() => {
  urls = [];
  vi.mocked(createClient).mockResolvedValue(
    crearSupabase<Database>("https://supabase.invalid", "ficticia", {
      auth: { persistSession: false },
      global: {
        fetch: async entrada => {
          const url = new URL(String(entrada));
          urls.push(url);
          return new Response(
            JSON.stringify(url.pathname.endsWith("/residents") ? [{ id: persona }] : []),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        },
      },
    }),
  );
});
it("rechaza ids inválidos antes de leer", async () => {
  expect(await obtenerFormularioFamiliar("invalido")).toBeNull();
  expect(urls).toHaveLength(0);
});
it("edición requiere que el contacto pertenezca al residente", async () => {
  expect(await obtenerFormularioFamiliar(persona, contacto)).toBeNull();
  expect(urls[1].searchParams.get("id")).toBe(`eq.${contacto}`);
  expect(urls[1].searchParams.get("resident_id")).toBe(`eq.${persona}`);
  expect(urls[1].searchParams.get("select")).toContain("updated_at");
});
it("alta solo consulta la persona, sin crear nada al abrir", async () => {
  expect(await obtenerFormularioFamiliar(persona)).toEqual({
    residente: { id: persona },
    contacto: null,
  });
  expect(urls).toHaveLength(1);
});
