import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import { obtenerFormularioFamiliar } from "@/lib/familiares-datos";
import { FormularioFamiliar } from "../formulario-familiar";

export const metadata = { title: "Agregar contacto · geriatrIA" };

export default async function NuevoFamiliarPage({ params }: {
  params: Promise<{ residentId: string }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.write");
  const { residentId } = await params;
  const datos = await obtenerFormularioFamiliar(residentId);
  if (!datos) notFound();
  return <div className="mx-auto max-w-2xl">
    <Link href={`/residentes/ficha/${residentId}#familiares`}
      className="text-sm text-sky-800 underline">← Volver a la ficha</Link>
    <h1 className="mt-4 text-2xl font-bold">Agregar contacto</h1>
    <p className="mt-2 text-sm text-slate-600">
      Familiar o persona de referencia de {datos.residente.first_name} {datos.residente.last_name}.
      Se conserva entre sus estadías.
    </p>
    <FormularioFamiliar residenteId={residentId} contactoId={randomUUID()} contacto={null} />
  </div>;
}
