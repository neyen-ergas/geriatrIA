/** El texto de búsqueda nunca se interpreta como sintaxis de PostgREST. */
export function busquedaPersonas(valor: unknown): string {
  if (typeof valor !== "string") return "";
  return valor
    .slice(0, 80)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function filtroBusquedaPersonas(valor: string): string | null {
  const busqueda = busquedaPersonas(valor);
  if (!busqueda) return null;
  const partes = busqueda.split(" ");
  const termino = partes.join("*");
  const opciones = [
    `first_name.ilike.*${termino}*`,
    `last_name.ilike.*${termino}*`,
    `dni.ilike.*${termino}*`,
  ];
  if (partes.length > 1) {
    const primero = partes[0];
    const resto = partes.slice(1).join("*");
    opciones.push(
      `and(first_name.ilike.*${primero}*,last_name.ilike.*${resto}*)`,
      `and(first_name.ilike.*${resto}*,last_name.ilike.*${primero}*)`,
    );
  }
  return opciones.join(",");
}
