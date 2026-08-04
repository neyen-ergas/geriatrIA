import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { esEstado, type Consulta, type Estado } from "@/lib/admision";

// Una sola cadena literal: el tipado de `select()` de supabase-js la analiza en
// tiempo de compilación y no puede seguir una concatenación.
const COLUMNAS =
  "id, creado_en, nombre, telefono, momento_llamado, mensaje, origen, estado, notas_internas, visita_fecha, visita_franja";

/** Consultas ordenadas de la más reciente a la más antigua. */
export async function listarConsultas(estado?: Estado): Promise<Consulta[]> {
  const supabase = createAdminClient();

  let consulta = supabase
    .from("consulta")
    .select(COLUMNAS)
    .order("creado_en", { ascending: false });

  if (estado) consulta = consulta.eq("estado", estado);

  const { data, error } = await consulta;
  if (error) {
    throw new Error(`No se pudieron leer las consultas: ${error.message}`);
  }

  return (data ?? []) as Consulta[];
}

/** Cuántas consultas hay en cada estado, para las tarjetas del encabezado. */
export async function contarPorEstado(): Promise<Record<Estado, number>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.from("consulta").select("estado");
  if (error) {
    throw new Error(`No se pudieron contar las consultas: ${error.message}`);
  }

  const conteo: Record<Estado, number> = {
    nuevo: 0,
    contactado: 0,
    visita_agendada: 0,
    ingreso: 0,
    descartada: 0,
  };

  for (const fila of data ?? []) {
    if (esEstado(fila.estado)) conteo[fila.estado] += 1;
  }

  return conteo;
}
