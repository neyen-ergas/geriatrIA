import { normalizarDni } from "@/lib/dni-residente";
import { esFechaValida } from "@/lib/primer-ingreso";
import type { Database } from "@/types/database";

const CAMPOS = [
  "first_name",
  "last_name",
  "dni",
  "birth_date",
  "phone",
  "email",
  "job_title",
  "hired_at",
  "notes",
  "terminated_at",
  "termination_reason",
] as const;
export type CampoEmpleado = (typeof CAMPOS)[number];
export type ValoresEmpleado = Record<CampoEmpleado, string>;
export type EstadoEmpleado = {
  valores: Partial<ValoresEmpleado>;
  errores: Partial<Record<CampoEmpleado, string>>;
  mensaje: string | null;
};
type DatosEmpleado = Database["public"]["Functions"]["save_employee"]["Args"];

export function leerEmpleado(datos: FormData): ValoresEmpleado {
  return Object.fromEntries(
    CAMPOS.map(campo => {
      const valor = datos.get(campo);
      return [campo, typeof valor === "string" ? valor.trim() : ""];
    }),
  ) as ValoresEmpleado;
}

export function validarEmpleado(
  valores: ValoresEmpleado,
  hoy: string,
):
  | {
      ok: true;
      datos: DatosEmpleado;
    }
  | { ok: false; errores: EstadoEmpleado["errores"] } {
  const errores: EstadoEmpleado["errores"] = {};
  for (const [campo, limite] of [
    ["first_name", 80],
    ["last_name", 80],
    ["job_title", 100],
  ] as const) {
    if (!valores[campo] || valores[campo].length > limite)
      errores[campo] = `Completá este campo con hasta ${limite} caracteres.`;
  }
  const dni = normalizarDni(valores.dni);
  if (!dni || dni.length > 30) errores.dni = "Ingresá un DNI de hasta 30 caracteres.";
  if (!esFechaValida(valores.hired_at) || valores.hired_at > hoy)
    errores.hired_at = "Elegí una fecha de alta válida, hasta hoy.";
  if (
    valores.birth_date &&
    (!esFechaValida(valores.birth_date) || valores.birth_date > valores.hired_at)
  )
    errores.birth_date =
      "El nacimiento debe ser una fecha válida anterior o igual al alta.";
  if (valores.phone.length > 40) errores.phone = "Usá hasta 40 caracteres.";
  if (
    valores.email &&
    (valores.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.email))
  )
    errores.email = "Ingresá un correo válido.";
  if (valores.notes.length > 2000) errores.notes = "Usá hasta 2.000 caracteres.";
  if (Object.keys(errores).length) return { ok: false, errores };
  return {
    ok: true,
    datos: {
      p_first_name: valores.first_name,
      p_last_name: valores.last_name,
      p_dni: dni,
      p_job_title: valores.job_title,
      p_hired_at: valores.hired_at,
      p_birth_date: valores.birth_date || undefined,
      p_phone: valores.phone || undefined,
      p_email: valores.email || undefined,
      p_notes: valores.notes || undefined,
    },
  };
}

export function validarBajaEmpleado(
  valores: ValoresEmpleado,
  alta: string,
  hoy: string,
): EstadoEmpleado["errores"] {
  const errores: EstadoEmpleado["errores"] = {};
  if (
    !esFechaValida(valores.terminated_at) ||
    valores.terminated_at < alta ||
    valores.terminated_at > hoy
  )
    errores.terminated_at = "La baja debe estar entre la fecha de alta y hoy.";
  if (!valores.termination_reason || valores.termination_reason.length > 1000)
    errores.termination_reason = "Ingresá el motivo de la baja, hasta 1.000 caracteres.";
  return errores;
}

export function errorEmpleado(error: unknown): string {
  const codigo =
    error && typeof error === "object" && "code" in error ? error.code : null;
  const mensaje =
    error && typeof error === "object" && "message" in error ? error.message : null;
  const DUPLICADO = "23505",
    DESACTUALIZADO = "40001",
    DATOS_INVALIDOS = "23514",
    SIN_ACCESO = "42501";
  if (codigo === DUPLICADO)
    return "Ya existe una ficha con ese DNI. Revisá activos y bajas.";
  if (codigo === DESACTUALIZADO)
    return "La ficha cambió. Volvé a cargarla antes de guardar.";
  if (codigo === DATOS_INVALIDOS && mensaje === "employee_access_enabled")
    return "Suspendé primero la cuenta vinculada desde Accesos y después registrá la baja.";
  if (codigo === DATOS_INVALIDOS)
    return "Revisá los datos y fechas. Las fichas dadas de baja son solo de consulta.";
  if (codigo === SIN_ACCESO)
    return "Tu sesión no permite guardar esta ficha. Volvé a iniciar sesión.";
  return "No se pudo confirmar el cambio. Volvé al listado y revisá la ficha antes de reenviar.";
}

export function enlaceEmpleados(pagina: number, bajas = false): string {
  const parametros = new URLSearchParams();
  if (bajas) parametros.set("estado", "bajas");
  if (pagina > 1) parametros.set("pagina", String(pagina));
  return `/empleados${parametros.size ? `?${parametros}` : ""}`;
}
