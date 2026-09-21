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
  const clase =
    "inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";
  return (
    <nav
      aria-label={`Páginas de ${etiqueta}`}
      className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"
    >
      <p className="text-xs font-medium text-slate-500">
        <span className="font-semibold text-slate-700 tabular-nums">{total}</span>{" "}
        {etiqueta} · Página{" "}
        <span className="font-semibold text-slate-700 tabular-nums">{pagina}</span> de{" "}
        <span className="font-semibold text-slate-700 tabular-nums">{ultima}</span>
      </p>
      <div className="flex items-center gap-2">
        {pagina > 1 ? (
          <Link href={anterior} className={clase}>
            ← Anterior
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/50 bg-slate-50/50 px-3.5 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed"
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
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/50 bg-slate-50/50 px-3.5 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed"
          >
            Siguiente →
          </span>
        )}
      </div>
    </nav>
  );
}
