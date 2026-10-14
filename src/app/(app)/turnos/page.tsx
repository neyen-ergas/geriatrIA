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
          <h1 className="text-3xl font-bold text-piedra-950">Turnos del personal</h1>
          <p className="mt-1 text-base text-piedra-700">
            Planificación semanal de turnos, guardias, descansos y cobertura de ausencias.
          </p>
        </div>
      </div>

      {errorCarga ? (
        <Card className="border-oxido-200/80 bg-oxido-50/80 p-6 text-sm text-oxido-800">
          <p className="font-bold text-oxido-900">{errorCarga}</p>
          <p className="mt-1 text-sm text-oxido-700">
            Ocurrió un problema de comunicación al consultar la base de datos.
          </p>
          <Link
            href={enlaceTurnos(semana.inicio)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-oxido-700 px-4 py-2 text-sm font-semibold text-white hover:bg-oxido-800 transition-colors"
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
              className="inline-flex items-center gap-1.5 rounded-md border border-piedra-200/80 bg-white p-1.5 text-sm font-semibold text-piedra-700"
            >
              {semana.anterior && (
                <Link
                  href={enlaceTurnos(semana.anterior)}
                  className="rounded-md px-3 py-1.5 text-piedra-600 hover:bg-piedra-100/80 hover:text-piedra-900 transition-colors"
                >
                  ← Semana anterior
                </Link>
              )}
              <Link
                href="/turnos"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-casona-700 px-3.5 py-1.5 text-white"
              >
                Esta semana
              </Link>
              {semana.siguiente && (
                <Link
                  href={enlaceTurnos(semana.siguiente)}
                  className="rounded-md px-3 py-1.5 text-piedra-600 hover:bg-piedra-100/80 hover:text-piedra-900 transition-colors"
                >
                  Semana siguiente →
                </Link>
              )}
            </nav>

            <form
              action="/turnos"
              method="get"
              className="flex items-center gap-2 rounded-md border border-piedra-200/70 bg-white/70 p-1.5"
            >
              <label className="text-sm font-semibold text-piedra-600 pl-2">
                Semana:
                <input
                  key={semana.inicio}
                  type="date"
                  name="semana"
                  required
                  defaultValue={semana.inicio}
                  className="ml-2 rounded-md border border-piedra-200/90 bg-white px-3 py-1.5 text-sm text-piedra-900 focus:border-piedra-500 focus:outline-none focus:ring-2 focus:ring-piedra-200 transition-colors"
                />
              </label>
              <button
                type="submit"
                className="rounded-md border border-piedra-200/90 bg-white px-3.5 py-1.5 text-sm font-semibold text-piedra-800 hover:bg-piedra-50 hover:border-piedra-300 transition-colors"
              >
                Ir
              </button>
            </form>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-piedra-700">
            <p>
              Semana del{" "}
              <span className="font-bold text-piedra-800">
                {etiquetaDiaSemana(semana.inicio)}
              </span>{" "}
              al{" "}
              <span className="font-bold text-piedra-800">
                {etiquetaDiaSemana(semana.fin)}
              </span>
            </p>
            <span className="font-semibold text-piedra-700 tabular-nums">
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

          <p className="mt-5 text-sm text-piedra-500">
            La base de datos impide turnos superpuestos para un mismo empleado en la misma
            fecha y franja. Cancelar un turno libera el horario conservando el registro
            histórico.
          </p>
        </>
      )}
    </div>
  );
}
