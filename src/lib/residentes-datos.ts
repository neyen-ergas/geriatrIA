import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

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
  dischargedAt: string;
  dischargeReason: string | null;
  room: string | null;
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
    birth_date
  )
`;

const ordenAlfabetico = new Intl.Collator("es-AR", {
  sensitivity: "base",
});

/** Residentes que actualmente tienen un ingreso sin fecha de baja. */
export async function listarResidentesActivos(): Promise<ResidenteActivo[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("admissions")
    .select(COLUMNAS_RESIDENTES_ACTIVOS)
    .is("discharged_at", null);

  if (error) {
    throw new Error(`No se pudieron leer los residentes: ${error.message}`);
  }

  return (data ?? [])
    .map((admission) => ({
      admissionId: admission.id,
      admittedAt: admission.admitted_at,
      room: admission.room,
      resident: admission.residents,
    }))
    .sort((a, b) => {
      const apellido = ordenAlfabetico.compare(
        a.resident.last_name,
        b.resident.last_name,
      );

      return apellido !== 0
        ? apellido
        : ordenAlfabetico.compare(
            a.resident.first_name,
            b.resident.first_name,
          );
    });
}

/** Ingresos finalizados, del más reciente al más antiguo. */
export async function listarResidentesDadosDeBaja(): Promise<
  ResidenteDadoDeBaja[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admissions")
    .select(COLUMNAS_BAJAS)
    .not("discharged_at", "is", null)
    .order("discharged_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron leer las bajas: ${error.message}`);
  }

  return (data ?? []).flatMap((admission) =>
    admission.discharged_at
      ? [
          {
            admissionId: admission.id,
            admittedAt: admission.admitted_at,
            dischargedAt: admission.discharged_at,
            dischargeReason: admission.discharge_reason,
            room: admission.room,
            resident: admission.residents,
          },
        ]
      : [],
  );
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
