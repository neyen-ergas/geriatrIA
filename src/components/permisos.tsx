"use client";

import { createContext, useContext, type ReactNode } from "react";
import { tienePermiso, type Rol } from "@/lib/permisos";

const ContextoRol = createContext<Rol | null>(null);

export function ProveedorPermisos({ rol, children }: { rol: Rol; children: ReactNode }) {
  return <ContextoRol.Provider value={rol}>{children}</ContextoRol.Provider>;
}

export function usePuedeGestionar(): boolean {
  return tienePermiso(useContext(ContextoRol), "operational.write");
}

/** Solo controla la presentación; las páginas, acciones y RLS autorizan el acceso. */
export function SoloGestion({ children }: { children: ReactNode }) {
  return usePuedeGestionar() ? children : null;
}
