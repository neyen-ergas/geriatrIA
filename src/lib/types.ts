export type Rol = "owner" | "admin" | "enfermeria" | "cuidador";

export type EstadoAdministracion =
  | "pendiente"
  | "administrada"
  | "rechazada"
  | "omitida";

// Estado visual derivado que ve el cuidador en la pantalla del turno.
export type EstadoVisual =
  | "pendiente"
  | "a_tiempo"
  | "atrasada"
  | "vencida"
  | "administrada"
  | "rechazada"
  | "omitida";

export interface Perfil {
  id: string;
  organizacion_id: string;
  nombre: string;
  email: string;
}

export interface Residente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
  activo: boolean;
  habitacion_id: string | null;
  habitacion?: { numero: string } | null;
}

export interface TomaTurno {
  id: string;
  programada_para: string;
  estado: EstadoAdministracion;
  motivo: string | null;
  residente: { id: string; nombre: string; apellido: string };
  habitacion_numero: string | null;
  medicamento_nombre: string;
  dosis: string;
  indicaciones: string | null;
}
