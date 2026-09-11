import { expect, it } from "vitest";
import { MAX_COMPROBANTE_BYTES, perteneceComprobante, validarComprobante } from "./comprobantes";

it("permite registrar sin adjunto", async () => {
  expect(await validarComprobante(null)).toEqual({ ok: true, datos: null });
  expect(await validarComprobante(new File([], ""))).toEqual({ ok: true, datos: null });
});
it.each([
  ["image/jpeg", [255, 216, 255], "jpg"],
  ["image/png", [137, 80, 78, 71, 13, 10, 26, 10], "png"],
  ["application/pdf", [37, 80, 68, 70, 45], "pdf"],
] as const)("acepta la firma de %s sin confiar en el nombre", async (tipo, firma, extension) => {
  const archivo = new File([new Uint8Array(firma)], "nombre-privado.exe", { type: tipo });
  expect(await validarComprobante(archivo)).toEqual({ ok: true, datos: { archivo, extension } });
});
it("rechaza archivos vacíos, formato disfrazado y archivos grandes", async () => {
  for (const archivo of [new File([], "vacio.pdf", { type: "application/pdf" }),
    new File(["<script>"], "falso.pdf", { type: "application/pdf" }),
    new File([new Uint8Array(MAX_COMPROBANTE_BYTES + 1)], "grande.jpg", { type: "image/jpeg" }),
    "ruta/inventada.pdf"]) {
    expect((await validarComprobante(archivo)).ok).toBe(false);
  }
});
it("no acepta rutas de otra cuota ni traversal al descargar", () => {
  const ruta = "11111111-1111-4111-8111-111111111111/estadia/cuota/22222222-2222-4222-8222-222222222222.pdf";
  expect(perteneceComprobante(ruta, "estadia", "cuota")).toBe(true);
  expect(perteneceComprobante(ruta, "estadia", "otra")).toBe(false);
  expect(perteneceComprobante(ruta.replace("cuota/", "cuota/../"), "estadia", "cuota")).toBe(false);
});
