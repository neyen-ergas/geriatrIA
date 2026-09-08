import Link from "next/link";
import type { Estado } from "@/lib/admision";
import {
  CONSULTAS_POR_PAGINA,
  enlaceAdmision,
} from "@/lib/paginacion-admision";

export function Paginacion({
  pagina,
  total,
  estado,
}: {
  pagina: number;
  total: number;
  estado?: Estado;
}): React.ReactElement {
  const ultima = Math.max(1, Math.ceil(total / CONSULTAS_POR_PAGINA));
  const clase = "rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";
  return (
    <nav
      aria-label="Páginas de consultas"
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-slate-600">
        {total} consultas · Página {pagina} de {ultima}
      </p>
      <div className="flex gap-2">
        {pagina > 1 ? (
          <Link href={enlaceAdmision(pagina - 1, estado)} className={clase}>
            Anterior
          </Link>
        ) : (
          <span aria-disabled="true" className="px-3 py-2 text-sm text-slate-400">
            Anterior
          </span>
        )}
        {pagina < ultima ? (
          <Link href={enlaceAdmision(pagina + 1, estado)} className={clase}>
            Siguiente
          </Link>
        ) : (
          <span aria-disabled="true" className="px-3 py-2 text-sm text-slate-400">
            Siguiente
          </span>
        )}
      </div>
    </nav>
  );
}
