export const REGISTROS_POR_PAGINA = 50;

export function paginaListado(valor: unknown, total: number): number {
  const pagina = typeof valor === "string" && /^[1-9]\d*$/.test(valor)
    ? Number(valor)
    : 1;
  const ultima = Math.max(1, Math.ceil(total / REGISTROS_POR_PAGINA));
  return Number.isSafeInteger(pagina) ? Math.min(pagina, ultima) : 1;
}
