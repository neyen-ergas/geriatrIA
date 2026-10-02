"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLink } from "@/components/nav-link";
import { NAV } from "@/lib/nav";
import { puedeVerSeccion, type Rol } from "@/lib/permisos";

const PRINCIPALES = new Set(["/", "/admision", "/residentes", "/contabilidad"]);

export function MobileNav({ rol }: { rol: Rol }) {
  const pathname = usePathname();
  const visibles = NAV.filter(item => puedeVerSeccion(rol, item.href));
  const adicionales = visibles.filter(item => !PRINCIPALES.has(item.href));
  const hayAdicionalActivo = adicionales.some(
    item => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return (
    <nav
      aria-label="Navegación móvil"
      className="flex items-center gap-0.5 overflow-visible border-t border-slate-100 bg-slate-50/80 px-1 py-2 lg:hidden"
    >
      {visibles
        .filter(item => PRINCIPALES.has(item.href))
        .map(item => (
          <NavLink key={item.href} href={item.href} compact>
            {item.href === "/contabilidad" ? "Pagos" : item.label}
          </NavLink>
        ))}
      {adicionales.length > 0 && (
        <details key={pathname} className="group relative ml-auto shrink-0">
          <summary
            className={`cursor-pointer list-none rounded-xl px-1.5 py-2 text-[11px] font-semibold marker:hidden ${hayAdicionalActivo ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-200"}`}
          >
            Más ▾
          </summary>
          <div className="absolute right-0 top-full z-30 mt-2 min-w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
            {adicionales.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-emerald-50"
                aria-current={
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "page"
                    : undefined
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
        </details>
      )}
    </nav>
  );
}
