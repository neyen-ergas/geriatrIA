import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requerirSesion } from "@/lib/auth";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { registrarPrimerIngreso } from "./actions";
import { FormularioPrimerIngreso } from "./formulario-primer-ingreso";

export const metadata: Metadata = {
  title: "Nuevo ingreso · geriatrIA",
};

export default async function NuevoIngresoPage() {
  await requerirSesion("operational.write");
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/residentes"
        className="inline-flex items-center gap-2 text-sm font-medium text-piedra-500 hover:text-piedra-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a residentes
      </Link>

      <h1 className="mt-5 text-3xl font-bold text-piedra-950">
        Registrar primer ingreso
      </h1>
      <p className="mt-1 text-base text-piedra-700">
        Los campos marcados con * son obligatorios. Podrás completar la documentación y la
        información médica más adelante.
      </p>

      <FormularioPrimerIngreso
        hoy={hoyEnArgentina()}
        formAction={registrarPrimerIngreso}
      />
    </div>
  );
}
