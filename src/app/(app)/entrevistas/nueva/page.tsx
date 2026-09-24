import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { requerirSesion } from "@/lib/auth";
import {
  listarConsultasParaEntrevista,
  listarEntrevistadores,
} from "@/lib/entrevistas-datos";
import { FormularioEntrevista } from "../formulario-entrevista";

export const metadata: Metadata = {
  title: "Nueva Entrevista de Admisión · geriatrIA",
};

interface NuevaEntrevistaPageProps {
  searchParams: Promise<{
    consulta_id?: string | string[];
  }>;
}

export default async function NuevaEntrevistaPage({
  searchParams,
}: NuevaEntrevistaPageProps): Promise<React.ReactElement> {
  await requerirSesion("administration");
  const params = await searchParams;

  const preselectedConsultaId =
    typeof params.consulta_id === "string" ? params.consulta_id : undefined;

  const [consultas, entrevistadores] = await Promise.all([
    listarConsultasParaEntrevista(),
    listarEntrevistadores(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/entrevistas"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900"
        >
          ← Volver a entrevistas
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Nueva Entrevista de Admisión
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Evaluación interdisciplinaria inicial, autonomía, cognición y dictamen de
          aptitud residencial.
        </p>
      </div>

      <FormularioEntrevista
        idSolicitud={randomUUID()}
        consultas={consultas}
        entrevistadores={entrevistadores}
        preselectedConsultaId={preselectedConsultaId}
      />
    </div>
  );
}
