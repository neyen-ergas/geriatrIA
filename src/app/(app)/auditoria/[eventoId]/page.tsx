import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
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
    <div>
      <Link href={volver} className="text-sm text-sky-800 underline">
        ← Volver al historial
      </Link>
      <h1 className="mt-4 text-2xl font-bold">
        {etiquetaAccionAuditoria(evento.action)} ·{" "}
        {etiquetaTablaAuditoria(evento.table_name)}
      </h1>
      <p className="mt-2 break-words text-lg text-slate-700">
        {evento.record_label || "Registro sin referencia de nombre"}
      </p>
      <Card className="my-5 p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Fecha y hora de Argentina</dt>
            <dd className="mt-1">
              <time dateTime={evento.occurred_at}>
                {formatearMomentoAuditoria(evento.occurred_at)}
              </time>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Autor</dt>
            <dd className="mt-1 break-all">
              {evento.actor_label ||
                (evento.actor_id ? "Cuenta histórica" : "Sin usuario identificado")}
            </dd>
          </div>
        </dl>
      </Card>
      {evento.origin === "historical" && (
        <p className="mb-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          Historial previo: se muestra solo lo que estaba registrado. «No registrado»
          indica un dato desconocido, mientras que «Vacío» indica un valor vacío
          confirmado. Las referencias de nombre y correo se incorporaron al importar el
          historial.
        </p>
      )}
      <CambiosAuditoria evento={evento} />
      <nav className="mt-6 flex flex-wrap gap-5 text-sm">
        {esTablaAuditoria(evento.table_name) && (
          <Link
            href={enlaceAuditoria({
              tabla: evento.table_name,
              registro: evento.record_id,
            })}
            className="text-sky-800 underline"
          >
            Todos los cambios de este registro
          </Link>
        )}
        <Link
          href={enlaceAuditoria({ autor: evento.actor_id || "sin-usuario" })}
          className="text-sky-800 underline"
        >
          Más eventos de este autor
        </Link>
      </nav>
    </div>
  );
}
