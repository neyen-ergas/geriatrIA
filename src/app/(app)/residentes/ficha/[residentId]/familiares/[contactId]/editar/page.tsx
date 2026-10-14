import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/residentes/ficha/${residentId}#familiares`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-piedra-500 transition-colors hover:text-piedra-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a la ficha
        </Link>
      </div>
      <div>
        <h1 className="text-3xl font-bold text-piedra-950">Editar contacto</h1>
        <p className="mt-1 text-base text-piedra-700">
          Contacto de {datos.residente.first_name} {datos.residente.last_name}. Los
          cambios actualizan sus datos actuales y quedan en Auditoría.
        </p>
      </div>
      <FormularioFamiliar
        residenteId={residentId}
        contactoId={contactId}
        contacto={datos.contacto}
      />
    </div>
  );
}
