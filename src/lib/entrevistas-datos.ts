import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  ConsultaParaEntrevista,
  Entrevista,
  Entrevistador,
  EstadoEntrevista,
  ConclusionEntrevista,
} from "@/lib/entrevistas";

export type FiltrosEntrevistas = {
  estado?: EstadoEntrevista | "todas";
  conclusion?: ConclusionEntrevista | "todas";
  busqueda?: string;
};

export async function listarEntrevistas(
  filtros?: FiltrosEntrevistas,
): Promise<Entrevista[]> {
  const supabase = await createClient();

  let query = supabase
    .from("interviews")
    .select(
      `
      id,
      consultation_id,
      candidate_name,
      candidate_dni,
      candidate_birth_date,
      companion_name,
      companion_phone,
      companion_relationship,
      interview_date,
      interviewer_employee_id,
      status,
      mobility_assessment,
      cognitive_assessment,
      medical_notes,
      social_notes,
      conclusion,
      rejection_reason,
      created_at,
      updated_at,
      created_by,
      updated_by,
      consultation:consulta!interviews_consultation_id_fkey(id, nombre, telefono, mensaje),
      interviewer:employees!interviews_interviewer_employee_id_fkey(id, first_name, last_name, job_title)
    `,
    )
    .order("interview_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filtros?.estado && filtros.estado !== "todas") {
    query = query.eq("status", filtros.estado);
  }

  if (filtros?.conclusion && filtros.conclusion !== "todas") {
    query = query.eq("conclusion", filtros.conclusion);
  }

  if (filtros?.busqueda && filtros.busqueda.trim().length > 0) {
    const term = `%${filtros.busqueda.trim()}%`;
    query = query.or(`candidate_name.ilike.${term},companion_name.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error || !data) {
    throw new Error("No se pudieron cargar las entrevistas de admisión.");
  }

  return data as unknown as Entrevista[];
}

export async function obtenerEntrevistaPorId(id: string): Promise<Entrevista | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("interviews")
    .select(
      `
      id,
      consultation_id,
      candidate_name,
      candidate_dni,
      candidate_birth_date,
      companion_name,
      companion_phone,
      companion_relationship,
      interview_date,
      interviewer_employee_id,
      status,
      mobility_assessment,
      cognitive_assessment,
      medical_notes,
      social_notes,
      conclusion,
      rejection_reason,
      created_at,
      updated_at,
      created_by,
      updated_by,
      consultation:consulta!interviews_consultation_id_fkey(id, nombre, telefono, mensaje),
      interviewer:employees!interviews_interviewer_employee_id_fkey(id, first_name, last_name, job_title)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Error al obtener la entrevista de admisión.");
  }

  return (data as unknown as Entrevista) || null;
}

export async function listarConsultasParaEntrevista(): Promise<ConsultaParaEntrevista[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("consulta")
    .select("id, nombre, telefono, mensaje, estado, creado_en")
    .order("creado_en", { ascending: false })
    .limit(50);

  if (error || !data) {
    throw new Error("No se pudieron cargar las consultas de admisión.");
  }

  return data as ConsultaParaEntrevista[];
}

export async function listarEntrevistadores(): Promise<Entrevistador[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name, job_title")
    .is("terminated_at", null)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error || !data) {
    throw new Error("No se pudieron cargar los profesionales entrevistadores.");
  }

  return data as Entrevistador[];
}
