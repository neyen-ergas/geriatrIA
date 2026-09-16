import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { ProveedorPermisos } from "@/components/permisos";
import type { Rol } from "@/lib/permisos";

export function renderConPermisos(contenido: ReactNode, rol: Rol = "admin"): string {
  return renderToStaticMarkup(
    <ProveedorPermisos rol={rol}>{contenido}</ProveedorPermisos>,
  );
}
