import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
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
    <Link href={enlaceAgenda(semana.inicio)} className="text-sm text-sky-700">
      ← Volver a la agenda
    </Link>
  );
  if (fecha < hoyEnArgentina())
    return (
      <Card className="p-6">
        {volver}
        <p className="mt-4">Ese día ya pasó. Elegí otro turno.</p>
      </Card>
    );
  const ocupada = (await listarVisitasSemana(semana.inicio)).find(
    v => v.visita_fecha === fecha && v.visita_franja === franja,
  );
  if (ocupada)
    return (
      <Card className="p-6">
        {volver}
        <p className="mt-4">El turno ya está ocupado.</p>
        <Link
          href={`/admision/${ocupada.id}?semana=${semana.inicio}`}
          className="mt-3 block underline"
        >
          Ver la consulta agendada
        </Link>
      </Card>
    );
  const busqueda = busquedaConsultas(buscar);
  const { consultas, total, pagina } = await listarCandidatasVisita(
    busqueda,
    paginaParam,
  );
  const enlace = (numero: number) =>
    `/admision/agenda/reservar?${new URLSearchParams({ fecha, franja, buscar: busqueda, pagina: String(numero) })}`;
  return (
    <div className="mx-auto max-w-4xl">
      {volver}
      <h1 className="mt-4 text-2xl font-bold">Reservar visita</h1>
      <p className="mt-2 text-slate-600">
        {formatearDia(fecha)} · {FRANJAS[franja]}
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Elegí la familia con la que acordaste la visita. Se muestran consultas nuevas o
        contactadas que todavía no tienen turno.
      </p>
      <form action="/admision/agenda/reservar" className="my-5 flex flex-wrap gap-3">
        <input type="hidden" name="fecha" value={fecha} />
        <input type="hidden" name="franja" value={franja} />
        <label className="text-sm">
          Nombre o teléfono{" "}
          <input
            key={busqueda}
            name="buscar"
            maxLength={80}
            defaultValue={busqueda}
            className="rounded-lg border p-2"
          />
        </label>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
          Buscar
        </button>
      </form>
      {consultas.length === 0 && (
        <Card className="p-6">
          No hay familias disponibles con esta búsqueda.{" "}
          <Link href="/admision" className="underline">
            Revisar Admisión
          </Link>
        </Card>
      )}
      <div className="space-y-3">
        {consultas.map(consulta => (
          <Card
            key={`${consulta.id}-${consulta.actualizado_en}`}
            className="flex flex-wrap items-center justify-between gap-4 p-5"
          >
            <div>
              <h2 className="font-semibold">{consulta.nombre}</h2>
              <p className="text-sm text-slate-600">{consulta.telefono}</p>
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
