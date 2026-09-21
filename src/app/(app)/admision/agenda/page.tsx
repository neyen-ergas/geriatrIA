import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";
import { requerirSesion } from "@/lib/auth";
import { enlaceAgenda, etiquetaDiaAgenda, semanaAgenda } from "@/lib/agenda";
import { listarVisitasSemana } from "@/lib/agenda-datos";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { GrillaAgenda } from "./grilla-agenda";

export const metadata: Metadata = { title: "Agenda de visitas · geriatrIA" };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string | string[] }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.read");
  const hoy = hoyEnArgentina();
  const semana = semanaAgenda((await searchParams).semana, hoy);
  const visitas = await listarVisitasSemana(semana.inicio);
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admision"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Admisión
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Planificación de Visitas
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Agenda de visitas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Una visita por día y franja. Elegí un turno libre para reservarlo para una
            familia.
          </p>
        </div>
      </div>

      {/* Barra de Controles y Navegación */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-2xs backdrop-blur-xs">
        <nav
          aria-label="Navegación semanal"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1 text-xs font-semibold text-slate-700"
        >
          {semana.anterior && (
            <Link
              href={enlaceAgenda(semana.anterior)}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-2xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Semana anterior
            </Link>
          )}
          <Link
            href="/admision/agenda"
            className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-white shadow-2xs transition-all"
          >
            Esta semana
          </Link>
          {semana.siguiente && (
            <Link
              href={enlaceAgenda(semana.siguiente)}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-2xs"
            >
              Semana siguiente
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </nav>

        <form action="/admision/agenda" className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="hidden sm:inline">Semana del:</span>
            <input
              key={semana.inicio}
              type="date"
              name="semana"
              required
              defaultValue={semana.inicio}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <Button
            type="submit"
            size="sm"
            className="h-9 rounded-xl bg-slate-900 px-3.5 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800"
          >
            Ver semana
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span className="capitalize">{etiquetaDiaAgenda(semana.inicio)}</span> al{" "}
          <span className="capitalize">{etiquetaDiaAgenda(semana.fin)}</span>
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/60">
          <Calendar className="h-3.5 w-3.5" />
          {visitas.length} {visitas.length === 1 ? "visita agendada" : "visitas agendadas"}
        </span>
      </div>

      <GrillaAgenda semana={semana} visitas={visitas} hoy={hoy} />

      <p className="mt-5 text-xs text-slate-400">
        La disponibilidad puede cambiar mientras mirás la agenda. Las visitas cerradas o
        canceladas no ocupan un turno; esta vista no es un historial de visitas
        realizadas.
      </p>
    </div>
  );
}
