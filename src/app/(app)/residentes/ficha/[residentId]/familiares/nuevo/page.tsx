import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requerirSesion } from "@/lib/auth";
import { obtenerFormularioFamiliar } from "@/lib/familiares-datos";
import { FormularioFamiliar } from "../formulario-familiar";

export const metadata = { title: "Agregar contacto · geriatrIA" };

export default async function NuevoFamiliarPage({
  params,
}: {
  params: Promise<{ residentId: string }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.write");
  const { residentId } = await params;
  const datos = await obtenerFormularioFamiliar(residentId);
  if (!datos) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/residentes/ficha/${residentId}#familiares`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a la ficha
        </Link>
      </div>
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
          Red de Apoyo
        </div>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Agregar contacto
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Familiar o persona de referencia de {datos.residente.first_name}{" "}
          {datos.residente.last_name}. Se conserva entre sus estadías.
        </p>
      </div>
      <FormularioFamiliar
        residenteId={residentId}
        contactoId={randomUUID()}
        contacto={null}
      />
    </div>
  );
}
