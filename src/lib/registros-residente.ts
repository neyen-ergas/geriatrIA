import type { Tables } from "@/types/database";
import { esFechaValida } from "@/lib/primer-ingreso";

export const SECCIONES_REGISTRO = ["documentos", "indicaciones", "medicacion", "cuidados", "pertenencias"] as const;
export type SeccionRegistro = (typeof SECCIONES_REGISTRO)[number];
export type RegistroResidente = Tables<"resident_documents"> | Tables<"medical_indications">
  | Tables<"medications"> | Tables<"special_needs"> | Tables<"inventory_items">;
type Campo = {
  nombre: string; etiqueta: string;
  tipo?: "date" | "textarea" | "number" | "select" | "estadia";
  opcional?: boolean; opciones?: Record<string, string>;
};
const observaciones: Campo = { nombre: "notes", etiqueta: "Observaciones", tipo: "textarea", opcional: true };
const vigencia: Campo[] = [
  { nombre: "starts_on", etiqueta: "Inicio de vigencia", tipo: "date" },
  { nombre: "ends_on", etiqueta: "Fin de vigencia (inclusive)", tipo: "date", opcional: true },
];
export const CATEGORIAS_CUIDADO = { diet: "Alimentación", allergy: "Alergia", mobility: "Movilidad", care: "Cuidados especiales" };
export const CONFIG_REGISTRO = {
  documentos: { tabla: "resident_documents", titulo: "Documentos", singular: "documento", descripcion: "Documentación privada del residente. Podés incorporar archivos pendientes en cualquier momento.", campos: [
    { nombre: "title", etiqueta: "Título" }, { nombre: "document_type", etiqueta: "Tipo de documento" },
    { nombre: "issued_on", etiqueta: "Fecha del documento", tipo: "date", opcional: true }, observaciones,
  ] },
  indicaciones: { tabla: "medical_indications", titulo: "Indicaciones médicas", singular: "indicación", descripcion: "Transcribí la indicación del profesional y su vigencia. Las versiones anteriores quedan en Auditoría.", campos: [
    { nombre: "title", etiqueta: "Título" }, { nombre: "instructions", etiqueta: "Indicación", tipo: "textarea" },
    { nombre: "professional", etiqueta: "Profesional que indica" }, ...vigencia,
  ] },
  medicacion: { tabla: "medications", titulo: "Medicación", singular: "medicación", descripcion: "Registrá el esquema indicado por el profesional: dosis, frecuencia y horarios. Esta ficha no registra administraciones de dosis.", campos: [
    { nombre: "name", etiqueta: "Medicamento" }, { nombre: "dose", etiqueta: "Dosis y vía de administración" },
    { nombre: "frequency", etiqueta: "Frecuencia" }, { nombre: "schedule", etiqueta: "Horarios o pauta indicada" },
    { nombre: "professional", etiqueta: "Profesional que indica" }, ...vigencia, observaciones,
  ] },
  cuidados: { tabla: "special_needs", titulo: "Cuidados especiales", singular: "cuidado", descripcion: "Necesidades de alimentación, alergias, movilidad y cuidados de la persona.", campos: [
    { nombre: "category", etiqueta: "Categoría", tipo: "select", opciones: CATEGORIAS_CUIDADO },
    { nombre: "details", etiqueta: "Detalle y cuidados requeridos", tipo: "textarea" },
  ] },
  pertenencias: { tabla: "inventory_items", titulo: "Pertenencias", singular: "pertenencia", descripcion: "Objetos recibidos en cada estadía y su devolución. Elegí la estadía desde la ficha para agregar objetos.", campos: [
    { nombre: "admission_id", etiqueta: "Estadía", tipo: "estadia" },
    { nombre: "description", etiqueta: "Descripción" }, { nombre: "quantity", etiqueta: "Cantidad", tipo: "number" },
    { nombre: "received_on", etiqueta: "Fecha de recepción", tipo: "date" },
    { nombre: "returned_on", etiqueta: "Fecha de devolución", tipo: "date", opcional: true }, observaciones,
  ] },
} as const satisfies Record<SeccionRegistro, {
  tabla: "resident_documents" | "medical_indications" | "medications" | "special_needs" | "inventory_items";
  titulo: string; singular: string; descripcion: string; campos: Campo[];
}>;
export type EstadoRegistro = { valores: Record<string, string>; errores: Record<string, string>; mensaje: string | null };

export function esSeccionRegistro(valor: unknown): valor is SeccionRegistro {
  return SECCIONES_REGISTRO.some(seccion => seccion === valor);
}
export function camposRegistro(seccion: SeccionRegistro): readonly Campo[] {
  return CONFIG_REGISTRO[seccion].campos;
}
export function valoresRegistro(registro: RegistroResidente | null): Record<string, string> {
  return registro ? Object.fromEntries(Object.entries(registro).map(([clave, valor]) => [clave, valor == null ? "" : String(valor)])) : {};
}
export function validarRegistro(seccion: SeccionRegistro, datos: FormData, hoy: string): EstadoRegistro {
  const valores: Record<string, string> = {}, errores: Record<string, string> = {};
  for (const campo of camposRegistro(seccion)) {
    const valor = datos.get(campo.nombre);
    valores[campo.nombre] = typeof valor === "string" ? valor.trim() : "";
    const texto = valores[campo.nombre];
    if (!texto && !campo.opcional) errores[campo.nombre] = "Completá este campo.";
    if (texto && campo.tipo === "date" && !esFechaValida(texto)) errores[campo.nombre] = "Ingresá una fecha válida.";
    if (campo.tipo === "number" && (!/^[1-9]\d*$/.test(texto) || Number(texto) > 100000)) errores[campo.nombre] = "Usá una cantidad entera de 1 a 100.000.";
    if (campo.opciones && !Object.hasOwn(campo.opciones, texto)) errores[campo.nombre] = "Elegí una categoría válida.";
  }
  if (valores.ends_on && valores.ends_on < valores.starts_on) errores.ends_on = "El fin no puede ser anterior al inicio.";
  if (seccion === "pertenencias") {
    if (valores.returned_on && valores.returned_on < valores.received_on) errores.returned_on = "La devolución no puede preceder a la recepción.";
    for (const campo of ["received_on", "returned_on"]) if (valores[campo] > hoy) errores[campo] = "La fecha no puede estar en el futuro.";
  }
  return { valores, errores, mensaje: Object.keys(errores).length ? "Revisá los campos marcados." : null };
}
export function estadoRegistro(registro: RegistroResidente, hoy: string): string {
  if (registro.archived_at) return "Archivado";
  if ("starts_on" in registro) {
    if (registro.starts_on > hoy) return "Programado";
    if (registro.ends_on && registro.ends_on < hoy) return "Vigencia finalizada";
    return "Vigente";
  }
  if ("returned_on" in registro) return registro.returned_on ? "Devuelto" : "En custodia";
  return "Actual";
}
export function rutaRegistros(residenteId: string, seccion: SeccionRegistro): string {
  return `/residentes/ficha/${residenteId}/registros/${seccion}`;
}
export function errorRegistro(error: unknown): string {
  const codigo = error && typeof error === "object" && "code" in error ? error.code : null;
  const CAMBIO = "40001", INEXISTENTE = "P0002", INVALIDO = "23514", SIN_ACCESO = "42501";
  if (codigo === CAMBIO) return "El registro cambió o ya fue guardado. Volvé al listado y abrilo nuevamente.";
  if (codigo === INEXISTENTE) return "El registro o residente ya no está disponible.";
  if (codigo === INVALIDO) return "Revisá los datos, fechas y estadía. Un registro archivado no se puede modificar.";
  if (codigo === SIN_ACCESO) return "Tu sesión no permite guardar este cambio.";
  return "No se pudo confirmar el cambio. Revisá el listado antes de reenviar.";
}
