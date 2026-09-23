"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV } from "@/lib/nav";
import { ETIQUETAS_ROL, puedeVerSeccion, type Rol } from "@/lib/permisos";

export function Sidebar({ rol }: { rol: Rol }) {
  const pathname = usePathname();

  const secciones = [
    {
      titulo: "Operaciones",
      rutas: ["/", "/residentes", "/turnos"],
    },
    {
      titulo: "Administración",
      rutas: ["/admision", "/contabilidad", "/empleados"],
    },
    {
      titulo: "Gestión y Control",
      rutas: ["/entrevistas", "/auditoria", "/accesos"],
    },
  ];

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800/80 bg-[#0B0F17] text-slate-300 shadow-2xl lg:flex">
      {/* Cabecera del Sidebar / Branding */}
      <div className="flex items-center gap-3 border-b border-slate-800/70 px-5 py-5">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 text-base font-black text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-white/20">
          g
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0B0F17] bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-base font-black tracking-tight text-white">
            <span>geriatr</span>
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              IA
            </span>
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
              Pro
            </span>
          </div>
          <div className="truncate text-[11px] font-medium text-slate-400">
            Residencia & Cuidados
          </div>
        </div>
      </div>

      {/* Navegación Organizada por Secciones */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
        {secciones.map(seccion => {
          const itemsVisibles = NAV.filter(
            item => seccion.rutas.includes(item.href) && puedeVerSeccion(rol, item.href),
          );
          if (itemsVisibles.length === 0) return null;

          return (
            <div key={seccion.titulo} className="space-y-1.5">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {seccion.titulo}
              </div>
              {itemsVisibles.map(item => {
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
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-300 font-semibold shadow-inner border border-emerald-500/25"
                        : "text-slate-400 hover:bg-slate-900/90 hover:text-slate-100",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        active
                          ? "text-emerald-400"
                          : "text-slate-400 group-hover:text-slate-200",
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Pie del Sidebar */}
      <div className="border-t border-slate-800/80 p-3.5">
        <div className="flex items-center gap-3 rounded-xl border border-slate-800/90 bg-slate-900/70 p-3 backdrop-blur-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-slate-200">
              {ETIQUETAS_ROL[rol]}
            </div>
            <div className="flex items-center gap-1.5 truncate text-[10px] text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
              <span>Sesión activa</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
