import type { Metadata } from "next";
import Link from "next/link";
import { requerirSesion } from "@/lib/auth";
import { FormularioConsultaManual } from "./formulario-consulta-manual";

export const metadata: Metadata = { title: "Registrar consulta · geriatrIA" };

export default async function NuevaConsultaPage(): Promise<React.ReactElement> {
  await requerirSesion("operational.write");
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/admision" className="text-sm font-semibold text-emerald-800 underline">
        ← Volver a Admisión
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Registrar consulta</h1>
        <p className="mt-1 text-sm text-slate-600">
          Anotá una llamada o visita espontánea. Después podrás llamar, agendar una visita
          o programar una entrevista desde su ficha.
        </p>
      </div>
      <FormularioConsultaManual />
    </div>
  );
}
