export const ROLES = ["admin", "management", "readonly"] as const;
export type Rol = (typeof ROLES)[number];
export type Permiso = "operational.read" | "operational.write" | "administration";

export const ETIQUETAS_ROL: Record<Rol, string> = {
  admin: "Administrador",
  management: "Gestión",
  readonly: "Solo lectura",
};

export function esRol(valor: unknown): valor is Rol {
  return ROLES.some(rol => rol === valor);
}

export function tienePermiso(rol: Rol | null, permiso: Permiso): boolean {
  if (!rol) return false;
  if (permiso === "administration") return rol === "admin";
  if (permiso === "operational.write") return rol !== "readonly";
  return true;
}

export function puedeVerSeccion(rol: Rol, ruta: string): boolean {
  return (
    ["/", "/admision", "/residentes", "/contabilidad"].includes(ruta) || rol === "admin"
  );
}
