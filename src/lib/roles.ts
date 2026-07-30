import type { Rol } from "./types";

export const ROL_META: Record<
  Rol,
  { label: string; avatarBg: string; badge: string; dot: string }
> = {
  owner: {
    label: "Dueño",
    avatarBg: "bg-violet-600",
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
  },
  admin: {
    label: "Admin",
    avatarBg: "bg-violet-600",
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
  },
  enfermeria: {
    label: "Enfermería",
    avatarBg: "bg-sky-600",
    badge: "bg-sky-100 text-sky-700",
    dot: "bg-sky-500",
  },
  cuidador: {
    label: "Cuidador",
    avatarBg: "bg-teal-600",
    badge: "bg-teal-100 text-teal-700",
    dot: "bg-teal-500",
  },
};

// owner/admin/enfermeria pueden gestionar datos clínicos y de configuración
// (espeja auth_es_gestor() en la base). cuidador solo registra tomas.
const ROLES_GESTOR: Rol[] = ["owner", "admin", "enfermeria"];

export function esGestor(roles: Rol[]): boolean {
  return roles.some((r) => ROLES_GESTOR.includes(r));
}

const ORDEN_JERARQUIA: Rol[] = ["owner", "admin", "enfermeria", "cuidador"];

export function rolPrincipal(roles: Rol[]): Rol | null {
  return ORDEN_JERARQUIA.find((r) => roles.includes(r)) ?? roles[0] ?? null;
}
