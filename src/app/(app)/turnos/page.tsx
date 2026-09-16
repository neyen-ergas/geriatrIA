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
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Turnos del personal</h1>
          <p className="mt-1 text-sm text-slate-500">
            Planificación semanal de turnos, guardias, descansos y cobertura de ausencias.
          </p>
        </div>
      </div>

      {errorCarga ? (
        <Card className="mt-6 border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          <p className="font-semibold">{errorCarga}</p>
          <p className="mt-1 text-rose-600">
            Ocurrió un problema de comunicación al consultar la base de datos.
          </p>
          <Link
            href={enlaceTurnos(semana.inicio)}
            className="mt-4 inline-block rounded-lg bg-rose-700 px-4 py-2 text-xs font-medium text-white hover:bg-rose-800"
          >
            Reintentar
          </Link>
        </Card>
      ) : (
        <>
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

          <form
            action="/turnos"
            method="get"
            className="mt-4 flex flex-wrap items-end gap-3"
          >
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
            Semana del{" "}
            <span className="font-semibold">{etiquetaDiaSemana(semana.inicio)}</span> al{" "}
            <span className="font-semibold">{etiquetaDiaSemana(semana.fin)}</span> ·{" "}
            {turnos.length}{" "}
            {turnos.length === 1 ? "turno programado" : "turnos programados"}
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
            La base de datos impide turnos superpuestos para un mismo empleado en la misma
            fecha y franja. Cancelar un turno libera el horario conservando el registro
            histórico.
          </p>
        </>
      )}
    </div>
  );
}
