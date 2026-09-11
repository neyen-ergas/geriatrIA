import { esFechaValida } from "@/lib/primer-ingreso";
import { vencimientoSugerido } from "@/lib/cargar-pagos";

export function mesVencimientos(valor: unknown, hoy: string): string {
  return typeof valor === "string" && esFechaValida(`${valor}-01`)
    ? valor : hoy.slice(0, 7);
}

export function limitesMesVencimientos(mes: string): { inicio: string; fin: string } {
  if (!esFechaValida(`${mes}-01`)) throw new Error("El mes no es válido.");
  return { inicio: `${mes}-01`, fin: vencimientoSugerido(mes, 31) };
}

export function enlaceVencimientos(mes: string, vencidas: boolean, pagina = 1): string {
  const parametros = new URLSearchParams({ mes });
  if (vencidas) parametros.set("estado", "vencidas");
  if (pagina > 1) parametros.set("pagina", String(pagina));
  return `/contabilidad/vencimientos?${parametros}`;
}
