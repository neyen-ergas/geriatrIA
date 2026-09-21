"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV } from "@/lib/nav";
import { ETIQUETAS_ROL, puedeVerSeccion, type Rol } from "@/lib/permisos";

export function Sidebar({ rol }: { rol: Rol }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-xs lg:flex">
      {/* Cabecera del Sidebar / Branding */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-sm font-extrabold text-white shadow-xs ring-1 ring-black/5">
          g
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-bold tracking-tight text-slate-900">
            geriatr<span className="text-emerald-600">IA</span>
          </div>
          <div className="truncate text-[11px] font-medium text-slate-400">
            Residencia & Cuidados
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {NAV.filter(item => puedeVerSeccion(rol, item.href)).map(item => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-emerald-50/90 text-emerald-900 font-semibold shadow-2xs border border-emerald-200/60"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    active
                      ? "text-emerald-600"
                      : "text-slate-400 group-hover:text-slate-700",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Pie del Sidebar */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/80 p-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-slate-800">
              {ETIQUETAS_ROL[rol]}
            </div>
            <div className="truncate text-[10px] text-slate-400">
              Sesión activa
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

