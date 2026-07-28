import { createClient } from "@/lib/supabase/server";
import { ResidenteForm } from "@/components/residente-form";
import { crearResidente } from "../actions";

export const dynamic = "force-dynamic";

export default async function NuevoResidentePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("habitacion")
    .select("id, numero")
    .order("numero");

  return (
    <ResidenteForm
      titulo="Nuevo residente"
      action={crearResidente}
      habitaciones={data ?? []}
    />
  );
}
