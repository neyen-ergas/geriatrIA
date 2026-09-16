import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EmpleadoTurno, Turno } from "@/lib/turnos";

export async function listarTurnosSemana(inicio: string, fin: string): Promise<Turno[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shifts")
    .select(
      `
      id,
      employee_id,
      shift_date,
      shift_type,
      status,
      absence_reason,
      covered_by_employee_id,
      notes,
      created_at,
      updated_at,
      employee:employees!shifts_employee_id_fkey(first_name, last_name, job_title),
      covered_by:employees!shifts_covered_by_employee_id_fkey(first_name, last_name)
    `,
    )
    .gte("shift_date", inicio)
    .lte("shift_date", fin)
    .neq("status", "cancelled")
    .order("shift_date")
    .order("shift_type");

  if (error || !data) {
    throw new Error("No se pudieron cargar los turnos de la semana.");
  }

  return data as unknown as Turno[];
}

export async function listarEmpleadosParaTurnos(): Promise<EmpleadoTurno[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name, job_title, hired_at, terminated_at")
    .is("terminated_at", null)
    .order("last_name")
    .order("first_name");

  if (error || !data) {
    throw new Error("No se pudieron cargar los empleados para turnos.");
  }

  return data;
}
