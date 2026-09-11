export const BUCKET_COMPROBANTES = "payment-receipts";
export const MAX_COMPROBANTE_BYTES = 3 * 1024 * 1024;
export const TIPOS_COMPROBANTE = "image/jpeg,image/png,application/pdf";

type ArchivoValidado = { archivo: File; extension: "jpg" | "png" | "pdf" };
export type ValidacionComprobante = { ok: true; datos: ArchivoValidado | null }
  | { ok: false; error: string };

export async function validarComprobante(valor: FormDataEntryValue | null): Promise<ValidacionComprobante> {
  if (valor === null || (valor instanceof File && valor.size === 0 && !valor.name)) {
    return { ok: true, datos: null };
  }
  if (!(valor instanceof File) || valor.size === 0) {
    return { ok: false, error: "Seleccioná un archivo JPG, PNG o PDF válido." };
  }
  if (valor.size > MAX_COMPROBANTE_BYTES) return { ok: false, error: "El comprobante no puede superar los 3 MB." };
  const firma = new Uint8Array(await valor.slice(0, 8).arrayBuffer());
  const coincide = (bytes: number[]) => bytes.every((byte, indice) => firma[indice] === byte);
  let extension: ArchivoValidado["extension"] | null = null;
  if (valor.type === "image/jpeg" && coincide([255, 216, 255])) extension = "jpg";
  if (valor.type === "image/png" && coincide([137, 80, 78, 71, 13, 10, 26, 10])) extension = "png";
  if (valor.type === "application/pdf" && coincide([37, 80, 68, 70, 45])) extension = "pdf";
  return extension ? { ok: true, datos: { archivo: valor, extension } }
    : { ok: false, error: "El contenido del archivo debe coincidir con su formato JPG, PNG o PDF." };
}

export function perteneceComprobante(ruta: string, admissionId: string, cuotaId: string): boolean {
  const partes = ruta.split("/");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return partes.length === 4 && uuid.test(partes[0]) && partes[1] === admissionId
    && partes[2] === cuotaId && /^[0-9a-f-]{36}\.(jpg|png|pdf)$/i.test(partes[3]);
}
