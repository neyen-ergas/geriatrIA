import Link from "next/link";
import { LogOut } from "lucide-react";
import { NavLink } from "@/components/nav-link";
import { Button } from "@/components/ui";
import { NAV } from "@/lib/nav";
import { ETIQUETAS_ROL, puedeVerSeccion, type Rol } from "@/lib/permisos";
import { logout } from "@/app/login/actions";

export function Topbar({ rol }: { rol: Rol }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-xs">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Móvil Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-black text-slate-900 lg:hidden"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-xs font-black text-white shadow-sm ring-2 ring-emerald-50">
            g
          </div>
          <span>
            geriatr<span className="text-emerald-600">IA</span>
          </span>
        </Link>

        {/* Escritorio Indicadores de Estado */}
        <div className="hidden items-center gap-3 lg:flex">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
            Sistema en Línea · Residencia Activa
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-100/70 px-3 py-1 text-xs font-semibold text-slate-700">
            Rol: {ETIQUETAS_ROL[rol]}
          </span>
        </div>

        {/* Acciones del Usuario */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600 lg:hidden">
            {ETIQUETAS_ROL[rol]}
          </span>
          <form action={logout}>
            <Button
              type="submit"
              variant="outline"
              size="md"
              className="h-9 gap-1.5 rounded-xl border-slate-200/90 px-3 text-xs font-semibold text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-all shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar Sesión
            </Button>
          </form>
        </div>
      </div>

      {/* Navegación móvil horizontal */}
      <nav
        aria-label="Navegación móvil"
        className="flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-slate-50/60 px-3 pb-2.5 pt-1 lg:hidden"
      >
        {NAV.filter(item => puedeVerSeccion(rol, item.href)).map(item => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

