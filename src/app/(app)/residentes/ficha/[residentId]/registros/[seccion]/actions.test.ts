import { beforeEach, expect, it, vi } from "vitest";
import { guardarRegistro, archivarRegistro } from "./actions";
const mocks = vi.hoisted(() => ({ sesion: vi.fn(), cliente: vi.fn(), rpc: vi.fn(), upload: vi.fn(), registro: vi.fn(), claims: vi.fn(), revalidar: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cliente }));
vi.mock("@/lib/registros-residente-datos", () => ({ obtenerRegistroResidente: mocks.registro }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
const persona = "88000000-0000-4000-8000-000000000010", id = "88000000-0000-4000-8000-000000000020";
const version = "2026-09-14T12:00:00.123456Z", inicial = { valores: {}, errores: {}, mensaje: null };
beforeEach(() => {
  vi.resetAllMocks(); mocks.cliente.mockResolvedValue({ rpc: mocks.rpc, auth: { getClaims: mocks.claims }, storage: { from: () => ({ upload: mocks.upload }) } });
  mocks.rpc.mockResolvedValue({ data: id, error: null }); mocks.upload.mockResolvedValue({ error: null });
  mocks.claims.mockResolvedValue({ data: { claims: { sub: "88000000-0000-4000-8000-000000000001" } }, error: null });
  mocks.redirect.mockImplementation(() => { throw new Error("REDIRECT"); });
});
it.each([guardarRegistro, archivarRegistro])("exige permiso antes de acceder a datos", async accion => {
  mocks.sesion.mockRejectedValue(new Error("SIN_PERMISO"));
  await expect(accion(persona, "cuidados", id, version, inicial, new FormData())).rejects.toThrow("SIN_PERMISO");
  expect(mocks.cliente).not.toHaveBeenCalled();
});
it("descarta metadatos forjados y conserva versión completa", async () => {
  const datos = new FormData(); datos.set("category", "care"); datos.set("details", "Ficticio"); datos.set("created_by", "otro");
  await expect(guardarRegistro(persona, "cuidados", id, version, inicial, datos)).rejects.toThrow("REDIRECT");
  expect(mocks.rpc).toHaveBeenCalledWith("save_resident_record", expect.objectContaining({ p_expected_updated_at: version, p_values: { category: "care", details: "Ficticio" } }));
});
it("no sube archivos de contenido falso ni registra documentos vacíos", async () => {
  const datos = new FormData(); datos.set("title", "Ficticio"); datos.set("document_type", "Prueba");
  datos.set("archivo", new File(["falso"], "prueba.pdf", { type: "application/pdf" }));
  const resultado = await guardarRegistro(persona, "documentos", id, null, inicial, datos);
  expect(resultado.errores.archivo).toBeTruthy(); expect(mocks.upload).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
});
it("carga en carpeta privada antes de vincular y nunca sobrescribe", async () => {
  const datos = new FormData(); datos.set("title", "Ficticio"); datos.set("document_type", "Prueba");
  datos.set("archivo", new File(["%PDF-ficticio"], "privado.pdf", { type: "application/pdf" }));
  await expect(guardarRegistro(persona, "documentos", id, null, inicial, datos)).rejects.toThrow("REDIRECT");
  expect(mocks.upload).toHaveBeenCalledWith(expect.stringContaining(`/${persona}/`), expect.any(File), { upsert: false, contentType: "application/pdf" });
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
});
it("editar documento conserva la ruta verificada de base", async () => {
  mocks.registro.mockResolvedValue({ file_path: "original.pdf" });
  const datos = new FormData(); datos.set("title", "Ficticio"); datos.set("document_type", "Prueba"); datos.set("file_path", "otra.pdf");
  await expect(guardarRegistro(persona, "documentos", id, version, inicial, datos)).rejects.toThrow("REDIRECT");
  expect(mocks.rpc).toHaveBeenCalledWith("save_resident_record", expect.objectContaining({ p_values: expect.objectContaining({ file_path: "original.pdf" }) }));
  expect(mocks.upload).not.toHaveBeenCalled();
});
it("archivar exige motivo y no reintenta una versión vieja", async () => {
  expect((await archivarRegistro(persona, "cuidados", id, version, inicial, new FormData())).errores.motivo).toBeTruthy();
  const datos = new FormData(); datos.set("motivo", "Motivo ficticio");
  mocks.rpc.mockResolvedValue({ data: null, error: { code: "40001", message: "DATO PRIVADO" } });
  const estado = await archivarRegistro(persona, "cuidados", id, version, inicial, datos);
  expect(estado.mensaje).toContain("cambió"); expect(estado.mensaje).not.toContain("DATO PRIVADO");
  expect(mocks.rpc).toHaveBeenCalledTimes(1); expect(mocks.redirect).not.toHaveBeenCalled();
});
