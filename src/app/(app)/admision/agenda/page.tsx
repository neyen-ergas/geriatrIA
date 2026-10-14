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
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-piedra-500 transition-colors hover:text-piedra-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Admisión
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-piedra-950">Agenda de visitas</h1>
          <p className="mt-1 text-base text-piedra-700">
            Una visita por día y franja. Elegí un turno libre para reservarlo para una
            familia.
          </p>
        </div>
      </div>

      {/* Barra de Controles y Navegación */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-piedra-200/80 bg-white p-3">
        <nav
          aria-label="Navegación semanal"
          className="inline-flex items-center gap-1.5 rounded-md border border-piedra-200/80 bg-piedra-50/80 p-1 text-sm font-semibold text-piedra-700"
        >
          {semana.anterior && (
            <Link
              href={enlaceAgenda(semana.anterior)}
              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-piedra-600 transition-colors hover:bg-white hover:text-piedra-900"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Semana anterior
            </Link>
          )}
          <Link
            href="/admision/agenda"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-casona-700 px-3.5 py-1.5 text-white transition-colors"
          >
            Esta semana
          </Link>
          {semana.siguiente && (
            <Link
              href={enlaceAgenda(semana.siguiente)}
              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-piedra-600 transition-colors hover:bg-white hover:text-piedra-900"
            >
              Semana siguiente
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </nav>

        <form action="/admision/agenda" className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-piedra-600">
            <span className="hidden sm:inline">Semana del:</span>
            <input
              key={semana.inicio}
              type="date"
              name="semana"
              required
              defaultValue={semana.inicio}
              className="h-9 rounded-md border border-piedra-200 bg-white px-2.5 py-1 text-sm font-semibold text-piedra-800 outline-none transition-colors focus:border-casona-500 focus:ring-2 focus:ring-casona-500/20"
            />
          </label>
          <Button
            type="submit"
            size="sm"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-casona-700 px-3.5 text-sm font-semibold text-white hover:bg-casona-800"
          >
            Ver semana
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-piedra-200/60 pb-2">
        <p className="text-sm font-semibold text-piedra-500">
          <span className="capitalize">{etiquetaDiaAgenda(semana.inicio)}</span> al{" "}
          <span className="capitalize">{etiquetaDiaAgenda(semana.fin)}</span>
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-casona-50 px-2.5 py-1 text-sm font-bold text-casona-800 border border-casona-200/60">
          <Calendar className="h-3.5 w-3.5" />
          {visitas.length}{" "}
          {visitas.length === 1 ? "visita agendada" : "visitas agendadas"}
        </span>
      </div>

      <GrillaAgenda semana={semana} visitas={visitas} hoy={hoy} />

      <p className="mt-5 text-sm text-piedra-500">
        La disponibilidad puede cambiar mientras mirás la agenda. Las visitas cerradas o
        canceladas no ocupan un turno; esta vista no es un historial de visitas
        realizadas.
      </p>
    </div>
  );
}
