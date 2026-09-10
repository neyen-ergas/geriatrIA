import "server-only";

import { createClient } from "@/lib/supabase/server";
import { esCuota, type Cuota } from "@/lib/pagos";
import { REGISTROS_POR_PAGINA, paginaListado } from "@/lib/paginacion";
import type { Tables } from "@/types/database";

export type Cuenta = Pick<Tables<"admissions">,
  "id" | "admitted_at" | "discharged_at"
> & { residents: Pick<Tables<"residents">, "first_name" | "last_name" | "dni"> };

const COLUMNAS_CUENTA = `
  id, admitted_at, discharged_at,
  residents!inner (first_name, last_name, dni)
`;
const COLUMNAS_CUOTA = `
  id, period, due_date, amount_due, paid_amount, balance,
  currency, payment_status, is_overdue, cancelled_reason
`;

export async function listarCuentas(
  bajas: boolean, paginaParam: unknown,
): Promise<{ cuentas: Cuenta[]; total: number; pagina: number }> {
  const supabase = await createClient();
  const conteo = supabase.from("admissions").select("id", {
    count: "exact", head: true,
  });
  const { count, error: errorConteo } = await (bajas
    ? conteo.not("discharged_at", "is", null)
    : conteo.is("discharged_at", null));
  if (errorConteo || count === null) {
    throw new Error("No se pudieron contar las cuentas.");
  }
  const pagina = paginaListado(paginaParam, count);
  const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
  const consulta = supabase.from("admissions").select(COLUMNAS_CUENTA);
  const { data, error } = await (bajas
    ? consulta.not("discharged_at", "is", null)
    : consulta.is("discharged_at", null))
    .order("residents(last_name)", { ascending: true })
    .order("residents(first_name)", { ascending: true })
    .order("admitted_at", { ascending: false })
    .order("id", { ascending: true })
    .range(inicio, inicio + REGISTROS_POR_PAGINA - 1);
  if (error) throw new Error("No se pudieron leer las cuentas.");
  return { cuentas: data ?? [], total: count, pagina };
}

export async function obtenerCuenta(admissionId: string): Promise<Cuenta | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    .test(admissionId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("admissions")
    .select(COLUMNAS_CUENTA).eq("id", admissionId).maybeSingle();
  if (error) throw new Error("No se pudo leer la cuenta.");
  return data;
}

export async function listarCuotas(
  admissionId: string, paginaParam: unknown,
): Promise<{ cuotas: Cuota[]; total: number; pagina: number }> {
  const supabase = await createClient();
  const { count, error: errorConteo } = await supabase
    .from("monthly_charge_balances")
    .select("id", { count: "exact", head: true })
    .eq("admission_id", admissionId);
  if (errorConteo || count === null) {
    throw new Error("No se pudieron contar las cuotas.");
  }
  const pagina = paginaListado(paginaParam, count);
  const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
  const { data, error } = await supabase.from("monthly_charge_balances")
    .select(COLUMNAS_CUOTA).eq("admission_id", admissionId)
    .order("period", { ascending: false }).order("id", { ascending: false })
    .range(inicio, inicio + REGISTROS_POR_PAGINA - 1);
  if (error) throw new Error("No se pudieron leer las cuotas.");
  const cuotas: Cuota[] = [];
  for (const cuota of data ?? []) {
    if (!esCuota(cuota)) throw new Error("No se pudo interpretar una cuota.");
    cuotas.push(cuota);
  }
  return { cuotas, total: count, pagina };
}
