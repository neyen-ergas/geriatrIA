import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResidenteForm } from "@/components/residente-form";
import { editarResidente, type ResultadoAccion } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarResidentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: residente }, { data: habitaciones }] = await Promise.all([
    supabase
      .from("residente")
      .select(
        "nombre, apellido, dni, fecha_nacimiento, sexo, habitacion_id, observaciones",
      )
      .eq("id", id)
      .single(),
    supabase.from("habitacion").select("id, numero").order("numero"),
  ]);

  if (!residente) notFound();

  const action = editarResidente.bind(null, id) as (
    prev: ResultadoAccion,
    fd: FormData,
  ) => Promise<ResultadoAccion>;

  return (
    <ResidenteForm
      titulo={`Editar residente`}
      action={action}
      habitaciones={habitaciones ?? []}
      inicial={residente}
    />
  );
}
