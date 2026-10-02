"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  children,
  compact = false,
}: {
  href: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-xl py-1.5 font-semibold transition-all",
        compact ? "px-1.5 text-[11px]" : "px-3 text-xs",
        active
          ? "bg-slate-900 text-white shadow-2xs"
          : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900",
      )}
    >
      {children}
    </Link>
  );
}
