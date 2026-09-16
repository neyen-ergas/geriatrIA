import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import { obtenerFormularioFamiliar } from "@/lib/familiares-datos";
import { FormularioFamiliar } from "../../formulario-familiar";

export const metadata = { title: "Editar contacto · geriatrIA" };

export default async function EditarFamiliarPage({
  params,
}: {
  params: Promise<{ residentId: string; contactId: string }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.write");
  const { residentId, contactId } = await params;
  const datos = await obtenerFormularioFamiliar(residentId, contactId);
  if (!datos?.contacto) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/residentes/ficha/${residentId}#familiares`}
        className="text-sm text-sky-800 underline"
      >
        ← Volver a la ficha
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Editar contacto</h1>
      <p className="mt-2 text-sm text-slate-600">
        Contacto de {datos.residente.first_name} {datos.residente.last_name}. Los cambios
        actualizan sus datos actuales y quedan en Auditoría.
      </p>
      <FormularioFamiliar
        residenteId={residentId}
        contactoId={contactId}
        contacto={datos.contacto}
      />
    </div>
  );
}
