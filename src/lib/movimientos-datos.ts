import "server-only";

import { createClient } from "@/lib/supabase/server";
import { paginaListado, REGISTROS_POR_PAGINA } from "@/lib/paginacion";
import type { Movimiento } from "@/lib/movimientos";

const COLUMNAS_MOVIMIENTO = `
  id, amount, paid_on, payment_method, reference, notes,
  created_at, voided_at, voided_reason, receipt_path
`;

/** La página verifica primero que la cuota pertenezca a la estadía solicitada. */
export async function listarMovimientos(
  cuotaId: string, paginaParam: unknown,
): Promise<{ movimientos: Movimiento[]; total: number; pagina: number }> {
  const supabase = await createClient();
  const { count, error: errorConteo } = await supabase.from("payments")
    .select("id", { count: "exact", head: true }).eq("monthly_charge_id", cuotaId);
  if (errorConteo || count === null) throw new Error("No se pudieron contar los pagos.");
  const pagina = paginaListado(paginaParam, count);
  const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
  const { data, error } = await supabase.from("payments")
    .select(COLUMNAS_MOVIMIENTO).eq("monthly_charge_id", cuotaId)
    .order("paid_on", { ascending: false })
    .order("created_at", { ascending: false }).order("id", { ascending: false })
    .range(inicio, inicio + REGISTROS_POR_PAGINA - 1);
  if (error) throw new Error("No se pudieron leer los pagos.");
  return { movimientos: data ?? [], total: count, pagina };
}

export async function obtenerMovimiento(
  cuotaId: string, pagoId: string,
): Promise<Movimiento | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    .test(pagoId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("payments")
    .select(COLUMNAS_MOVIMIENTO).eq("monthly_charge_id", cuotaId)
    .eq("id", pagoId).maybeSingle();
  if (error) throw new Error("No se pudo leer el pago.");
  return data;
}
