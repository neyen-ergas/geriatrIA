import type { Metadata } from "next";
import Link from "next/link";
import { requerirSesion } from "@/lib/auth";
import { enlaceAgenda, etiquetaDiaAgenda, semanaAgenda } from "@/lib/agenda";
import { listarVisitasSemana } from "@/lib/agenda-datos";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { GrillaAgenda } from "./grilla-agenda";

export const metadata: Metadata = { title: "Agenda de visitas · geriatrIA" };

export default async function AgendaPage({ searchParams }: {
  searchParams: Promise<{ semana?: string | string[] }>;
}): Promise<React.ReactElement> {
  await requerirSesion();
  const hoy = hoyEnArgentina();
  const semana = semanaAgenda((await searchParams).semana, hoy);
  const visitas = await listarVisitasSemana(semana.inicio);
  return (
    <div>
      <Link href="/admision" className="text-sm font-medium text-sky-700">← Volver a Admisión</Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Agenda de visitas</h1>
      <p className="mt-2 text-sm text-slate-600">Una visita por día y franja. Para reservar un turno libre, abrí la consulta de la familia en Admisión.</p>
      <nav aria-label="Navegación semanal" className="mt-5 flex flex-wrap items-center gap-4 text-sm font-medium text-sky-700">
        {semana.anterior && <Link href={enlaceAgenda(semana.anterior)}>← Semana anterior</Link>}
        <Link href="/admision/agenda">Esta semana</Link>
        {semana.siguiente && <Link href={enlaceAgenda(semana.siguiente)}>Semana siguiente →</Link>}
      </nav>
      <form action="/admision/agenda" className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-700">Ver semana del
          <input key={semana.inicio} type="date" name="semana" required defaultValue={semana.inicio}
            className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2" />
        </label>
        <button type="submit" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium">Ver semana</button>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        {etiquetaDiaAgenda(semana.inicio)} al {etiquetaDiaAgenda(semana.fin)} · {visitas.length} {visitas.length === 1 ? "visita agendada" : "visitas agendadas"}
      </p>
      <GrillaAgenda semana={semana} visitas={visitas} hoy={hoy} />
      <p className="mt-5 text-xs text-slate-500">La disponibilidad puede cambiar mientras mirás la agenda. Las visitas cerradas o canceladas no ocupan un turno; esta vista no es un historial de visitas realizadas.</p>
    </div>
  );
}
