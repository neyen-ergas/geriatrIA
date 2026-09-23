import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { requerirSesion } from "@/lib/auth";
import {
  COLORES_CONCLUSION,
  COLORES_ESTADO_ENTREVISTA,
  ETIQUETAS_CONCLUSION,
  ETIQUETAS_ESTADO_ENTREVISTA,
  type EstadoEntrevista,
  type ConclusionEntrevista,
} from "@/lib/entrevistas";
import {
  listarConsultasParaEntrevista,
  listarEntrevistadores,
  obtenerEntrevistaPorId,
} from "@/lib/entrevistas-datos";
import { FormularioEntrevista } from "../formulario-entrevista";
import { AccionesRapidasEntrevista } from "./acciones-rapidas";

export const metadata: Metadata = {
  title: "Detalle de Entrevista · geriatrIA",
};

interface EntrevistaDetallePageProps {
  params: Promise<{
    entrevistaId: string;
  }>;
}

export default async function EntrevistaDetallePage({
  params,
}: EntrevistaDetallePageProps): Promise<React.ReactElement> {
  await requerirSesion("administration");
  const { entrevistaId } = await params;

  const [entrevista, consultas, entrevistadores] = await Promise.all([
    obtenerEntrevistaPorId(entrevistaId),
    listarConsultasParaEntrevista(),
    listarEntrevistadores(),
  ]);

  if (!entrevista) {
    notFound();
  }

  const estado = entrevista.status as EstadoEntrevista;
  const conclusion = entrevista.conclusion as ConclusionEntrevista;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/entrevistas"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900"
          >
            ← Volver a entrevistas
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {entrevista.candidate_name}
            </h1>
            <Badge className={COLORES_ESTADO_ENTREVISTA[estado]?.badge || ""}>
              {ETIQUETAS_ESTADO_ENTREVISTA[estado] || estado}
            </Badge>
            <Badge className={COLORES_CONCLUSION[conclusion]?.badge || ""}>
              {ETIQUETAS_CONCLUSION[conclusion] || conclusion}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Fecha de entrevista:{" "}
            <span className="font-medium text-slate-700">
              {entrevista.interview_date}
            </span>
            {entrevista.interviewer && (
              <>
                {" · "}
                Profesional:{" "}
                <span className="font-medium text-slate-700">
                  {entrevista.interviewer.last_name}, {entrevista.interviewer.first_name}
                </span>
              </>
            )}
          </p>
        </div>

        <AccionesRapidasEntrevista
          id={entrevista.id}
          estado={estado}
          version={entrevista.updated_at}
        />
      </div>

      <FormularioEntrevista
        entrevista={entrevista}
        consultas={consultas}
        entrevistadores={entrevistadores}
      />
    </div>
  );
}
