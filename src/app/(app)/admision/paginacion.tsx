import type { Estado } from "@/lib/admision";
import { enlaceAdmision } from "@/lib/paginacion-admision";
import { PaginacionListado } from "@/components/paginacion-listado";

export function Paginacion({
  pagina, total, estado, busqueda,
}: {
  pagina: number;
  total: number;
  estado?: Estado;
  busqueda?: string;
}): React.ReactElement {
  return (
    <PaginacionListado
      pagina={pagina}
      total={total}
      anterior={enlaceAdmision(pagina - 1, estado, busqueda)}
      siguiente={enlaceAdmision(pagina + 1, estado, busqueda)}
      etiqueta="consultas"
    />
  );
}
