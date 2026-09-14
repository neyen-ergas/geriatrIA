import Link from "next/link";
import { Button, Card, Input, Label } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { listarAccesos } from "@/lib/accesos-datos";
import { listarAuditoria } from "@/lib/auditoria-datos";
import { ACCIONES_AUDITORIA, ETIQUETAS_ACCION, ETIQUETAS_TABLA, TABLAS_AUDITORIA, enlaceAuditoria, leerFiltrosAuditoria } from "@/lib/auditoria";
import { ListaAuditoria } from "./lista-auditoria";

export const metadata = { title: "Auditoría · geriatrIA" };

export default async function AuditoriaPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  await requerirSesion("administration");
  const parametros = await searchParams;
  const { filtros, error } = leerFiltrosAuditoria(parametros);
  const [cuentas, listado] = await Promise.all([
    listarAccesos(), error ? Promise.resolve(null) : listarAuditoria(filtros, parametros.pagina),
  ]);
  const select = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm";
  return <div>
    <h1 className="text-2xl font-bold">Auditoría</h1>
    <p className="mt-2 text-sm text-slate-600">Quién cambió cada registro, cuándo y qué valores quedaron guardados. Fechas y horarios de Argentina.</p>
    <p className="mt-2 text-sm text-slate-500">El historial previo incluye únicamente la información que ya se conservaba. Los cambios completos se registran desde la activación de Auditoría.</p>
    <Card className="mt-5 p-5"><form action="/auditoria" method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div><Label htmlFor="tabla">Sección</Label><select id="tabla" name="tabla" defaultValue={filtros.tabla || ""} className={select}>
        <option value="">Todas</option>{TABLAS_AUDITORIA.map(tabla => <option key={tabla} value={tabla}>{ETIQUETAS_TABLA[tabla]}</option>)}
      </select></div>
      <div><Label htmlFor="accion">Tipo de cambio</Label><select id="accion" name="accion" defaultValue={filtros.accion || ""} className={select}>
        <option value="">Todos</option>{ACCIONES_AUDITORIA.map(accion => <option key={accion} value={accion}>{ETIQUETAS_ACCION[accion]}</option>)}
      </select></div>
      <div><Label htmlFor="autor">Autor</Label><select id="autor" name="autor" defaultValue={filtros.autor || ""} className={select}>
        <option value="">Todos</option><option value="sin-usuario">Sin usuario identificado</option>
        {cuentas.map(cuenta => <option key={cuenta.user_id} value={cuenta.user_id}>{cuenta.email || cuenta.employee_name || "Cuenta sin correo"}</option>)}
        {filtros.autor && filtros.autor !== "sin-usuario" && !cuentas.some(cuenta => cuenta.user_id === filtros.autor) && <option value={filtros.autor}>Cuenta histórica seleccionada</option>}
      </select></div>
      <div><Label htmlFor="desde">Desde</Label><Input id="desde" name="desde" type="date" defaultValue={filtros.desde} /></div>
      <div><Label htmlFor="hasta">Hasta (inclusive)</Label><Input id="hasta" name="hasta" type="date" defaultValue={filtros.hasta} /></div>
      {filtros.registro && <input type="hidden" name="registro" value={filtros.registro} />}
      <div className="flex items-end gap-4"><Button type="submit">Filtrar</Button><Link href="/auditoria" className="py-2 text-sm underline">Limpiar filtros</Link></div>
    </form></Card>
    {filtros.registro && <p className="mt-4 text-sm text-sky-800">Mostrando el historial de un registro. <Link href={enlaceAuditoria({ ...filtros, registro: undefined })} className="underline">Ver todos los registros de esta selección</Link></p>}
    {error ? <p role="alert" className="mt-5 text-sm text-red-700">{error}</p> : listado && <>
      <ListaAuditoria eventos={listado.eventos} volver={enlaceAuditoria(filtros, listado.pagina)} />
      <PaginacionListado pagina={listado.pagina} total={listado.total} etiqueta="eventos" anterior={enlaceAuditoria(filtros, listado.pagina - 1)} siguiente={enlaceAuditoria(filtros, listado.pagina + 1)} />
    </>}
  </div>;
}
