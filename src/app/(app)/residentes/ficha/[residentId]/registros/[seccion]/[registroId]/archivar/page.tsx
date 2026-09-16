import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { requerirSesion } from "@/lib/auth";
import { obtenerFormularioFamiliar } from "@/lib/familiares-datos";
import { obtenerRegistroResidente } from "@/lib/registros-residente-datos";
import {
  CONFIG_REGISTRO,
  esSeccionRegistro,
  rutaRegistros,
} from "@/lib/registros-residente";
import { FormularioRegistro } from "../../formulario-registro";
import { DetalleRegistro } from "../../detalle-registro";

export const metadata = { title: "Archivar registro · geriatrIA" };
export default async function ArchivarRegistroPage({
  params,
}: {
  params: Promise<{ residentId: string; seccion: string; registroId: string }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.write");
  const { residentId, seccion, registroId } = await params;
  if (!esSeccionRegistro(seccion)) notFound();
  const [registro, persona] = await Promise.all([
    obtenerRegistroResidente(residentId, seccion, registroId),
    obtenerFormularioFamiliar(residentId),
  ]);
  if (!registro || !persona) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={rutaRegistros(residentId, seccion)}
        className="text-sm text-sky-800 underline"
      >
        ← Volver al listado
      </Link>
      <h1 className="mt-4 text-2xl font-bold">
        Archivar {CONFIG_REGISTRO[seccion].singular}
      </h1>
      <p className="mt-2 break-words text-slate-700">
        {persona.residente.first_name} {persona.residente.last_name}
      </p>
      <p className="my-4 text-sm text-slate-600">
        El registro se conservará en Archivados, con el motivo, y quedará solo de
        consulta.
      </p>
      <Card className="p-5">
        <DetalleRegistro seccion={seccion} registro={registro} />
      </Card>
      {registro.archived_at ? (
        <p className="mt-4">Este registro ya está archivado.</p>
      ) : (
        <FormularioRegistro
          residenteId={residentId}
          seccion={seccion}
          registroId={registroId}
          version={registro.updated_at}
          iniciales={{}}
          archivar
        />
      )}
    </div>
  );
}
