"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function Sidebar({ rol }: { rol: Rol }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <Link
        href="/"
        className="border-b border-slate-200 px-5 py-5 text-xl font-bold tracking-tight text-slate-900"
      >
        geriatr<span className="text-emerald-700">IA</span>
      </Link>
      <nav
        aria-label="Navegación principal"
        className="flex-1 space-y-6 overflow-y-auto px-3 py-5"
      >
        {GRUPOS.map(grupo => {
          const items = grupo.rutas
            .map(ruta => NAV.find(item => item.href === ruta))
            .filter(item => item && puedeVerSeccion(rol, item.href));
          if (items.length === 0) return null;

          return (
            <div key={grupo.titulo}>
              <p className="px-3 pb-2 text-xs font-semibold text-slate-500">
                {grupo.titulo}
              </p>
              <div className="space-y-1">
                {items.map(item => {
                  if (!item) return null;
                  const activo =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icono = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={activo ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                        activo
                          ? "bg-emerald-50 text-emerald-900"
                          : "text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      <Icono className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <p className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
        {ETIQUETAS_ROL[rol]}
      </p>
    </aside>
  );
}
