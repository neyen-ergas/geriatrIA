import "server-only";

import { createClient } from "@/lib/supabase/server";
import { esCuota, type Cuota } from "@/lib/pagos";
import { paginaListado, REGISTROS_POR_PAGINA } from "@/lib/paginacion";
import { limitesMesVencimientos } from "@/lib/vencimientos";
import type { Tables } from "@/types/database";

export type Vencimiento = {
  cuota: Cuota;
  estadia: Pick<Tables<"admissions">, "id" | "admitted_at" | "discharged_at">;
  residente: Pick<Tables<"residents">, "first_name" | "last_name" | "dni">;
};

const COLUMNAS_VENCIMIENTO = `
  id, period, due_date, amount_due, paid_amount, balance, currency,
  payment_status, is_overdue, cancelled_reason,
  admissions!inner (
    id, admitted_at, discharged_at,
    residents!inner (first_name, last_name, dni)
  )
`;

export async function listarVencimientos(
  mes: string, vencidas: boolean, paginaParam: unknown,
): Promise<{ vencimientos: Vencimiento[]; total: number; pagina: number }> {
  const { inicio, fin } = limitesMesVencimientos(mes);
  const supabase = await createClient();
  const consulta = (conteo: boolean) => {
    const seleccion = supabase.from("monthly_charge_balances")
      .select(COLUMNAS_VENCIMIENTO, conteo ? { count: "exact", head: true } : {})
      .gte("due_date", inicio).lte("due_date", fin)
      .gt("balance", 0).is("cancelled_at", null);
    return vencidas ? seleccion.eq("is_overdue", true) : seleccion;
  };
  const { count, error: errorConteo } = await consulta(true);
  if (errorConteo || count === null) throw new Error("No se pudieron contar los vencimientos.");
  const pagina = paginaListado(paginaParam, count);
  const inicioPagina = (pagina - 1) * REGISTROS_POR_PAGINA;
  const { data, error } = await consulta(false)
    .order("due_date", { ascending: true }).order("id", { ascending: true })
    .range(inicioPagina, inicioPagina + REGISTROS_POR_PAGINA - 1);
  if (error) throw new Error("No se pudieron leer los vencimientos.");
  const vencimientos = (data ?? []).map(({ admissions, ...cuota }) => {
    if (!esCuota(cuota)) throw new Error("No se pudo interpretar un vencimiento.");
    const { residents: residente, ...estadia } = admissions;
    return { cuota, estadia, residente };
  });
  return { vencimientos, total: count, pagina };
}
