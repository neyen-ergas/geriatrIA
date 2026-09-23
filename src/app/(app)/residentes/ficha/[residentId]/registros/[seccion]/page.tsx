import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, CheckCircle2, Download, Edit, Plus } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { obtenerFormularioFamiliar } from "@/lib/familiares-datos";
import { listarRegistrosResidente } from "@/lib/registros-residente-datos";
import {
  CONFIG_REGISTRO,
  esSeccionRegistro,
  estadoRegistro,
  rutaRegistros,
} from "@/lib/registros-residente";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { DetalleRegistro } from "./detalle-registro";

export const metadata = { title: "Registros del residente · geriatrIA" };

export default async function RegistrosPage({
  params,
  searchParams,
}: {
  params: Promise<{ residentId: string; seccion: string }>;
  searchParams: Promise<{
    estado?: string;
    pagina?: string | string[];
    guardado?: string;
  }>;
}): Promise<React.ReactElement> {
  const rol = await requerirSesion("operational.read");
  const { residentId, seccion } = await params;
  if (!esSeccionRegistro(seccion)) notFound();
  const persona = await obtenerFormularioFamiliar(residentId);
  if (!persona) notFound();
  const parametros = await searchParams,
    archivados = parametros.estado === "archivados";
  const listado = await listarRegistrosResidente(
    residentId,
    seccion,
    archivados,
    parametros.pagina,
  );
  const config = CONFIG_REGISTRO[seccion],
    ruta = rutaRegistros(residentId, seccion);
  const gestionar = tienePermiso(rol, "operational.write"),
    hoy = hoyEnArgentina();
  const pagina = (numero: number) =>
    `${ruta}?estado=${archivados ? "archivados" : "actuales"}&pagina=${numero}`;
  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/residentes/ficha/${residentId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a la ficha
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Apartado Clínico · {config.titulo}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {config.titulo}
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {persona.residente.first_name} {persona.residente.last_name}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{config.descripcion}</p>
        </div>

        {gestionar && (
          <Link
            href={
              seccion === "pertenencias"
                ? `/residentes/ficha/${residentId}#estadias`
                : `${ruta}/nuevo`
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 text-emerald-400" />
            {seccion === "pertenencias"
              ? "Elegir estadía para agregar"
              : `Agregar ${config.singular}`}
          </Link>
        )}
      </div>

      {parametros.guardado === "1" && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm font-semibold text-emerald-800 shadow-2xs"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          Cambio guardado.
        </div>
      )}

      {/* Segmented Control de Estado */}
      <nav
        aria-label="Estado de los registros"
        className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-2xs text-xs font-semibold text-slate-700"
      >
        <Link
          href={ruta}
          aria-current={!archivados ? "page" : undefined}
          className={`rounded-xl px-4 py-2 transition-all ${
            !archivados
              ? "bg-slate-900 text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
          }`}
        >
          Sin archivar
        </Link>
        <Link
          href={`${ruta}?estado=archivados`}
          aria-current={archivados ? "page" : undefined}
          className={`rounded-xl px-4 py-2 transition-all ${
            archivados
              ? "bg-slate-900 text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
          }`}
        >
          Archivados
        </Link>
      </nav>

      {!listado.registros.length ? (
        <Card className="p-10 text-center text-sm text-slate-500 shadow-2xs">
          No hay registros en esta selección.
        </Card>
      ) : (
        <ul className="space-y-4">
          {listado.registros.map(registro => (
            <li key={registro.id}>
              <Card className="p-5 shadow-2xs transition-all hover:shadow-xs">
                <div className="mb-4 flex items-center justify-between">
                  <Badge className="border-slate-200/90 bg-slate-50 text-slate-700 font-bold">
                    {estadoRegistro(registro, hoy)}
                  </Badge>
                  {registro.updated_at && (
                    <span className="text-[11px] font-medium text-slate-400">
                      Actualizado:{" "}
                      {new Date(registro.updated_at).toLocaleDateString("es-AR")}
                    </span>
                  )}
                </div>

                <DetalleRegistro seccion={seccion} registro={registro} />

                {registro.archived_at && (
                  <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-900">
                    <span className="font-bold">Motivo del archivo:</span>{" "}
                    {registro.archived_reason}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs font-semibold">
                  {seccion === "documentos" && (
                    <Link
                      href={`${ruta}/${registro.id}/archivo`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-600" />
                      Descargar archivo
                    </Link>
                  )}
                  {gestionar && !registro.archived_at && (
                    <>
                      <Link
                        href={`${ruta}/${registro.id}/editar`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Edit className="h-3.5 w-3.5 text-slate-500" />
                        Editar
                      </Link>
                      <Link
                        href={`${ruta}/${registro.id}/archivar`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-colors"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        Archivar con motivo
                      </Link>
                    </>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <PaginacionListado
        pagina={listado.pagina}
        total={listado.total}
        etiqueta="registros"
        anterior={pagina(listado.pagina - 1)}
        siguiente={pagina(listado.pagina + 1)}
      />
    </div>
  );
}
