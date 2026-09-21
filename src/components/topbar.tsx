import Link from "next/link";
import { LogOut } from "lucide-react";
import { NavLink } from "@/components/nav-link";
import { Button } from "@/components/ui";
import { NAV } from "@/lib/nav";
import { ETIQUETAS_ROL, puedeVerSeccion, type Rol } from "@/lib/permisos";
import { logout } from "@/app/login/actions";

export function Topbar({ rol }: { rol: Rol }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-2xs">
      <div className="flex items-center justify-between px-4 py-3 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white">
            g
          </div>
          <span>
            geriatr<span className="text-emerald-600">IA</span>
          </span>
        </Link>
        <div className="hidden items-center gap-2 lg:flex">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {ETIQUETAS_ROL[rol]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 lg:hidden">{ETIQUETAS_ROL[rol]}</span>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="md"
              className="h-9 px-3 text-xs text-slate-600 hover:text-slate-900"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </Button>
          </form>
        </div>
      </div>

      <nav
        aria-label="Navegación móvil"
        className="flex gap-1.5 overflow-x-auto px-3 pb-2.5 pt-0.5 lg:hidden"
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

