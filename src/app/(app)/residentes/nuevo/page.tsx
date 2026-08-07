import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormularioPrimerIngreso } from "./formulario-primer-ingreso";

export const metadata: Metadata = {
  title: "Nuevo ingreso · geriatrIA",
};

function hoyEnArgentina(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

export default function NuevoIngresoPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/residentes"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a residentes
      </Link>

      <h1 className="mt-5 text-2xl font-bold text-slate-900">
        Registrar primer ingreso
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Los campos marcados con * son obligatorios. Podrás completar la
        documentación y la información médica más adelante.
      </p>

      <FormularioPrimerIngreso hoy={hoyEnArgentina()} />
    </div>
  );
}
