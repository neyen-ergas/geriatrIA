import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { obtenerIngresoActivoParaBaja } from "@/lib/residentes-datos";
import { darDeBajaResidente } from "./actions";
import { FormularioBaja } from "./formulario-baja";

export const metadata: Metadata = {
  title: "Dar de baja · geriatrIA",
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

export default async function BajaResidentePage({
  params,
}: {
  params: Promise<{ admissionId: string }>;
}) {
  const { admissionId } = await params;
  const ingreso = await obtenerIngresoActivoParaBaja(admissionId);

  if (!ingreso) notFound();

  const formAction = darDeBajaResidente.bind(null, {
    admissionId: ingreso.admissionId,
    admittedAt: ingreso.admittedAt,
  });
  const nombreCompleto = `${ingreso.resident.first_name} ${ingreso.resident.last_name}`;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/residentes"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a residentes
      </Link>

      <h1 className="mt-5 text-2xl font-bold text-slate-900">
        Dar de baja a {nombreCompleto}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Este proceso finaliza el ingreso actual sin eliminar la ficha ni su
        historial.
      </p>

      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-slate-900">{nombreCompleto}</div>
            <div className="mt-1 text-sm text-slate-500">
              DNI {ingreso.resident.dni} · Ingreso {formatearFecha(ingreso.admittedAt)}
            </div>
          </div>
          <Badge className="border-sky-200 bg-sky-50 text-sky-700">
            {ingreso.room || "Sin habitación"}
          </Badge>
        </div>
      </Card>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          Después de confirmar, el residente dejará de aparecer entre los
          activos y pasará al historial de bajas.
        </p>
      </div>

      <FormularioBaja formAction={formAction} hoy={hoyEnArgentina()} />
    </div>
  );
}
