import type { Estado } from "@/lib/admision";
export {
  REGISTROS_POR_PAGINA as CONSULTAS_POR_PAGINA,
  paginaListado as paginaAdmision,
} from "@/lib/paginacion";

export function enlaceAdmision(pagina: number, estado?: Estado, busqueda = ""): string {
  const parametros = new URLSearchParams();
  if (estado) parametros.set("estado", estado);
  if (busqueda) parametros.set("buscar", busqueda);
  if (pagina > 1) parametros.set("pagina", String(pagina));
  const consulta = parametros.toString();
  return consulta ? `/admision?${consulta}` : "/admision";
}
