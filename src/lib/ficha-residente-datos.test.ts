import { beforeEach, expect, it, vi } from "vitest";
import { createClient as crearSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { obtenerFichaResidente } from "./ficha-residente-datos";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
const residenteId = "86000000-0000-4000-8000-000000000001";
let solicitudes: URL[];
let fallo: string | null;
beforeEach(() => {
  solicitudes = []; fallo = null;
  vi.mocked(createClient).mockResolvedValue(crearSupabase<Database>(
    "https://supabase.invalid", "clave-ficticia", {
      auth: { persistSession: false }, global: { fetch: async (entrada, opciones) => {
        const url = new URL(String(entrada)); solicitudes.push(url);
        const tabla = url.pathname.split("/").at(-1);
        const conteo = opciones?.method === "HEAD";
        if (fallo === tabla || (fallo === "conteo" && conteo)) {
          return new Response('{"message":"DATO PRIVADO"}', { status: 403 });
        }
        let filas: object[];
        if (tabla === "residents") {
          filas = fallo === "ausente" ? [] : [{ id: residenteId }];
        } else if (url.searchParams.has("discharged_at")) {
          filas = [{ id: "ingreso-activo-fuera-de-pagina" }];
        } else {
          const inicio = Number(url.searchParams.get("offset") ?? 0);
          filas = Array.from({ length: 1205 }, (_, id) => ({ id: String(id) }))
            .slice(inicio, inicio + Number(url.searchParams.get("limit") ?? 1000));
        }
        return new Response(conteo ? null : JSON.stringify(filas), {
          headers: { "Content-Type": "application/json",
            ...(fallo === "sin-conteo" ? {} : { "Content-Range": "0-0/1205" }) },
        });
      } },
    },
  ));
});

it("pagina ambos historiales completos y consulta el ingreso activo aparte", async () => {
  const ficha = await obtenerFichaResidente(residenteId, "999", "999");
  expect(ficha?.ingresoActivoId).toBe("ingreso-activo-fuera-de-pagina");
  for (const pagina of [ficha?.estadias, ficha?.contactos]) {
    expect(pagina).toMatchObject({ pagina: 25, total: 1205 });
    expect(pagina?.filas).toHaveLength(5);
  }
  for (const url of solicitudes) {
    expect(url.searchParams.get(url.pathname.endsWith("/residents")
      ? "id" : "resident_id")).toBe(`eq.${residenteId}`);
  }
  const paginas = solicitudes.filter(url => url.searchParams.has("offset"));
  expect(paginas.map(url => url.searchParams.get("order")))
    .toEqual(["admitted_at.desc,id.desc", "created_at.asc,id.asc"]);
});
it("valida el identificador antes de acceder a Supabase", async () => {
  expect(await obtenerFichaResidente("invalido", "1", "1")).toBeNull();
  expect(solicitudes).toHaveLength(0);
});
it("una persona inexistente no dispara lecturas de familiares ni estadías", async () => {
  fallo = "ausente";
  expect(await obtenerFichaResidente(residenteId, "1", "1")).toBeNull();
  expect(solicitudes).toHaveLength(1);
});
it.each(["residents", "admissions", "family_contacts", "conteo", "sin-conteo"])(
  "no convierte errores en datos vacíos ni expone el mensaje de base: %s", async modo => {
    fallo = modo;
    await expect(obtenerFichaResidente(residenteId, "1", "1"))
      .rejects.toThrow(/^No se pud/);
  },
);
