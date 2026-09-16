import Link from "next/link";
import { LogOut } from "lucide-react";
import { NavLink } from "@/components/nav-link";
import { Button } from "@/components/ui";
import { NAV } from "@/lib/nav";
import { ETIQUETAS_ROL, puedeVerSeccion, type Rol } from "@/lib/permisos";
import { logout } from "@/app/login/actions";

export function Topbar({ rol }: { rol: Rol }) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <Link href="/" className="text-lg font-bold text-slate-900 lg:hidden">
          geriatr<span className="text-emerald-600">IA</span>
        </Link>
        <span className="text-sm text-slate-500">{ETIQUETAS_ROL[rol]}</span>
        <form action={logout}>
          <Button type="submit" variant="ghost" className="h-9 px-3">
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </form>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:hidden">
        {NAV.filter(item => puedeVerSeccion(rol, item.href)).map(item => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
