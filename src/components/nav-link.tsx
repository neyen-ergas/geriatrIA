"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
        active
          ? "bg-slate-900 text-white shadow-2xs"
          : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900",
      )}
    >
      {children}
    </Link>
  );
}

