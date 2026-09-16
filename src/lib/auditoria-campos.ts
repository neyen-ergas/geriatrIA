import { ETIQUETAS_ESTADO, FRANJAS, MOMENTOS_LLAMADO } from "@/lib/admision";
import { MEDIOS_PAGO } from "@/lib/cargar-pagos";
import { ETIQUETAS_ROL } from "@/lib/permisos";
import { formatearMomentoAuditoria, type TablaAuditoria } from "@/lib/auditoria";

const CAMPOS: Record<string, string> = {
  nombre: "Nombre",
  telefono: "Teléfono",
  momento_llamado: "Momento del llamado",
  mensaje: "Mensaje",
  origen: "Origen",
  estado: "Estado",
  visita_fecha: "Día de visita",
  visita_franja: "Franja de visita",
  notas_internas: "Notas internas",
  first_name: "Nombre",
  last_name: "Apellido",
  dni: "DNI",
  birth_date: "Nacimiento",
  phone: "Teléfono",
  address: "Domicilio",
  notes: "Observaciones",
  resident_id: "Residente",
  relationship: "Parentesco",
  is_emergency_contact: "Contacto de emergencia",
  is_payment_responsible: "Responsable de pago",
  admitted_at: "Ingreso",
  room: "Habitación",
  monthly_fee: "Cuota mensual",
  currency: "Moneda",
  due_day: "Día de vencimiento",
  administrative_notes: "Observaciones administrativas",
  discharged_at: "Baja del residente",
  discharge_reason: "Motivo de baja",
  admission_id: "Estadía",
  period: "Período",
  due_date: "Vencimiento",
  amount_due: "Importe de cuota",
  cancelled_at: "Anulación de cuota",
  cancelled_reason: "Motivo de anulación",
  monthly_charge_id: "Cuota",
  paid_on: "Fecha de pago",
  amount: "Importe pagado",
  payment_method: "Medio de pago",
  reference: "Referencia",
  receipt_path: "Comprobante",
  voided_at: "Anulación de pago",
  voided_reason: "Motivo de anulación",
  email: "Correo",
  job_title: "Puesto",
  hired_at: "Alta laboral",
  title: "Título",
  document_type: "Tipo de documento",
  file_path: "Archivo",
  issued_on: "Fecha del documento",
  instructions: "Indicación",
  professional: "Profesional",
  starts_on: "Inicio de vigencia",
  ends_on: "Fin de vigencia",
  name: "Medicamento",
  dose: "Dosis y vía",
  frequency: "Frecuencia",
  schedule: "Horarios o pauta",
  category: "Categoría",
  details: "Detalle",
  description: "Descripción",
  quantity: "Cantidad",
  received_on: "Recepción",
  returned_on: "Devolución",
  archived_at: "Archivo",
  archived_reason: "Motivo del archivo",
  terminated_at: "Baja laboral",
  termination_reason: "Motivo de baja laboral",
  role: "Perfil",
  enabled: "Acceso habilitado",
  employee_id: "Empleado vinculado",
};
export const RELACIONES_AUDITORIA: Record<string, TablaAuditoria> = {
  resident_id: "residents",
  admission_id: "admissions",
  monthly_charge_id: "monthly_charges",
  employee_id: "employees",
};
const ENUMERACIONES: Record<string, Record<string, string>> = {
  estado: ETIQUETAS_ESTADO,
  visita_franja: FRANJAS,
  momento_llamado: MOMENTOS_LLAMADO,
  payment_method: MEDIOS_PAGO,
  role: ETIQUETAS_ROL,
  category: {
    diet: "Alimentación",
    allergy: "Alergia",
    mobility: "Movilidad",
    care: "Cuidados especiales",
  },
};

export function etiquetaCampoAuditoria(campo: string): string {
  return CAMPOS[campo] || campo;
}

export function formatearValorAuditoria(campo: string, valor: unknown): string {
  if (valor === undefined) return "No registrado";
  if (valor === null || valor === "") return "Vacío";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (typeof valor === "number")
    return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 10 }).format(valor);
  if (typeof valor !== "string") return JSON.stringify(valor) ?? "Valor no disponible";
  if (ENUMERACIONES[campo]?.[valor]) return ENUMERACIONES[campo][valor];
  if (
    [
      "visita_fecha",
      "birth_date",
      "admitted_at",
      "discharged_at",
      "period",
      "due_date",
      "paid_on",
      "hired_at",
      "terminated_at",
      "issued_on",
      "starts_on",
      "ends_on",
      "received_on",
      "returned_on",
    ].includes(campo) &&
    /^\d{4}-\d{2}-\d{2}$/.test(valor)
  )
    return valor.split("-").reverse().join("/");
  if (
    ["cancelled_at", "voided_at", "archived_at"].includes(campo) &&
    Number.isFinite(Date.parse(valor))
  )
    return formatearMomentoAuditoria(valor);
  return valor;
}
