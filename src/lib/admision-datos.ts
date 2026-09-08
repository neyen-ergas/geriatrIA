import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { ESTADOS, type Consulta, type Estado } from "@/lib/admision";
import { CONSULTAS_POR_PAGINA } from "@/lib/paginacion-admision";

// Una sola cadena literal: el tipado de `select()` de supabase-js la analiza en
// tiempo de compilación y no puede seguir una concatenación.
const COLUMNAS =
  "id, creado_en, actualizado_en, nombre, telefono, momento_llamado, mensaje, origen, estado, notas_internas, visita_fecha, visita_franja";

/** El id desempata consultas recibidas con la misma fecha. */
export async function listarConsultas(
  estado?: Estado,
  pagina = 1,
): Promise<Consulta[]> {
  if (!Number.isSafeInteger(pagina) || pagina < 1) {
    throw new Error("La página de consultas no es válida.");
  }
  const supabase = createAdminClient();
  const inicio = (pagina - 1) * CONSULTAS_POR_PAGINA;

  let consulta = supabase
    .from("consulta")
    .select(COLUMNAS)
    .order("creado_en", { ascending: false })
    .order("id", { ascending: false })
    .range(inicio, inicio + CONSULTAS_POR_PAGINA - 1);

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

  const conteo: Record<Estado, number> = {
    nuevo: 0,
    contactado: 0,
    visita_agendada: 0,
    ingreso: 0,
    descartada: 0,
  };

  // HEAD devuelve el total calculado en Postgres, sin descargar filas ni
  // depender del límite de 1.000 registros de la API.
  await Promise.all(ESTADOS.map(async (estado) => {
    const { count, error } = await supabase
      .from("consulta")
      .select("id", { count: "exact", head: true })
      .eq("estado", estado);
    if (error || count === null) {
      throw new Error("No se pudieron contar las consultas.");
    }
    conteo[estado] = count;
  }));

  return conteo;
}
