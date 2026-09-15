import type { Metadata } from "next";
import Link from "next/link";
import { requerirSesion } from "@/lib/auth";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import {
  enlaceTurnos,
  etiquetaDiaSemana,
  semanaTurnos,
} from "@/lib/turnos";
import {
  listarEmpleadosParaTurnos,
  listarTurnosSemana,
} from "@/lib/turnos-datos";
import { GrillaTurnos } from "./grilla-turnos";

export const metadata: Metadata = {
  title: "Turnos · geriatrIA",
};

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string | string[] }>;
}): Promise<React.ReactElement> {
  await requerirSesion("administration");
  const params = await searchParams;
  const hoy = hoyEnArgentina();
  const semana = semanaTurnos(params.semana, hoy);

  const [turnos, empleados] = await Promise.all([
    listarTurnosSemana(semana.inicio, semana.fin),
    listarEmpleadosParaTurnos(),
  ]);

  const esAdmin = true;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Turnos del personal</h1>
          <p className="mt-1 text-sm text-slate-500">
            Planificación semanal de turnos, guardias, descansos y cobertura de ausencias.
          </p>
        </div>
      </div>

      {/* Navegación semanal */}
      <nav
        aria-label="Navegación semanal de turnos"
        className="mt-6 flex flex-wrap items-center gap-4 text-sm font-medium text-sky-800"
      >
        {semana.anterior && (
          <Link href={enlaceTurnos(semana.anterior)} className="hover:underline">
            ← Semana anterior
          </Link>
        )}
        <Link href="/turnos" className="hover:underline">
          Esta semana
        </Link>
        {semana.siguiente && (
          <Link href={enlaceTurnos(semana.siguiente)} className="hover:underline">
            Semana siguiente →
          </Link>
        )}
      </nav>

      <form action="/turnos" method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium text-slate-700">
          Ver semana del
          <input
            key={semana.inicio}
            type="date"
            name="semana"
            required
            defaultValue={semana.inicio}
            className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Ver semana
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Semana del <span className="font-semibold">{etiquetaDiaSemana(semana.inicio)}</span> al{" "}
        <span className="font-semibold">{etiquetaDiaSemana(semana.fin)}</span> ·{" "}
        {turnos.length} {turnos.length === 1 ? "turno programado" : "turnos programados"}
      </p>

      {/* Grilla interactiva de turnos */}
      <GrillaTurnos
        semana={semana}
        turnos={turnos}
        empleados={empleados}
        hoy={hoy}
        esAdmin={esAdmin}
      />

      <p className="mt-5 text-xs text-slate-500">
        La base de datos impide turnos superpuestos para un mismo empleado en la misma fecha y franja.
        Cancelar un turno libera el horario conservando el registro histórico.
      </p>
    </div>
  );
}
