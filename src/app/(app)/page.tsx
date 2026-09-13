import type { Metadata } from "next";
import Link from "next/link";
import { SoloGestion } from "@/components/permisos";
import { Card } from "@/components/ui";
import { requerirSesion } from "@/lib/auth";
import { obtenerInicio } from "@/lib/inicio-datos";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { formatearFechaPago } from "@/lib/pagos";

export const metadata: Metadata = { title: "Inicio · geriatrIA" };
export default async function InicioPage(): Promise<React.ReactElement> {
  await requerirSesion("operational.read");
  const hoy = hoyEnArgentina();
  const bloques = await obtenerInicio(hoy);
  return <div>
    <h1 className="text-2xl font-bold text-slate-900">Inicio</h1>
    <p className="mt-2 text-sm text-slate-600">Pendientes al {formatearFechaPago(hoy)} · Hora de Argentina</p>
    <nav aria-label="Accesos rápidos" className="mt-5 flex flex-wrap gap-3 text-sm font-medium">
      <Link className="rounded-lg bg-slate-900 px-4 py-2 text-white" href="/admision/agenda">Agenda de visitas</Link>
      <SoloGestion><Link className="rounded-lg border bg-white px-4 py-2" href="/residentes/nuevo">Registrar ingreso</Link></SoloGestion>
      <Link className="rounded-lg border bg-white px-4 py-2" href="/contabilidad/vencimientos?alcance=todas">Revisar cuotas vencidas</Link>
    </nav>
    <div className="mt-6 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
      {bloques.map(bloque => <Card key={bloque.titulo} className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{bloque.titulo}</h2>
          {bloque.resumen && <Link href={bloque.href} aria-label={`Abrir ${bloque.titulo}`} className="rounded-lg bg-slate-100 px-3 py-1 text-lg font-bold tabular-nums">{bloque.resumen.total}</Link>}
        </div>
        <p className="mt-1 text-xs text-slate-500">{bloque.descripcion}</p>
        {bloque.resumen ? <>
          {bloque.resumen.total === 0 && <p className="mt-5 text-sm text-slate-500">No hay registros en este grupo.</p>}
          <ul className="mt-4 divide-y divide-slate-100">{bloque.resumen.elementos.map(item => <li key={item.id} className="py-3">
            <Link href={item.href} className="block rounded-md text-sm hover:bg-slate-50">
              <span className="font-medium text-sky-800 underline">{item.titulo}</span>
              <span className="mt-1 block text-xs text-slate-600">{item.detalle}</span>
            </Link>
          </li>)}</ul>
          {bloque.resumen.total > bloque.resumen.elementos.length && <p className="mt-3 text-xs text-slate-500">Mostrando {bloque.resumen.elementos.length} de {bloque.resumen.total}.</p>}
        </> : <p role="alert" className="mt-5 text-sm text-red-700">No pudimos cargar este grupo. Abrí la sección para volver a consultar.</p>}
        <Link href={bloque.href} className="mt-4 inline-block text-sm font-medium text-sky-700 underline">Abrir sección</Link>
      </Card>)}
    </div>
    <p className="mt-5 text-xs text-slate-500">Los saldos corresponden a cuotas creadas. El panel se actualiza al abrirlo; no se refresca automáticamente mientras permanece abierto.</p>
  </div>;
}
