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
  searchParams: Promise<{ semana?: string | string[] }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.read");
  const consulta = await obtenerConsulta((await params).consultaId);
  if (!consulta) notFound();
  const semana = semanaAgenda((await searchParams).semana, hoyEnArgentina());
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Link
          href={enlaceAgenda(semana.inicio)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a la agenda
        </Link>
      </div>
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
          Admisión
        </div>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Consulta de Admisión
        </h1>
      </div>
      <ConsultaCard consulta={consulta} />
    </div>
  );
}
