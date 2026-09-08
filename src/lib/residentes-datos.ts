import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import { REGISTROS_POR_PAGINA } from "@/lib/paginacion";

type DatosResidente = Pick<
  Tables<"residents">,
  "id" | "first_name" | "last_name" | "dni" | "birth_date"
>;

type ResidenteEditable = Pick<
  Tables<"residents">,
  | "id"
  | "first_name"
  | "last_name"
  | "dni"
  | "birth_date"
  | "phone"
  | "address"
  | "notes"
>;

type ContactoEditable = Pick<
  Tables<"family_contacts">,
  | "id"
  | "first_name"
  | "last_name"
  | "relationship"
  | "phone"
  | "is_emergency_contact"
  | "is_payment_responsible"
  | "notes"
>;

type IngresoEditable = Pick<
  Tables<"admissions">,
  | "id"
  | "resident_id"
  | "admitted_at"
  | "room"
  | "monthly_fee"
  | "due_day"
  | "administrative_notes"
>;

export type ResidenteActivo = {
  admissionId: string;
  admittedAt: string;
  room: string | null;
  resident: DatosResidente;
};

export type IngresoActivoParaBaja = ResidenteActivo;

export type ResidenteDadoDeBaja = {
  admissionId: string;
  admittedAt: string;
  canBeReadmitted: boolean;
  dischargedAt: string;
  dischargeReason: string | null;
  room: string | null;
  resident: DatosResidente;
};

export type ResidenteParaReingreso = {
  lastAdmission: {
    admittedAt: string;
    dischargedAt: string;
    dueDay: number;
    monthlyFee: number;
    room: string | null;
  };
  resident: DatosResidente;
};

export type IngresoActivoEditable = {
  admission: IngresoEditable;
  contact: ContactoEditable;
  resident: ResidenteEditable;
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

const COLUMNAS_BAJAS = `
  id,
  admitted_at,
  discharged_at,
  discharge_reason,
  room,
  residents!inner (
    id,
    first_name,
    last_name,
    dni,
    birth_date,
    activo:admissions!admissions_resident_id_fkey (id),
    ultima_baja:admissions!admissions_resident_id_fkey (id)
  )
`;

export async function contarEstadias(bajas: boolean): Promise<number> {
  const supabase = await createClient();
  const consulta = supabase.from("admissions").select("id", {
    count: "exact",
    head: true,
  });
  const { count, error } = await (bajas
    ? consulta.not("discharged_at", "is", null)
    : consulta.is("discharged_at", null));
  if (error || count === null) {
    throw new Error("No se pudieron contar las estadías.");
  }
  return count;
}

/** Residentes que actualmente tienen un ingreso sin fecha de baja. */
export async function listarResidentesActivos(
  pagina = 1,
): Promise<ResidenteActivo[]> {
  const supabase = await createClient();
  const inicio = inicioPagina(pagina);

  const { data, error } = await supabase
    .from("admissions")
    .select(COLUMNAS_RESIDENTES_ACTIVOS)
    .is("discharged_at", null)
    .order("residents(last_name)", { ascending: true })
    .order("residents(first_name)", { ascending: true })
    .order("id", { ascending: true })
    .range(inicio, inicio + REGISTROS_POR_PAGINA - 1);

  if (error) {
    throw new Error(`No se pudieron leer los residentes: ${error.message}`);
  }

  return (data ?? [])
    .map((admission) => ({
      admissionId: admission.id,
      admittedAt: admission.admitted_at,
      room: admission.room,
      resident: admission.residents,
    }));
}

/** Ingresos finalizados, del más reciente al más antiguo. */
export async function listarResidentesDadosDeBaja(pagina = 1): Promise<
  ResidenteDadoDeBaja[]
> {
  const supabase = await createClient();
  const inicio = inicioPagina(pagina);
  // Cada relación se filtra y limita en Postgres para esa persona. No depende
  // de qué residentes o bajas entren en la página principal.
  const bajasResult = await supabase
    .from("admissions")
    .select(COLUMNAS_BAJAS)
    .not("discharged_at", "is", null)
    .order("discharged_at", { ascending: false })
    .order("admitted_at", { ascending: false })
    .order("id", { ascending: false })
    .is("residents.activo.discharged_at", null)
    .limit(1, { referencedTable: "residents.activo" })
    .not("residents.ultima_baja.discharged_at", "is", null)
    .order("discharged_at", {
      referencedTable: "residents.ultima_baja", ascending: false,
    })
    .order("admitted_at", {
      referencedTable: "residents.ultima_baja", ascending: false,
    })
    .order("id", {
      referencedTable: "residents.ultima_baja", ascending: false,
    })
    .limit(1, { referencedTable: "residents.ultima_baja" })
    .range(inicio, inicio + REGISTROS_POR_PAGINA - 1);

  if (bajasResult.error) {
    throw new Error(
      `No se pudieron leer las bajas: ${bajasResult.error.message}`,
    );
  }
  return (bajasResult.data ?? []).flatMap((admission) => {
    if (!admission.discharged_at) return [];

    const { activo, ultima_baja, ...resident } = admission.residents;

    return [
      {
        admissionId: admission.id,
        admittedAt: admission.admitted_at,
        canBeReadmitted:
          activo.length === 0 && ultima_baja[0]?.id === admission.id,
        dischargedAt: admission.discharged_at,
        dischargeReason: admission.discharge_reason,
        room: admission.room,
        resident,
      },
    ];
  });
}

/** Última estadía cerrada de una persona que todavía no volvió a ingresar. */
export async function obtenerResidenteParaReingreso(
  residentId: string,
): Promise<ResidenteParaReingreso | null> {
  const supabase = await createClient();
  const [activoResult, ultimaBajaResult] = await Promise.all([
    supabase
      .from("admissions")
      .select("id")
      .eq("resident_id", residentId)
      .is("discharged_at", null)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("admissions")
      .select(
        `
          admitted_at,
          discharged_at,
          due_day,
          monthly_fee,
          room,
          residents!inner (
            id,
            first_name,
            last_name,
            dni,
            birth_date
          )
        `,
      )
      .eq("resident_id", residentId)
      .not("discharged_at", "is", null)
      .order("discharged_at", { ascending: false })
      .order("admitted_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (activoResult.error) {
    throw new Error(`No se pudo comprobar el estado: ${activoResult.error.message}`);
  }
  if (ultimaBajaResult.error) {
    throw new Error(
      `No se pudo leer la última baja: ${ultimaBajaResult.error.message}`,
    );
  }

  const ultimaBaja = ultimaBajaResult.data;
  if (activoResult.data || !ultimaBaja?.discharged_at) return null;

  return {
    lastAdmission: {
      admittedAt: ultimaBaja.admitted_at,
      dischargedAt: ultimaBaja.discharged_at,
      dueDay: ultimaBaja.due_day,
      monthlyFee: ultimaBaja.monthly_fee,
      room: ultimaBaja.room,
    },
    resident: ultimaBaja.residents,
  };
}

function inicioPagina(pagina: number): number {
  const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
  if (pagina < 1 || !Number.isSafeInteger(pagina)
    || !Number.isSafeInteger(inicio + REGISTROS_POR_PAGINA - 1)) {
    throw new Error("La página de residentes no es válida.");
  }
  return inicio;
}

/** Datos mínimos para confirmar el cierre de un ingreso que sigue activo. */
export async function obtenerIngresoActivoParaBaja(
  admissionId: string,
): Promise<IngresoActivoParaBaja | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admissions")
    .select(COLUMNAS_RESIDENTES_ACTIVOS)
    .eq("id", admissionId)
    .is("discharged_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer el ingreso: ${error.message}`);
  }
  if (!data) return null;

  return {
    admissionId: data.id,
    admittedAt: data.admitted_at,
    room: data.room,
    resident: data.residents,
  };
}

/**
 * Datos del alta original que todavía pueden modificarse. El primer ingreso
 * crea un único contacto; por eso se toma el más antiguo. La futura gestión de
 * múltiples contactos tendrá su propia pantalla.
 */
export async function obtenerIngresoActivoParaEditar(
  admissionId: string,
): Promise<IngresoActivoEditable | null> {
  const supabase = await createClient();
  const { data: admission, error: admissionError } = await supabase
    .from("admissions")
    .select(
      "id, resident_id, admitted_at, room, monthly_fee, due_day, administrative_notes",
    )
    .eq("id", admissionId)
    .is("discharged_at", null)
    .maybeSingle();

  if (admissionError) {
    throw new Error(`No se pudo leer el ingreso: ${admissionError.message}`);
  }
  if (!admission) return null;

  const [residentResult, contactResult] = await Promise.all([
    supabase
      .from("residents")
      .select("id, first_name, last_name, dni, birth_date, phone, address, notes")
      .eq("id", admission.resident_id)
      .maybeSingle(),
    supabase
      .from("family_contacts")
      .select(
        "id, first_name, last_name, relationship, phone, is_emergency_contact, is_payment_responsible, notes",
      )
      .eq("resident_id", admission.resident_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (residentResult.error) {
    throw new Error(
      `No se pudo leer el residente: ${residentResult.error.message}`,
    );
  }
  if (contactResult.error) {
    throw new Error(
      `No se pudo leer el contacto: ${contactResult.error.message}`,
    );
  }
  if (!residentResult.data || !contactResult.data) return null;

  return {
    admission,
    resident: residentResult.data,
    contact: contactResult.data,
  };
}
