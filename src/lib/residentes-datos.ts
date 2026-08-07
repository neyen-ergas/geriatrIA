import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

type DatosResidente = Pick<
  Tables<"residents">,
  "id" | "first_name" | "last_name" | "dni" | "birth_date"
>;

export type ResidenteActivo = {
  admissionId: string;
  admittedAt: string;
  room: string | null;
  resident: DatosResidente;
};

// Supabase analiza esta cadena literal y deriva el resultado desde los tipos
// generados. `residents!inner` exige que cada ingreso tenga su persona asociada.
const COLUMNAS_RESIDENTES_ACTIVOS = `
  id,
  admitted_at,
  room,
  residents!inner (
    id,
    first_name,
    last_name,
    dni,
    birth_date
  )
`;

const ordenAlfabetico = new Intl.Collator("es-AR", {
  sensitivity: "base",
});

/** Residentes que actualmente tienen un ingreso sin fecha de baja. */
export async function listarResidentesActivos(): Promise<ResidenteActivo[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("admissions")
    .select(COLUMNAS_RESIDENTES_ACTIVOS)
    .is("discharged_at", null);

  if (error) {
    throw new Error(`No se pudieron leer los residentes: ${error.message}`);
  }

  return (data ?? [])
    .map((admission) => ({
      admissionId: admission.id,
      admittedAt: admission.admitted_at,
      room: admission.room,
      resident: admission.residents,
    }))
    .sort((a, b) => {
      const apellido = ordenAlfabetico.compare(
        a.resident.last_name,
        b.resident.last_name,
      );

      return apellido !== 0
        ? apellido
        : ordenAlfabetico.compare(
            a.resident.first_name,
            b.resident.first_name,
          );
    });
}
