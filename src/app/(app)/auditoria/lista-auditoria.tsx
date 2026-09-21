import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import {
  etiquetaAccionAuditoria,
  etiquetaTablaAuditoria,
  formatearMomentoAuditoria,
  type ResumenAuditoria,
} from "@/lib/auditoria";
import { etiquetaCampoAuditoria } from "@/lib/auditoria-campos";

export function ListaAuditoria({
  eventos,
  volver,
}: {
  eventos: ResumenAuditoria[];
  volver: string;
}): React.ReactElement {
  if (!eventos.length)
    return (
      <Card className="mt-6 p-10 text-center text-sm text-slate-500">
        No hay eventos para estos filtros.
      </Card>
    );
  return (
    <ol className="mt-6 space-y-3.5">
      {eventos.map(evento => (
        <li key={evento.id}>
          <Card className="p-5 transition-all hover:shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  <span>{etiquetaTablaAuditoria(evento.table_name)}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-600">
                    {etiquetaAccionAuditoria(evento.action)}
                  </span>
                </span>
                <h2 className="mt-1 break-words text-base font-bold text-slate-900">
                  {evento.record_label || "Registro sin referencia de nombre"}
                </h2>
              </div>
              <time
                dateTime={evento.occurred_at}
                className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
              >
                {formatearMomentoAuditoria(evento.occurred_at)}
              </time>
            </div>
            <p className="mt-3 break-all text-xs font-medium text-slate-600">
              <span className="text-slate-400 uppercase tracking-wider">Autor:</span>{" "}
              <span className="font-semibold text-slate-800">
                {evento.actor_label ||
                  (evento.actor_id ? "Cuenta histórica" : "Sin usuario identificado")}
              </span>
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              <span className="text-slate-400 uppercase tracking-wider">Campos:</span>{" "}
              {evento.changed_fields.length
                ? evento.changed_fields.map(etiquetaCampoAuditoria).join(" · ")
                : "Evento previo sin detalle de valores"}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
              <Link
                href={`/auditoria/${evento.id}?volver=${encodeURIComponent(volver)}`}
                className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                Ver detalle del cambio →
              </Link>
              {evento.origin === "historical" && (
                <Badge className="border-slate-200 bg-slate-100 text-slate-600">
                  Historial previo
                </Badge>
              )}
            </div>
          </Card>
        </li>
      ))}
    </ol>
  );
}
