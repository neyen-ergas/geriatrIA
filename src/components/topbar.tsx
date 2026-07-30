import Link from "next/link";
import { NavLink } from "@/components/nav-link";
import { NAV } from "@/lib/nav";

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <Link href="/" className="text-lg font-bold text-slate-900 lg:hidden">
          geriatr<span className="text-emerald-600">IA</span>
        </Link>
        <div className="hidden lg:block" />
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:hidden">
        {NAV.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
