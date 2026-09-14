import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { etiquetaAccionAuditoria, etiquetaTablaAuditoria, formatearMomentoAuditoria, type ResumenAuditoria } from "@/lib/auditoria";
import { etiquetaCampoAuditoria } from "@/lib/auditoria-campos";

export function ListaAuditoria({ eventos, volver }: { eventos: ResumenAuditoria[]; volver: string }): React.ReactElement {
  if (!eventos.length) return <Card className="mt-5 p-6">No hay eventos para estos filtros.</Card>;
  return <ol className="mt-5 space-y-3">{eventos.map(evento => <li key={evento.id}><Card className="p-5">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><p className="text-xs font-medium text-slate-500">{etiquetaTablaAuditoria(evento.table_name)} · {etiquetaAccionAuditoria(evento.action)}</p>
        <h2 className="mt-1 break-words font-semibold">{evento.record_label || "Registro sin referencia de nombre"}</h2></div>
      <time dateTime={evento.occurred_at} className="text-sm text-slate-600">{formatearMomentoAuditoria(evento.occurred_at)}</time>
    </div>
    <p className="mt-2 break-all text-sm text-slate-600">Autor: {evento.actor_label || (evento.actor_id ? "Cuenta histórica" : "Sin usuario identificado")}</p>
    <p className="mt-2 text-sm text-slate-600">{evento.changed_fields.length ? evento.changed_fields.map(etiquetaCampoAuditoria).join(" · ") : "Evento previo sin detalle de valores"}</p>
    <div className="mt-3 flex flex-wrap items-center gap-4">
      <Link href={`/auditoria/${evento.id}?volver=${encodeURIComponent(volver)}`} className="text-sm font-medium text-sky-800 underline">Ver detalle del cambio</Link>
      {evento.origin === "historical" && <Badge>Historial previo</Badge>}
    </div>
  </Card></li>)}</ol>;
}
