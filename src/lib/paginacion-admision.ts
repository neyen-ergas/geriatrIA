import type { Estado } from "@/lib/admision";

export const CONSULTAS_POR_PAGINA = 50;

export function paginaAdmision(valor: unknown, total: number): number {
  const pagina = typeof valor === "string" && /^[1-9]\d*$/.test(valor)
    ? Number(valor)
    : 1;
  const ultima = Math.max(1, Math.ceil(total / CONSULTAS_POR_PAGINA));
  return Number.isSafeInteger(pagina) ? Math.min(pagina, ultima) : 1;
}

export function enlaceAdmision(pagina: number, estado?: Estado): string {
  const parametros = new URLSearchParams();
  if (estado) parametros.set("estado", estado);
  if (pagina > 1) parametros.set("pagina", String(pagina));
  const consulta = parametros.toString();
  return consulta ? `/admision?${consulta}` : "/admision";
}
