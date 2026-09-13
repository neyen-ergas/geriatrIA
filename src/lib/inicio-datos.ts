import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { FRANJAS, esFranja } from "@/lib/admision";
import { enlaceAgenda, semanaAgenda } from "@/lib/agenda";
import { esFechaValida } from "@/lib/primer-ingreso";
import { formatearFechaPago, formatearImporte } from "@/lib/pagos";

const ELEMENTOS_POR_BLOQUE = 5;
const DIAS_INGRESOS_RECIENTES = 7;
export type ElementoInicio = { id: string; titulo: string; detalle: string; href: string };
type Resumen = { total: number; elementos: ElementoInicio[] };
export type BloqueInicio = { titulo: string; descripcion: string; href: string; resumen: Resumen | null };

export async function obtenerInicio(hoy: string): Promise<BloqueInicio[]> {
  if (!esFechaValida(hoy)) throw new Error("La fecha de Inicio no es válida.");
  const manana = desplazarFecha(hoy, 1);
  const desde = desplazarFecha(hoy, 1 - DIAS_INGRESOS_RECIENTES);
  const bloques = [
    { titulo: "Consultas sin llamar", descripcion: "Las más antiguas primero", href: "/admision?estado=nuevo", cargar: sinLlamar },
    { titulo: "Visitas de hoy", descripcion: formatearFechaPago(hoy), href: enlaceAgenda(semanaAgenda(hoy, hoy).inicio), cargar: () => visitasDia(hoy) },
    { titulo: "Visitas de mañana", descripcion: formatearFechaPago(manana), href: enlaceAgenda(semanaAgenda(manana, manana).inicio), cargar: () => visitasDia(manana) },
    { titulo: "Cuotas vencidas", descripcion: "Con saldo pendiente, de todos los meses", href: "/contabilidad/vencimientos?alcance=todas", cargar: cuotasVencidas },
    { titulo: "Ingresos recientes", descripcion: `Últimos ${DIAS_INGRESOS_RECIENTES} días, incluidos reingresos`, href: "/residentes", cargar: () => ingresosRecientes(desde, hoy) },
  ];
  const resultados = await Promise.allSettled(bloques.map(b => b.cargar()));
  return bloques.map(({ cargar: _cargar, ...bloque }, i) => {
    const resultado = resultados[i];
    return { ...bloque, resumen: resultado.status === "fulfilled" ? resultado.value : null };
  });
}

async function sinLlamar(): Promise<Resumen> {
  const { data, error, count } = await createAdminClient().from("consulta")
    .select("id, nombre, telefono", { count: "exact" }).eq("estado", "nuevo")
    .order("creado_en").order("id").limit(ELEMENTOS_POR_BLOQUE);
  if (error || !data || count === null) throw new Error("No se pudieron leer las consultas pendientes.");
  return { total: count, elementos: data.map(c => ({ id: c.id, titulo: c.nombre,
    detalle: c.telefono, href: `/admision/${c.id}` })) };
}

async function visitasDia(fecha: string): Promise<Resumen> {
  const { data, error, count } = await createAdminClient().from("consulta")
    .select("id, nombre, telefono, visita_franja", { count: "exact" })
    .eq("estado", "visita_agendada").eq("visita_fecha", fecha)
    .order("visita_franja").order("id").limit(ELEMENTOS_POR_BLOQUE);
  if (error || !data || count === null) throw new Error("No se pudieron leer las visitas.");
  return { total: count, elementos: data.map(c => {
    if (!esFranja(c.visita_franja)) throw new Error("La franja no es válida.");
    return { id: c.id, titulo: c.nombre, detalle: `${FRANJAS[c.visita_franja]} · ${c.telefono}`,
      href: `/admision/${c.id}?semana=${semanaAgenda(fecha, fecha).inicio}` };
  }) };
}

async function cuotasVencidas(): Promise<Resumen> {
  const supabase = await createClient();
  const { data, error, count } = await supabase.from("monthly_charge_balances")
    .select("id, admission_id, due_date, balance, currency, admissions!inner(residents!inner(first_name, last_name))", { count: "exact" })
    .eq("is_overdue", true).gt("balance", 0).is("cancelled_at", null)
    .order("due_date").order("id").limit(ELEMENTOS_POR_BLOQUE);
  if (error || !data || count === null) throw new Error("No se pudieron leer las cuotas vencidas.");
  return { total: count, elementos: data.map(c => {
    if (!c.id || !c.admission_id || !c.due_date || c.balance === null || !c.currency) throw new Error("La cuota no es válida.");
    const persona = c.admissions.residents;
    return { id: c.id, titulo: `${persona.last_name}, ${persona.first_name}`,
      detalle: `Venció ${formatearFechaPago(c.due_date)} · Saldo ${formatearImporte(c.balance, c.currency)}`,
      href: `/contabilidad/${c.admission_id}/cuotas/${c.id}` };
  }) };
}

async function ingresosRecientes(desde: string, hasta: string): Promise<Resumen> {
  const supabase = await createClient();
  const { data, error, count } = await supabase.from("admissions")
    .select("id, admitted_at, discharged_at, residents!inner(first_name, last_name)", { count: "exact" })
    .gte("admitted_at", desde).lte("admitted_at", hasta)
    .order("admitted_at", { ascending: false }).order("id", { ascending: false }).limit(ELEMENTOS_POR_BLOQUE);
  if (error || !data || count === null) throw new Error("No se pudieron leer los ingresos recientes.");
  return { total: count, elementos: data.map(c => ({ id: c.id,
    titulo: `${c.residents.last_name}, ${c.residents.first_name}`,
    detalle: `Ingreso ${formatearFechaPago(c.admitted_at)}${c.discharged_at ? " · Estadía finalizada" : ""}`,
    href: `/contabilidad/${c.id}` })) };
}

function desplazarFecha(fecha: string, dias: number): string {
  const resultado = new Date(`${fecha}T12:00:00Z`);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}
