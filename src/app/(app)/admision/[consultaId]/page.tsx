import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requerirSesion } from "@/lib/auth";
import { obtenerConsulta } from "@/lib/admision-datos";
import { enlaceAgenda, semanaAgenda } from "@/lib/agenda";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { ConsultaCard } from "../consulta-card";

export const metadata: Metadata = { title: "Consulta de Admisión · geriatrIA" };

export default async function ConsultaPage({
  params,
  searchParams,
}: {
  params: Promise<{ consultaId: string }>;
  searchParams: Promise<{ semana?: string | string[]; creada?: string; paso?: string }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.read");
  const consulta = await obtenerConsulta((await params).consultaId);
  if (!consulta) notFound();
  const parametros = await searchParams;
  const semana = semanaAgenda(parametros.semana, hoyEnArgentina());
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Link
          href="/admision"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-piedra-500 transition-colors hover:text-piedra-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Admisión
        </Link>
        <Link
          href={enlaceAgenda(semana.inicio)}
          className="ml-4 text-sm font-semibold text-piedra-500 hover:text-piedra-900"
        >
          Ver agenda
        </Link>
      </div>
      <div>
        <h1 className="text-3xl font-bold text-piedra-950">Consulta de Admisión</h1>
      </div>
      {parametros.creada === "1" && (
        <div
          role="status"
          className="rounded-md border border-casona-200 bg-casona-50 p-4 text-sm text-casona-950"
        >
          <strong>Consulta registrada.</strong>{" "}
          {parametros.paso === "visita" ? (
            <a href={`#agendar-visita-${consulta.id}`} className="font-bold underline">
              Elegí el día y la franja de la visita.
            </a>
          ) : (
            <>
              Llamá a la familia desde el botón de teléfono y registrá lo conversado acá.
            </>
          )}
        </div>
      )}
      <ConsultaCard consulta={consulta} />
    </div>
  );
}
