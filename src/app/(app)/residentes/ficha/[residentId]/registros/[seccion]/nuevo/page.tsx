import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import { obtenerFormularioFamiliar } from "@/lib/familiares-datos";
import { obtenerEstadiaDeRegistro } from "@/lib/registros-residente-datos";
import {
  CONFIG_REGISTRO,
  esSeccionRegistro,
  rutaRegistros,
} from "@/lib/registros-residente";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { formatearFechaPago } from "@/lib/pagos";
import { FormularioRegistro } from "../formulario-registro";

export const metadata = { title: "Nuevo registro · geriatrIA" };
export default async function NuevoRegistroPage({
  params,
  searchParams,
}: {
  params: Promise<{ residentId: string; seccion: string }>;
  searchParams: Promise<{ ingreso?: string }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.write");
  const { residentId, seccion } = await params;
  if (!esSeccionRegistro(seccion)) notFound();
  const persona = await obtenerFormularioFamiliar(residentId);
  if (!persona) notFound();
  const ingreso =
    seccion === "pertenencias"
      ? await obtenerEstadiaDeRegistro(residentId, (await searchParams).ingreso ?? "")
      : null;
  if (seccion === "pertenencias" && !ingreso) notFound();
  const config = CONFIG_REGISTRO[seccion],
    hoy = hoyEnArgentina();
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={rutaRegistros(residentId, seccion)}
        className="text-sm text-sky-800 underline"
      >
        ← Volver al listado
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Agregar {config.singular}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {persona.residente.first_name} {persona.residente.last_name}. {config.descripcion}
      </p>
      {ingreso && (
        <p className="mt-2 text-sm">
          Estadía iniciada el {formatearFechaPago(ingreso.admitted_at)}.
        </p>
      )}
      <FormularioRegistro
        residenteId={residentId}
        seccion={seccion}
        registroId={randomUUID()}
        version={null}
        iniciales={{
          starts_on: hoy,
          received_on: hoy,
          quantity: "1",
          admission_id: ingreso?.id ?? "",
        }}
      />
    </div>
  );
}
