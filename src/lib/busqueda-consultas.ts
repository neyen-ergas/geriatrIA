const MAXIMO_BUSQUEDA = 80;

export function busquedaConsultas(valor: unknown): string {
  if (typeof valor !== "string") return "";
  // La búsqueda es texto, nunca sintaxis del filtro de PostgREST.
  return valor
    .slice(0, MAXIMO_BUSQUEDA)
    .replace(/[^\p{L}\p{N}\s+.'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function filtroBusquedaConsultas(valor: string): string | null {
  const texto = busquedaConsultas(valor);
  if (!texto) return null;
  const telefono = /^[\d\s+.-]+$/.test(texto)
    ? texto.replace(/\D/g, "").split("").join("*")
    : texto;
  const nombre = texto.replace(/\s+/g, "*");
  return `nombre.ilike.*${nombre}*,telefono.ilike.*${telefono || nombre}*`;
}
