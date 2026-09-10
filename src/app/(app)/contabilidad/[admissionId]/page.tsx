import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { listarCuotas, obtenerCuenta } from "@/lib/pagos-datos";
import { enlaceContabilidad, formatearFechaPago } from "@/lib/pagos";
import { TablaCuotas } from "./tabla-cuotas";

export const metadata: Metadata = { title: "Cuenta corriente · geriatrIA" };

export default async function CuentaPage({ params, searchParams }: {
  params: Promise<{ admissionId: string }>;
  searchParams: Promise<{ pagina?: string | string[] }>;
}): Promise<React.ReactElement> {
  await requerirSesion();
  const { admissionId } = await params;
  const cuenta = await obtenerCuenta(admissionId);
  if (!cuenta) notFound();
  const { cuotas, pagina, total } = await listarCuotas(
    admissionId, (await searchParams).pagina,
  );
  const ruta = `/contabilidad/${cuenta.id}`;
  return (
    <div>
      <Link href={enlaceContabilidad(1, cuenta.discharged_at !== null)}
        className="text-sm font-medium text-sky-700 hover:underline">
        ← Volver a Contabilidad
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Cuenta corriente</h1>
      <p className="mt-1 text-lg font-medium text-slate-800">
        {cuenta.residents.last_name}, {cuenta.residents.first_name}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        DNI {cuenta.residents.dni} · Ingreso {formatearFechaPago(cuenta.admitted_at)}
        {cuenta.discharged_at
          ? ` · Baja ${formatearFechaPago(cuenta.discharged_at)}` : " · Estadía activa"}
      </p>
      {cuotas.length === 0 ? (
        <Card className="mt-6 p-8 text-center">
          <h2 className="font-semibold text-slate-800">Todavía no hay cuotas registradas</h2>
          <p className="mt-2 text-sm text-slate-500">
            Esta cuenta mostrará las cuotas y los pagos correspondientes a esta estadía.
          </p>
        </Card>
      ) : <TablaCuotas cuotas={cuotas} />}
      <PaginacionListado pagina={pagina} total={total} etiqueta="cuotas"
        anterior={pagina > 2 ? `${ruta}?pagina=${pagina - 1}` : ruta}
        siguiente={`${ruta}?pagina=${pagina + 1}`} />
    </div>
  );
}
