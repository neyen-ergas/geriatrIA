import Link from "next/link";
import { REGISTROS_POR_PAGINA } from "@/lib/paginacion";

export function PaginacionListado({
  pagina,
  total,
  anterior,
  siguiente,
  etiqueta,
}: {
  pagina: number;
  total: number;
  anterior: string;
  siguiente: string;
  etiqueta: string;
}): React.ReactElement {
  const ultima = Math.max(1, Math.ceil(total / REGISTROS_POR_PAGINA));
  if (ultima === 1) return <></>;
  const clase =
    "inline-flex items-center gap-1.5 rounded-md border border-piedra-200/90 bg-white px-3.5 py-1.5 text-sm font-semibold text-piedra-700 transition-colors hover:bg-piedra-50 hover:border-piedra-300 hover:text-piedra-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-piedra-900";
  return (
    <nav
      aria-label={`Páginas de ${etiqueta}`}
      className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-piedra-100 pt-4"
    >
      <p className="text-sm font-medium text-piedra-500">
        <span className="font-semibold text-piedra-700 tabular-nums">{total}</span>{" "}
        {etiqueta} · Página{" "}
        <span className="font-semibold text-piedra-700 tabular-nums">{pagina}</span> de{" "}
        <span className="font-semibold text-piedra-700 tabular-nums">{ultima}</span>
      </p>
      <div className="flex items-center gap-2">
        {pagina > 1 ? (
          <Link href={anterior} className={clase}>
            ← Anterior
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-1.5 rounded-md border border-piedra-200/50 bg-piedra-50/50 px-3.5 py-1.5 text-sm font-medium text-piedra-500 cursor-not-allowed"
          >
            ← Anterior
          </span>
        )}
        {pagina < ultima ? (
          <Link href={siguiente} className={clase}>
            Siguiente →
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-1.5 rounded-md border border-piedra-200/50 bg-piedra-50/50 px-3.5 py-1.5 text-sm font-medium text-piedra-500 cursor-not-allowed"
          >
            Siguiente →
          </span>
        )}
      </div>
    </nav>
  );
}
