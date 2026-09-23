import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { requerirSesion } from "@/lib/auth";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { enlaceTurnos, etiquetaDiaSemana, semanaTurnos } from "@/lib/turnos";
import type { EmpleadoTurno, Turno } from "@/lib/turnos";
import { listarEmpleadosParaTurnos, listarTurnosSemana } from "@/lib/turnos-datos";
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

  let turnos: Turno[] = [];
  let empleados: EmpleadoTurno[] = [];
  let errorCarga: string | null = null;

  try {
    const [turnosData, empleadosData] = await Promise.all([
      listarTurnosSemana(semana.inicio, semana.fin),
      listarEmpleadosParaTurnos(),
    ]);
    turnos = turnosData;
    empleados = empleadosData;
  } catch {
    errorCarga = "No se pudieron cargar los turnos de la semana. Intentá nuevamente.";
  }

  const esAdmin = true;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Turnos del personal
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Planificación semanal de turnos, guardias, descansos y cobertura de ausencias.
          </p>
        </div>
      </div>

      {errorCarga ? (
        <Card className="border-rose-200/80 bg-rose-50/80 p-6 text-sm text-rose-800 shadow-2xs">
          <p className="font-bold text-rose-900">{errorCarga}</p>
          <p className="mt-1 text-xs text-rose-700">
            Ocurrió un problema de comunicación al consultar la base de datos.
          </p>
          <Link
            href={enlaceTurnos(semana.inicio)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-rose-800 transition-all active:scale-[0.98]"
          >
            Reintentar
          </Link>
        </Card>
      ) : (
        <>
          {/* Navegación semanal */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <nav
              aria-label="Navegación semanal de turnos"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-2xs text-xs font-semibold text-slate-700"
            >
              {semana.anterior && (
                <Link
                  href={enlaceTurnos(semana.anterior)}
                  className="rounded-xl px-3 py-1.5 text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-all"
                >
                  ← Semana anterior
                </Link>
              )}
              <Link
                href="/turnos"
                className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-white shadow-2xs"
              >
                Esta semana
              </Link>
              {semana.siguiente && (
                <Link
                  href={enlaceTurnos(semana.siguiente)}
                  className="rounded-xl px-3 py-1.5 text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-all"
                >
                  Semana siguiente →
                </Link>
              )}
            </nav>

            <form
              action="/turnos"
              method="get"
              className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 p-1.5 shadow-2xs"
            >
              <label className="text-xs font-semibold text-slate-600 pl-2">
                Semana:
                <input
                  key={semana.inicio}
                  type="date"
                  name="semana"
                  required
                  defaultValue={semana.inicio}
                  className="ml-2 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                />
              </label>
              <button
                type="submit"
                className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
              >
                Ir
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <p>
              Semana del{" "}
              <span className="font-bold text-slate-800">
                {etiquetaDiaSemana(semana.inicio)}
              </span>{" "}
              al{" "}
              <span className="font-bold text-slate-800">
                {etiquetaDiaSemana(semana.fin)}
              </span>
            </p>
            <span className="font-semibold text-slate-700 tabular-nums">
              {turnos.length}{" "}
              {turnos.length === 1 ? "turno programado" : "turnos programados"}
            </span>
          </div>

          {/* Grilla interactiva de turnos */}
          <GrillaTurnos
            semana={semana}
            turnos={turnos}
            empleados={empleados}
            hoy={hoy}
            esAdmin={esAdmin}
          />

          <p className="mt-5 text-xs text-slate-500">
            La base de datos impide turnos superpuestos para un mismo empleado en la misma
            fecha y franja. Cancelar un turno libera el horario conservando el registro
            histórico.
          </p>
        </>
      )}
    </div>
  );
}
