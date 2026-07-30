import Link from "next/link";
import { Avatar } from "@/components/ui";
import { LogoutButton } from "@/components/logout-button";
import { NavLink } from "@/components/nav-link";
import { ROL_META, rolPrincipal } from "@/lib/roles";
import type { Rol } from "@/lib/types";
import { cn } from "@/lib/utils";

const MOBILE_NAV_GESTOR = [
  { href: "/turno", label: "Turno" },
  { href: "/residentes", label: "Residentes" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Topbar({
  nombre,
  roles,
  showBrand = false,
  showMobileNav = false,
}: {
  nombre: string;
  roles: Rol[];
  showBrand?: boolean;
  showMobileNav?: boolean;
}) {
  const principal = rolPrincipal(roles);
  const meta = principal ? ROL_META[principal] : null;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {showBrand ? (
          <Link href="/turno" className="text-lg font-bold text-slate-900">
            geriatr<span className="text-emerald-600">IA</span>
          </Link>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium text-slate-900">{nombre}</div>
            {meta && (
              <span
                className={cn(
                  "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                  meta.badge,
                )}
              >
                {meta.label}
              </span>
            )}
          </div>
          <Avatar nombre={nombre} colorClass={meta?.avatarBg} />
          <LogoutButton />
        </div>
      </div>

      {showMobileNav && (
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:hidden">
          {MOBILE_NAV_GESTOR.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
