"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Pill,
  Package,
  UtensilsCrossed,
  CalendarClock,
  UserCog,
  Wallet,
  ClipboardCheck,
  HeartHandshake,
  Fingerprint,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_REAL = [
  { href: "/dashboard", label: "Vista general", icon: LayoutDashboard },
  { href: "/residentes", label: "Residentes", icon: Users },
  { href: "/turno", label: "Tomas de mi turno", icon: ClipboardList },
];

// Módulos del plan que todavía no están construidos. Se muestran deshabilitados
// para que el dueño vea el alcance completo del producto, no solo la demo.
const NAV_PROXIMAMENTE = [
  { label: "Medicamentos", icon: Pill },
  { label: "Insumos", icon: Package },
  { label: "Nutrición", icon: UtensilsCrossed },
  { label: "Eventos", icon: CalendarClock },
  { label: "Personal", icon: UserCog },
  { label: "Finanzas y pagos", icon: Wallet },
  { label: "Inspecciones", icon: ClipboardCheck },
  { label: "Familia", icon: HeartHandshake },
  { label: "Control de acceso", icon: Fingerprint },
];

export function Sidebar({ orgNombre }: { orgNombre: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
          g
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-slate-900">
            geriatr<span className="text-emerald-600">IA</span>
          </div>
          <div className="truncate text-xs text-slate-400">
            {orgNombre || "Demo"}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Menú
        </p>
        <div className="space-y-0.5">
          {NAV_REAL.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <p className="px-2 pb-2 pt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Próximamente
        </p>
        <div className="space-y-0.5">
          {NAV_PROXIMAMENTE.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                title="Todavía no está disponible"
                className="flex cursor-not-allowed items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-slate-300"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <Lock className="h-3 w-3" />
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

export { NAV_REAL };
