import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Search } from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { FRANJAS, esFranja, formatearDia } from "@/lib/admision";
import { enlaceAgenda, semanaAgenda } from "@/lib/agenda";
import { listarVisitasSemana } from "@/lib/agenda-datos";
import { busquedaConsultas } from "@/lib/busqueda-consultas";
import { esFechaValida, hoyEnArgentina } from "@/lib/primer-ingreso";
import { listarCandidatasVisita } from "@/lib/reserva-visita-datos";
import { FormularioReserva } from "./formulario-reserva";

export const metadata: Metadata = { title: "Reservar visita · geriatrIA" };

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<{
    fecha?: string;
    franja?: string;
    buscar?: string;
    pagina?: string;
  }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.write");
  const { fecha, franja, buscar, pagina: paginaParam } = await searchParams;
  if (typeof fecha !== "string" || !esFechaValida(fecha) || !esFranja(franja)) notFound();
  const semana = semanaAgenda(fecha, hoyEnArgentina());
  if (!semana.dias.includes(fecha)) notFound();
  const volver = (
    <Link
      href={enlaceAgenda(semana.inicio)}
      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Volver a la agenda
    </Link>
  );
  if (fecha < hoyEnArgentina())
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        {volver}
        <Card className="border-amber-200/80 bg-amber-50/50 p-6">
          <p className="text-sm font-semibold text-amber-900">
            Ese día ya pasó. Elegí otro turno.
          </p>
        </Card>
      </div>
    );
  const ocupada = (await listarVisitasSemana(semana.inicio)).find(
    v => v.visita_fecha === fecha && v.visita_franja === franja,
  );
  if (ocupada)
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        {volver}
        <Card className="border-rose-200/80 bg-rose-50/50 p-6">
          <p className="text-sm font-semibold text-rose-900">El turno ya está ocupado.</p>
          <Link
            href={`/admision/${ocupada.id}?semana=${semana.inicio}`}
            className="mt-3 inline-flex items-center text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline"
          >
            Ver la consulta agendada →
          </Link>
        </Card>
      </div>
    );
  const busqueda = busquedaConsultas(buscar);
  const { consultas, total, pagina } = await listarCandidatasVisita(
    busqueda,
    paginaParam,
  );
  const enlace = (numero: number) =>
    `/admision/agenda/reservar?${new URLSearchParams({ fecha, franja, buscar: busqueda, pagina: String(numero) })}`;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>{volver}</div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              <Calendar className="h-3 w-3" />
              {formatearDia(fecha)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              <Clock className="h-3 w-3" />
              {FRANJAS[franja]}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Reservar visita
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Elegí la familia con la que acordaste la visita. Se muestran consultas nuevas
            o contactadas que todavía no tienen turno.
          </p>
        </div>
      </div>

      <Card className="p-4 shadow-2xs">
        <form
          action="/admision/agenda/reservar"
          className="flex flex-wrap items-center gap-3"
        >
          <input type="hidden" name="fecha" value={fecha} />
          <input type="hidden" name="franja" value={franja} />
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              key={busqueda}
              name="buscar"
              maxLength={80}
              defaultValue={busqueda}
              placeholder="Buscar por nombre o teléfono..."
              className="pl-9"
            />
          </div>
          <Button type="submit" size="sm" className="h-10 px-5 shadow-2xs">
            Buscar
          </Button>
        </form>
      </Card>

      {consultas.length === 0 && (
        <Card className="p-8 text-center text-sm text-slate-500 shadow-2xs">
          No hay familias disponibles con esta búsqueda.{" "}
          <Link
            href="/admision"
            className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
          >
            Revisar Admisión
          </Link>
        </Card>
      )}

      <div className="space-y-3">
        {consultas.map(consulta => (
          <Card
            key={`${consulta.id}-${consulta.actualizado_en}`}
            className="flex flex-wrap items-center justify-between gap-4 p-5 transition-all hover:shadow-xs"
          >
            <div>
              <h2 className="text-base font-bold text-slate-900">{consulta.nombre}</h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {consulta.telefono}
              </p>
            </div>
            <FormularioReserva consulta={consulta} fecha={fecha} franja={franja} />
          </Card>
        ))}
      </div>

      <PaginacionListado
        pagina={pagina}
        total={total}
        anterior={enlace(pagina - 1)}
        siguiente={enlace(pagina + 1)}
        etiqueta="familias"
      />
    </div>
  );
}
