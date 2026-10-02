import Link from "next/link";
import { LogOut } from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui";
import { ETIQUETAS_ROL, type Rol } from "@/lib/permisos";
import { logout } from "@/app/login/actions";

export function Topbar({ rol }: { rol: Rol }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:justify-end lg:px-8">
        {/* Móvil Logo */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900 lg:hidden"
        >
          geriatr<span className="text-emerald-700">IA</span>
        </Link>

        {/* Acciones del Usuario */}
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-semibold text-slate-600 sm:inline lg:hidden">
            {ETIQUETAS_ROL[rol]}
          </span>
          <form action={logout}>
            <Button
              type="submit"
              variant="outline"
              size="md"
              aria-label="Cerrar sesión"
              className="h-9 gap-1.5 rounded-xl border-slate-200/90 px-2 text-xs font-semibold text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-all shadow-2xs sm:px-3"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </form>
        </div>
      </div>

      <MobileNav rol={rol} />
    </header>
  );
}
