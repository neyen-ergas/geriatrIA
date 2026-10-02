import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CuotaSinCrear = {
  admissionId: string;
  nombre: string;
};

/** Cuotas del mes que deberían revisarse para estadías activas, sin emitir nada. */
export async function listarCuotasSinCrear(mes: string): Promise<CuotaSinCrear[]> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new Error("Mes inválido.");
  const cliente = await createClient();
  const [anio, numeroMes] = mes.split("-").map(Number);
  const mesSiguiente = new Date(Date.UTC(anio, numeroMes, 1)).toISOString().slice(0, 10);
  const estadias: Array<{
    id: string;
    residents: { first_name: string; last_name: string };
  }> = [];
  const tamano = 500;
  for (let inicio = 0; ; inicio += tamano) {
    const { data, error } = await cliente
      .from("admissions")
      .select("id,residents!inner(first_name,last_name)")
      .is("discharged_at", null)
      .lt("admitted_at", mesSiguiente)
      .gt("monthly_fee", 0)
      .order("id")
      .range(inicio, inicio + tamano - 1);
    if (error) throw new Error("No se pudieron consultar las estadías activas.");
    estadias.push(...(data ?? []));
    if (!data || data.length < tamano) break;
  }
  if (estadias.length === 0) return [];
  const conCuota = new Set<string>();
  for (let inicio = 0; inicio < estadias.length; inicio += 100) {
    const ids = estadias.slice(inicio, inicio + 100).map(estadia => estadia.id);
    const { data, error } = await cliente
      .from("monthly_charges")
      .select("admission_id")
      .in("admission_id", ids)
      .eq("period", `${mes}-01`)
      .is("cancelled_at", null);
    if (error) throw new Error("No se pudieron consultar las cuotas del mes.");
    for (const cuota of data ?? []) conCuota.add(cuota.admission_id);
  }
  return estadias
    .filter(estadia => !conCuota.has(estadia.id))
    .map(estadia => ({
      admissionId: estadia.id,
      nombre: `${estadia.residents.last_name}, ${estadia.residents.first_name}`,
    }));
}
