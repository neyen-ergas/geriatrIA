import type { Metadata } from "next";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Search,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { requerirSesion } from "@/lib/auth";
import {
  calcularKpisEntrevistas,
  COLORES_COGNITIVA,
  COLORES_CONCLUSION,
  COLORES_ESTADO_ENTREVISTA,
  COLORES_MOVILIDAD,
  ETIQUETAS_COGNITIVA,
  ETIQUETAS_CONCLUSION,
  ETIQUETAS_ESTADO_ENTREVISTA,
  ETIQUETAS_MOVILIDAD,
  type ConclusionEntrevista,
  type Entrevista,
  type EstadoEntrevista,
  type EvaluacionCognitiva,
  type EvaluacionMovilidad,
} from "@/lib/entrevistas";
import { listarEntrevistas } from "@/lib/entrevistas-datos";

export const metadata: Metadata = {
  title: "Entrevistas de Admisión · geriatrIA",
};

interface EntrevistasPageProps {
  searchParams: Promise<{
    estado?: string | string[];
    conclusion?: string | string[];
    busqueda?: string | string[];
  }>;
}

export default async function EntrevistasPage({
  searchParams,
}: EntrevistasPageProps): Promise<React.ReactElement> {
  await requerirSesion("administration");
  const params = await searchParams;

  const estadoFiltro =
    typeof params.estado === "string" ? (params.estado as EstadoEntrevista) : undefined;
  const conclusionFiltro =
    typeof params.conclusion === "string"
      ? (params.conclusion as ConclusionEntrevista)
      : undefined;
  const busquedaFiltro =
    typeof params.busqueda === "string" ? params.busqueda : undefined;

  let entrevistas: Entrevista[] = [];
  let errorCarga: string | null = null;

  try {
    entrevistas = await listarEntrevistas({
      estado: estadoFiltro,
      conclusion: conclusionFiltro,
      busqueda: busquedaFiltro,
    });
  } catch {
    errorCarga =
      "No se pudieron cargar las entrevistas de admisión. Verifique la conexión a la base de datos.";
  }

  const kpis = calcularKpisEntrevistas(entrevistas);

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Entrevistas de Admisión</h1>
          <p className="mt-1 text-sm text-slate-500">
            Evaluaciones interdisciplinarias para valorar autonomía, cognición y perfil
            asistencial de postulantes.
          </p>
        </div>
        <div>
          <Link href="/entrevistas/nueva">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Nueva Entrevista
            </Button>
          </Link>
        </div>
      </div>

      {/* Manejo defensivo de error */}
      {errorCarga ? (
        <Card className="border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          <p className="font-semibold">{errorCarga}</p>
          <p className="mt-1 text-rose-600">
            Ocurrió un error al comunicarse con el servidor.
          </p>
          <div className="mt-4">
            <Link href="/entrevistas">
              <Button variant="outline" size="md">
                Reintentar carga
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Banner de KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Users className="h-4 w-4 text-slate-400" />
                Total
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{kpis.total}</div>
              <div className="mt-1 text-xs text-slate-400">Entrevistas</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-sky-700">
                <Clock className="h-4 w-4 text-sky-500" />
                Programadas
              </div>
              <div className="mt-2 text-2xl font-bold text-sky-900">
                {kpis.programadas}
              </div>
              <div className="mt-1 text-xs text-sky-600">Por realizar</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Realizadas
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-900">
                {kpis.completadas}
              </div>
              <div className="mt-1 text-xs text-emerald-600">Completadas</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-teal-700">
                <UserCheck className="h-4 w-4 text-teal-500" />
                Aptas
              </div>
              <div className="mt-2 text-2xl font-bold text-teal-900">{kpis.aptas}</div>
              <div className="mt-1 text-xs text-teal-600">Para ingreso</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-rose-700">
                <UserX className="h-4 w-4 text-rose-500" />
                No Aptas
              </div>
              <div className="mt-2 text-2xl font-bold text-rose-900">{kpis.noAptas}</div>
              <div className="mt-1 text-xs text-rose-600">Excede perfil</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
                <Calendar className="h-4 w-4 text-amber-500" />
                Pendientes
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-900">
                {kpis.pendientes}
              </div>
              <div className="mt-1 text-xs text-amber-600">En evaluación</div>
            </Card>
          </div>

          {/* Barra de Búsqueda y Filtros */}
          <Card className="p-4">
            <form
              method="get"
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  name="busqueda"
                  defaultValue={busquedaFiltro || ""}
                  placeholder="Buscar por nombre del postulante o familiar..."
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  name="estado"
                  defaultValue={estadoFiltro || "todas"}
                  aria-label="Filtrar por estado del encuentro"
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="todas">Todos los estados</option>
                  <option value="scheduled">Programadas</option>
                  <option value="completed">Realizadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>

                <select
                  name="conclusion"
                  defaultValue={conclusionFiltro || "todas"}
                  aria-label="Filtrar por dictamen de aptitud"
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="todas">Todos los dictámenes</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="apto">Apto</option>
                  <option value="apto_con_observaciones">Con observaciones</option>
                  <option value="no_apto">No apto</option>
                </select>

                <Button type="submit" variant="secondary" size="md">
                  <Filter className="h-4 w-4" />
                  Filtrar
                </Button>

                {(estadoFiltro || conclusionFiltro || busquedaFiltro) && (
                  <Link href="/entrevistas">
                    <Button type="button" variant="ghost" size="md">
                      Limpiar
                    </Button>
                  </Link>
                )}
              </div>
            </form>
          </Card>

          {/* Listado de Entrevistas */}
          {entrevistas.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-800">
                No se encontraron entrevistas
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {estadoFiltro || conclusionFiltro || busquedaFiltro
                  ? "No hay resultados para los filtros seleccionados."
                  : "Todavía no hay entrevistas de admisión registradas."}
              </p>
              <div className="mt-6">
                <Link href="/entrevistas/nueva">
                  <Button>
                    <Plus className="h-4 w-4" />
                    Programar primera entrevista
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {entrevistas.map(ent => {
                const estado = ent.status as EstadoEntrevista;
                const conclusion = ent.conclusion as ConclusionEntrevista;
                const movilidad = ent.mobility_assessment as EvaluacionMovilidad | null;
                const cognitiva = ent.cognitive_assessment as EvaluacionCognitiva | null;

                return (
                  <Card key={ent.id} className="p-5 transition-shadow hover:shadow-md">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/entrevistas/${ent.id}`}
                            className="text-lg font-bold text-slate-900 hover:text-blue-600 hover:underline"
                          >
                            {ent.candidate_name}
                          </Link>
                          {ent.candidate_dni && (
                            <span className="text-xs text-slate-400">
                              DNI {ent.candidate_dni}
                            </span>
                          )}
                          <Badge
                            className={COLORES_ESTADO_ENTREVISTA[estado]?.badge || ""}
                          >
                            {ETIQUETAS_ESTADO_ENTREVISTA[estado] || estado}
                          </Badge>
                          <Badge className={COLORES_CONCLUSION[conclusion]?.badge || ""}>
                            {ETIQUETAS_CONCLUSION[conclusion] || conclusion}
                          </Badge>
                        </div>

                        {/* Evaluaciones de Movilidad y Cognición */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          {movilidad ? (
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 ${COLORES_MOVILIDAD[movilidad]}`}
                            >
                              Movilidad: {ETIQUETAS_MOVILIDAD[movilidad]}
                            </span>
                          ) : (
                            <span className="text-slate-400">Movilidad no evaluada</span>
                          )}

                          {cognitiva ? (
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 ${COLORES_COGNITIVA[cognitiva]}`}
                            >
                              Cognición: {ETIQUETAS_COGNITIVA[cognitiva]}
                            </span>
                          ) : (
                            <span className="text-slate-400">Cognición no evaluada</span>
                          )}
                        </div>

                        {/* Datos de contacto y acompañante */}
                        <div className="text-xs text-slate-500">
                          {ent.companion_name && (
                            <span>
                              Acompañante:{" "}
                              <strong className="text-slate-700">
                                {ent.companion_name}
                              </strong>
                              {ent.companion_relationship &&
                                ` (${ent.companion_relationship})`}
                              {ent.companion_phone && ` · Tel: ${ent.companion_phone}`}
                            </span>
                          )}
                          {ent.interviewer && (
                            <span className="block mt-0.5 sm:inline sm:mt-0 sm:ml-2">
                              · Profesional:{" "}
                              <strong className="text-slate-700">
                                {ent.interviewer.last_name}, {ent.interviewer.first_name}
                              </strong>
                              {ent.interviewer.job_title && (
                                <span className="text-slate-400">
                                  {" "}
                                  ({ent.interviewer.job_title})
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Motivo de rechazo asistencial si es no apto */}
                        {conclusion === "no_apto" && ent.rejection_reason && (
                          <div className="mt-2 rounded-md border border-rose-200 bg-rose-50/70 p-2.5 text-xs text-rose-800">
                            <strong>Motivo no apto:</strong> {ent.rejection_reason}
                          </div>
                        )}
                      </div>

                      {/* Fecha y Link de acción */}
                      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{ent.interview_date}</span>
                        </div>
                        <Link href={`/entrevistas/${ent.id}`}>
                          <Button variant="outline" size="md">
                            Ver evaluación →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
