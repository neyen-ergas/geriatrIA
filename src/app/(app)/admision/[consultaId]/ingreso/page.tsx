import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { requerirSesion } from "@/lib/auth";
import {
  obtenerConsultaConversion,
  listarVinculosConsultas,
} from "@/lib/conversion-consulta-datos";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { obtenerResidenteParaReingreso } from "@/lib/residentes-datos";
import { FormularioPrimerIngreso } from "@/app/(app)/residentes/nuevo/formulario-primer-ingreso";
import { FormularioReingreso } from "@/app/(app)/residentes/reingreso/[residentId]/formulario-reingreso";
import { convertirPersonaNueva, convertirReingreso } from "./actions";
import { BuscarPersona } from "./buscar-persona";

export default async function IngresoConsultaPage({
  params,
  searchParams,
}: {
  params: Promise<{ consultaId: string }>;
  searchParams: Promise<{ residente?: string }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.write");
  const { consultaId } = await params;
  const consulta = await obtenerConsultaConversion(consultaId);
  if (!consulta) notFound();
  const vinculo = (await listarVinculosConsultas([consultaId]))[consultaId];
  if (vinculo)
    return (
      <Card className="p-6">
        <h1 className="text-xl font-semibold">
          Esta consulta ya tiene un ingreso registrado
        </h1>
        <Link
          href={`/contabilidad/${vinculo}`}
          className="mt-4 inline-block text-sky-700"
        >
          Ver cuenta de la estadía
        </Link>
      </Card>
    );
  if (!["visita_agendada", "ingreso"].includes(consulta.estado))
    return (
      <Card className="p-6">
        <h1 className="font-semibold">
          La consulta no está disponible para registrar un ingreso
        </h1>
        <Link href="/admision" className="mt-4 inline-block text-sky-700">
          Volver a Admisión
        </Link>
      </Card>
    );
  const { residente: residentId } = await searchParams;
  if (residentId && !/^[0-9a-f-]{36}$/i.test(residentId)) notFound();
  const existente = residentId ? await obtenerResidenteParaReingreso(residentId) : null;
  const hoy = hoyEnArgentina();
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admision" className="text-sm font-medium text-sky-700">
        ← Volver a Admisión
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Registrar ingreso desde consulta
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Consulta de {consulta.nombre} · {consulta.telefono}
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Al confirmar, el ingreso quedará vinculado a esta consulta.
      </p>
      <BuscarPersona consultaId={consultaId} />
      {residentId ? (
        existente ? (
          <>
            <h2 className="mt-6 text-lg font-semibold">
              Reingreso: {existente.resident.first_name} {existente.resident.last_name}
            </h2>
            <FormularioReingreso
              hoy={hoy}
              ultimaBaja={existente.lastAdmission.dischargedAt}
              formAction={convertirReingreso.bind(
                null,
                consultaId,
                consulta.actualizado_en,
                residentId,
              )}
              valoresIniciales={{
                monthly_fee: String(existente.lastAdmission.monthlyFee),
                due_day: String(existente.lastAdmission.dueDay),
                room: existente.lastAdmission.room ?? "",
              }}
            />
          </>
        ) : (
          <Card className="mt-6 p-5">
            La persona tiene un ingreso activo o no hay una baja anterior disponible.
            <Link href="/residentes" className="mt-3 block text-sky-700">
              Revisar Residentes
            </Link>
          </Card>
        )
      ) : (
        <>
          <h2 className="mt-6 text-lg font-semibold">Persona nueva</h2>
          <p className="mt-1 text-sm text-slate-500">
            Revisá el nombre y apellido del contacto sugerido. Los datos del residente se
            completan por separado.
          </p>
          <FormularioPrimerIngreso
            hoy={hoy}
            formAction={convertirPersonaNueva.bind(
              null,
              consultaId,
              consulta.actualizado_en,
            )}
            valoresIniciales={{
              contact_first_name: consulta.nombre,
              contact_phone: consulta.telefono,
            }}
          />
        </>
      )}
      {residentId && (
        <Link
          href={`/admision/${consultaId}/ingreso`}
          className="mt-5 inline-block text-sky-700"
        >
          Registrar otra persona nueva
        </Link>
      )}
    </div>
  );
}
