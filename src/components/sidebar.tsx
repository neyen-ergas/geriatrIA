"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MarcaGeriatria } from "@/components/baldosa";
import { cn } from "@/lib/utils";
import { NAV } from "@/lib/nav";
import { ETIQUETAS_ROL, puedeVerSeccion, type Rol } from "@/lib/permisos";

const GRUPOS = [
  {
    titulo: "Trabajo diario",
    rutas: ["/", "/admision", "/residentes", "/contabilidad", "/turnos"],
  },
  {
    titulo: "Más secciones",
    rutas: ["/empleados", "/entrevistas", "/accesos", "/auditoria"],
  },
];

export function esRutaActiva(pathname: string, href: string): boolean {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ rol }: { rol: Rol }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-casona-900 text-casona-50 lg:flex">
      <Link
        href="/"
        className="flex h-16 items-center border-b border-casona-800 px-5 text-white hover:text-casona-50"
      >
        <MarcaGeriatria />
      </Link>
      <nav
        aria-label="Navegación principal"
        className="flex-1 space-y-7 overflow-y-auto px-3 py-6"
      >
        {GRUPOS.map(grupo => {
          const items = grupo.rutas
            .map(ruta => NAV.find(item => item.href === ruta))
            .filter(item => item && puedeVerSeccion(rol, item.href));
          if (items.length === 0) return null;

          return (
            <div key={grupo.titulo}>
              <p className="px-3 pb-2 text-sm font-semibold text-casona-300">
                {grupo.titulo}
              </p>
              <ul className="space-y-0.5">
                {items.map(item => {
                  if (!item) return null;
                  const activo = esRutaActiva(pathname, item.href);
                  const Icono = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={activo ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-md px-3 text-base font-semibold transition-colors duration-150",
                          "focus-visible:outline-ocre-300",
                          activo
                            ? "bg-ocre-300 text-casona-950"
                            : "text-casona-50 hover:bg-casona-800 hover:text-white",
                        )}
                      >
                        <Icono className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <p className="border-t border-casona-800 px-5 py-4 text-sm text-casona-200">
        Ingresaste como{" "}
        <span className="font-semibold text-white">{ETIQUETAS_ROL[rol]}</span>
      </p>
    </aside>
  );
}
