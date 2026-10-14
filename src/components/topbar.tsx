import Link from "next/link";
import { LogOut } from "lucide-react";
import { MarcaGeriatria } from "@/components/baldosa";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui";
import { ETIQUETAS_ROL, type Rol } from "@/lib/permisos";
import { logout } from "@/app/login/actions";

export function Topbar({ rol }: { rol: Rol }) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-piedra-200 bg-white lg:bg-piedra-100">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:justify-end lg:px-8">
          <Link
            href="/"
            className="-ml-1 rounded-md bg-casona-900 py-1.5 pr-3 pl-1.5 text-white lg:hidden"
          >
            <MarcaGeriatria className="[&_span]:text-lg" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-piedra-600 sm:inline lg:hidden">
              {ETIQUETAS_ROL[rol]}
            </span>
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                aria-label="Cerrar sesión"
                className="px-3 hover:bg-oxido-50 hover:text-oxido-800"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <MobileNav rol={rol} />
    </>
  );
}
