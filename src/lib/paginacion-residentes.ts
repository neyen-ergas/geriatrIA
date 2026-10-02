export function enlaceResidentes(pagina: number, bajas: boolean, busqueda = ""): string {
  const parametros = new URLSearchParams();
  if (bajas) parametros.set("estado", "bajas");
  if (busqueda) parametros.set("buscar", busqueda);
  if (pagina > 1) parametros.set("pagina", String(pagina));
  const consulta = parametros.toString();
  return consulta ? `/residentes?${consulta}` : "/residentes";
}
