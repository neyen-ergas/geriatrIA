import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, ShieldCheck, User } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { requerirSesion } from "@/lib/auth";
import { obtenerEventoAuditoria } from "@/lib/auditoria-datos";
import {
  enlaceAuditoria,
  esTablaAuditoria,
  etiquetaAccionAuditoria,
  etiquetaTablaAuditoria,
  formatearMomentoAuditoria,
  regresoAuditoria,
} from "@/lib/auditoria";
import { CambiosAuditoria } from "../cambios-auditoria";

export const metadata = { title: "Detalle de auditoría · geriatrIA" };

export default async function EventoAuditoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventoId: string }>;
  searchParams: Promise<{ volver?: string | string[] }>;
}): Promise<React.ReactElement> {
  await requerirSesion("administration");
  const evento = await obtenerEventoAuditoria((await params).eventoId);
  if (!evento) notFound();
  const volver = regresoAuditoria((await searchParams).volver);
  return (
    <div className="space-y-6">
      <div>
        <Link
          href={volver}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al historial
        </Link>
      </div>

      <div>
        <div className="inline-flex items-center gap-2">
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 font-bold">
            {etiquetaTablaAuditoria(evento.table_name)}
          </Badge>
          <Badge className="border-slate-200 bg-slate-100 text-slate-700 font-semibold">
            {etiquetaAccionAuditoria(evento.action)}
          </Badge>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {evento.record_label || "Registro sin referencia de nombre"}
        </h1>
      </div>

      <Card className="p-5 shadow-2xs">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Fecha y hora de Argentina
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">
                <time dateTime={evento.occurred_at}>
                  {formatearMomentoAuditoria(evento.occurred_at)}
                </time>
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <User className="h-4 w-4" />
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Autor
              </dt>
              <dd className="mt-0.5 break-all text-sm font-semibold text-slate-800">
                {evento.actor_label ||
                  (evento.actor_id ? "Cuenta histórica" : "Sin usuario identificado")}
              </dd>
            </div>
          </div>
        </dl>
      </Card>

      {evento.origin === "historical" && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs font-medium text-amber-900 leading-relaxed shadow-2xs">
          <span className="font-bold">Historial previo:</span> se muestra solo lo que
          estaba registrado. «No registrado» indica un dato desconocido, mientras que
          «Vacío» indica un valor vacío confirmado. Las referencias de nombre y correo se
          incorporaron al importar el historial.
        </div>
      )}

      <CambiosAuditoria evento={evento} />

      <nav
        aria-label="Enlaces relacionados de auditoría"
        className="flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-4"
      >
        {esTablaAuditoria(evento.table_name) && (
          <Link
            href={enlaceAuditoria({
              tabla: evento.table_name,
              registro: evento.record_id,
            })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900"
          >
            Todos los cambios de este registro
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
        <Link
          href={enlaceAuditoria({ autor: evento.actor_id || "sin-usuario" })}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900"
        >
          Más eventos de este autor
          <ArrowRight className="h-3 w-3" />
        </Link>
      </nav>
    </div>
  );
}
