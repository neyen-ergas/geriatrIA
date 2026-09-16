import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "./route";
const mocks = vi.hoisted(() => ({
  sesion: vi.fn(),
  registro: vi.fn(),
  cliente: vi.fn(),
  firmar: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/registros-residente-datos", () => ({
  obtenerRegistroResidente: mocks.registro,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.cliente }));
const persona = "88000000-0000-4000-8000-000000000010";
const parametros = {
  params: Promise.resolve({
    residentId: persona,
    seccion: "documentos",
    registroId: "88000000-0000-4000-8000-000000000020",
  }),
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.registro.mockResolvedValue({
    file_path: `88000000-0000-4000-8000-000000000001/${persona}/88000000-0000-4000-8000-000000000020.pdf`,
  });
  mocks.cliente.mockResolvedValue({
    storage: { from: () => ({ createSignedUrl: mocks.firmar }) },
  });
  mocks.firmar.mockResolvedValue({
    data: { signedUrl: "https://storage.invalid/documento" },
    error: null,
  });
});
it("sesión previa a descargar", async () => {
  mocks.sesion.mockRejectedValue(new Error("SIN_PERMISO"));
  await expect(GET(new Request("https://app.invalid"), parametros)).rejects.toThrow(
    "SIN_PERMISO",
  );
  expect(mocks.registro).not.toHaveBeenCalled();
});
it("firma por 60 segundos, descarga genérica y sin caché", async () => {
  const respuesta = await GET(new Request("https://app.invalid"), parametros);
  expect(respuesta.status).toBe(307);
  expect(respuesta.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.firmar).toHaveBeenCalledWith(expect.any(String), 60, {
    download: "documento.pdf",
  });
});
it("no firma rutas ajenas o documentos ausentes", async () => {
  mocks.registro.mockResolvedValue({ file_path: "otra/persona/archivo.pdf" });
  expect((await GET(new Request("https://app.invalid"), parametros)).status).toBe(404);
  expect(mocks.firmar).not.toHaveBeenCalled();
});
