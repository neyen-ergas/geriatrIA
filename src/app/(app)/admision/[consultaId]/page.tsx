import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import { obtenerConsulta } from "@/lib/admision-datos";
import { enlaceAgenda, semanaAgenda } from "@/lib/agenda";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { ConsultaCard } from "../consulta-card";

export const metadata: Metadata = { title: "Consulta de Admisión · geriatrIA" };

export default async function ConsultaPage({ params, searchParams }: {
  params: Promise<{ consultaId: string }>;
  searchParams: Promise<{ semana?: string | string[] }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.read");
  const consulta = await obtenerConsulta((await params).consultaId);
  if (!consulta) notFound();
  const semana = semanaAgenda((await searchParams).semana, hoyEnArgentina());
  return (
    <div className="mx-auto max-w-4xl">
      <Link href={enlaceAgenda(semana.inicio)} className="text-sm font-medium text-sky-700">← Volver a la agenda</Link>
      <h1 className="my-5 text-2xl font-bold text-slate-900">Consulta de Admisión</h1>
      <ConsultaCard consulta={consulta} />
    </div>
  );
}
