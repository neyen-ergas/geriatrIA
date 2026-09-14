import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { obtenerFormularioFamiliar } from "@/lib/familiares-datos";
import { listarRegistrosResidente } from "@/lib/registros-residente-datos";
import { CONFIG_REGISTRO, esSeccionRegistro, estadoRegistro, rutaRegistros } from "@/lib/registros-residente";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { DetalleRegistro } from "./detalle-registro";

export const metadata = { title: "Registros del residente · geriatrIA" };
export default async function RegistrosPage({ params, searchParams }: {
  params: Promise<{ residentId: string; seccion: string }>;
  searchParams: Promise<{ estado?: string; pagina?: string | string[]; guardado?: string }>;
}): Promise<React.ReactElement> {
  const rol = await requerirSesion("operational.read");
  const { residentId, seccion } = await params;
  if (!esSeccionRegistro(seccion)) notFound();
  const persona = await obtenerFormularioFamiliar(residentId);
  if (!persona) notFound();
  const parametros = await searchParams, archivados = parametros.estado === "archivados";
  const listado = await listarRegistrosResidente(residentId, seccion, archivados, parametros.pagina);
  const config = CONFIG_REGISTRO[seccion], ruta = rutaRegistros(residentId, seccion);
  const gestionar = tienePermiso(rol, "operational.write"), hoy = hoyEnArgentina();
  const pagina = (numero: number) => `${ruta}?estado=${archivados ? "archivados" : "actuales"}&pagina=${numero}`;
  return <div className="space-y-5">
    <Link href={`/residentes/ficha/${residentId}`} className="text-sm text-sky-800 underline">← Volver a la ficha</Link>
    <header><h1 className="mt-3 text-2xl font-bold">{config.titulo}</h1>
      <p className="mt-1 break-words text-slate-700">{persona.residente.first_name} {persona.residente.last_name}</p>
      <p className="mt-2 text-sm text-slate-600">{config.descripcion}</p>
    </header>
    {parametros.guardado === "1" && <p role="status" className="text-sm text-emerald-700">Cambio guardado.</p>}
    {gestionar && <Link href={seccion === "pertenencias" ? `/residentes/ficha/${residentId}#estadias` : `${ruta}/nuevo`}
      className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
      {seccion === "pertenencias" ? "Elegir estadía para agregar" : `Agregar ${config.singular}`}
    </Link>}
    <nav aria-label="Estado de los registros" className="flex gap-5 text-sm">
      <Link href={ruta} aria-current={!archivados ? "page" : undefined} className="underline">Sin archivar</Link>
      <Link href={`${ruta}?estado=archivados`} aria-current={archivados ? "page" : undefined} className="underline">Archivados</Link>
    </nav>
    {!listado.registros.length ? <Card className="p-6">No hay registros en esta selección.</Card>
      : <ul className="space-y-4">{listado.registros.map(registro => <li key={registro.id}>
        <Card className="p-5">
          <div className="mb-4"><Badge>{estadoRegistro(registro, hoy)}</Badge></div>
          <DetalleRegistro seccion={seccion} registro={registro} />
          {registro.archived_at && <p className="mt-4 whitespace-pre-wrap break-words text-sm text-slate-600">
            Motivo del archivo: {registro.archived_reason}
          </p>}
          <div className="mt-5 flex flex-wrap gap-5 text-sm">
            {seccion === "documentos" && <Link href={`${ruta}/${registro.id}/archivo`} className="text-sky-800 underline">Descargar archivo</Link>}
            {gestionar && !registro.archived_at && <>
              <Link href={`${ruta}/${registro.id}/editar`} className="text-sky-800 underline">Editar</Link>
              <Link href={`${ruta}/${registro.id}/archivar`} className="text-sky-800 underline">Archivar con motivo</Link>
            </>}
          </div>
        </Card>
      </li>)}</ul>}
    <PaginacionListado pagina={listado.pagina} total={listado.total} etiqueta="registros"
      anterior={pagina(listado.pagina - 1)} siguiente={pagina(listado.pagina + 1)} />
  </div>;
}
