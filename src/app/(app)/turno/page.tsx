import { createClient } from "@/lib/supabase/server";
import { rangoHoyAR } from "@/lib/fecha-ar";
import type { TomaTurno } from "@/lib/types";
import { TurnoLista } from "@/components/turno-lista";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  programada_para: string;
  estado: TomaTurno["estado"];
  motivo: string | null;
  residente: {
    id: string;
    nombre: string;
    apellido: string;
    habitacion: { numero: string } | null;
  } | null;
  prescripcion: {
    dosis: string;
    indicaciones: string | null;
    medicamento: { nombre: string } | null;
  } | null;
}

export default async function TurnoPage() {
  const supabase = await createClient();
  const { desde, hasta } = rangoHoyAR();

  const { data, error } = await supabase
    .from("administracion_medicamento")
    .select(
      `id, programada_para, estado, motivo,
       residente:residente_id ( id, nombre, apellido, habitacion:habitacion_id ( numero ) ),
       prescripcion:prescripcion_id ( dosis, indicaciones, medicamento:medicamento_id ( nombre ) )`,
    )
    .gte("programada_para", desde)
    .lt("programada_para", hasta)
    .order("programada_para", { ascending: true });

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        Error al cargar las tomas: {error.message}
      </p>
    );
  }

  const rows = (data ?? []) as unknown as Row[];
  const tomas: TomaTurno[] = rows.map((r) => ({
    id: r.id,
    programada_para: r.programada_para,
    estado: r.estado,
    motivo: r.motivo,
    residente: {
      id: r.residente?.id ?? "",
      nombre: r.residente?.nombre ?? "",
      apellido: r.residente?.apellido ?? "",
    },
    habitacion_numero: r.residente?.habitacion?.numero ?? null,
    medicamento_nombre: r.prescripcion?.medicamento?.nombre ?? "—",
    dosis: r.prescripcion?.dosis ?? "",
    indicaciones: r.prescripcion?.indicaciones ?? null,
  }));

  return <TurnoLista tomas={tomas} />;
}
