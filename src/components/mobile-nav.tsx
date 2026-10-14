"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { esRutaActiva } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import { NAV } from "@/lib/nav";
import { puedeVerSeccion, type Rol } from "@/lib/permisos";

const PRINCIPALES = new Set(["/", "/admision", "/residentes", "/contabilidad"]);

/**
 * Barra inferior para el celular: queda al alcance del pulgar y cada botón
 * lleva ícono y nombre, porque parte del equipo no reconoce los íconos solos.
 */
export function MobileNav({ rol }: { rol: Rol }) {
  const pathname = usePathname();
  const visibles = NAV.filter(item => puedeVerSeccion(rol, item.href));
  const principales = visibles.filter(item => PRINCIPALES.has(item.href));
  const adicionales = visibles.filter(item => !PRINCIPALES.has(item.href));
  const hayAdicionalActivo = adicionales.some(item => esRutaActiva(pathname, item.href));
  const estilo = (activo: boolean) =>
    cn(
      "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[0.8125rem] font-semibold",
      activo ? "bg-ocre-300 text-casona-950" : "text-casona-50 hover:bg-casona-800",
    );

  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-casona-950 bg-casona-900 px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="flex gap-1">
        {principales.map(item => {
          const Icono = item.icon;
          const activo = esRutaActiva(pathname, item.href);
          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={activo ? "page" : undefined}
                className={estilo(activo)}
              >
                <Icono className="h-5 w-5" aria-hidden="true" />
                {item.href === "/contabilidad" ? "Pagos" : item.label}
              </Link>
            </li>
          );
        })}
        {adicionales.length > 0 && (
          <li className="flex flex-1">
            <details key={pathname} className="group flex flex-1">
              <summary
                className={cn(
                  estilo(hayAdicionalActivo),
                  "cursor-pointer list-none marker:hidden",
                )}
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                Más
              </summary>
              <div className="fixed inset-x-2 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 rounded-md border border-piedra-300 bg-white p-1.5 shadow-[0_12px_32px_-8px_oklch(0.2_0.04_165/0.35)]">
                <ul>
                  {adicionales.map(item => {
                    const Icono = item.icon;
                    const activo = esRutaActiva(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={activo ? "page" : undefined}
                          className={cn(
                            "flex min-h-12 items-center gap-3 rounded-sm px-3 text-base font-semibold",
                            activo
                              ? "bg-ocre-100 text-ocre-950"
                              : "text-piedra-900 hover:bg-piedra-100",
                          )}
                        >
                          <Icono className="h-5 w-5 text-piedra-600" aria-hidden="true" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </details>
          </li>
        )}
      </ul>
    </nav>
  );
}
