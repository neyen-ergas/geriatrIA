import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { requerirSesion } from "@/lib/auth";
import { Badge, Card } from "@/components/ui";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { obtenerResidenteParaReingreso } from "@/lib/residentes-datos";
import { reingresarResidente } from "./actions";
import { FormularioReingreso } from "./formulario-reingreso";

export const metadata: Metadata = {
  title: "Reingresar residente · geriatrIA",
};

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function formatearFecha(fecha: string): string {
  return formatoFecha.format(new Date(`${fecha}T00:00:00Z`));
}

export default async function ReingresoResidentePage({
  params,
}: {
  params: Promise<{ residentId: string }>;
}) {
  await requerirSesion("operational.write");
  const { residentId } = await params;
  const datos = await obtenerResidenteParaReingreso(residentId);

  if (!datos) notFound();

  const formAction = reingresarResidente.bind(null, datos.resident.id);
  const nombreCompleto = `${datos.resident.first_name} ${datos.resident.last_name}`;
  const hoy = hoyEnArgentina();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/residentes?estado=bajas"
        className="inline-flex items-center gap-2 text-sm font-medium text-piedra-500 hover:text-piedra-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al historial
      </Link>

      <h1 className="mt-5 text-3xl font-bold text-piedra-950">
        Reingresar a {nombreCompleto}
      </h1>
      <p className="mt-1 text-base text-piedra-700">
        Se creará una estadía nueva sobre la ficha que ya existe.
      </p>

      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-piedra-900">{nombreCompleto}</div>
            <div className="mt-1 text-sm text-piedra-500">DNI {datos.resident.dni}</div>
          </div>
          <Badge className="border-piedra-200 bg-piedra-50 text-piedra-700">
            <History className="h-3.5 w-3.5" />
            Última baja {formatearFecha(datos.lastAdmission.dischargedAt)}
          </Badge>
        </div>
        <p className="mt-4 text-sm text-piedra-600">
          Estadía anterior: {formatearFecha(datos.lastAdmission.admittedAt)} a{" "}
          {formatearFecha(datos.lastAdmission.dischargedAt)} · Habitación{" "}
          {datos.lastAdmission.room || "sin asignar"}.
        </p>
      </Card>

      <FormularioReingreso
        formAction={formAction}
        hoy={hoy}
        ultimaBaja={datos.lastAdmission.dischargedAt}
        valoresIniciales={{
          admitted_at: hoy,
          monthly_fee: String(datos.lastAdmission.monthlyFee),
          due_day: String(datos.lastAdmission.dueDay),
        }}
      />
    </div>
  );
}
