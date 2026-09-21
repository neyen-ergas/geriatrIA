// Primitivas de UI estilo shadcn/ui. Mismos patrones: Tailwind + cn().
import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "md" | "lg";
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-slate-900 text-white shadow-xs hover:bg-slate-800 hover:shadow-sm active:scale-[0.98] border border-slate-900/10",
    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200/80 active:scale-[0.98] border border-slate-200/50",
    danger:
      "bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:scale-[0.98]",
    outline:
      "border border-slate-200/90 bg-white text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]",
    ghost: "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 active:scale-[0.98]",
  };
  const sizes: Record<string, string> = {
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-base",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)] transition-all",
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs hover:border-slate-300 focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 disabled:bg-slate-50",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-y rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs hover:border-slate-300 focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 disabled:bg-slate-50",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 text-sm text-slate-900 outline-none transition-all shadow-2xs hover:border-slate-300 focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 disabled:bg-slate-50",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600", className)}
      {...props}
    />
  );
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide shadow-2xs",
        className,
      )}
      {...props}
    />
  );
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function Avatar({
  nombre,
  colorClass = "bg-slate-700",
  className,
}: {
  nombre: string;
  colorClass?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs ring-2 ring-white/90",
        colorClass,
        className,
      )}
    >
      {iniciales(nombre)}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  iconClass = "bg-slate-100 text-slate-600",
  label,
  value,
  valueClass = "text-slate-900",
  hint,
  hintClass = "text-slate-400",
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass?: string;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  hint?: React.ReactNode;
  hintClass?: string;
}) {
  return (
    <Card className="p-5 hover:border-slate-300/80 transition-all">
      <div
        className={cn("flex h-10 w-10 items-center justify-center rounded-xl shadow-2xs", iconClass)}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={cn("mt-1 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl", valueClass)}>{value}</div>
      {hint && <div className={cn("mt-1 text-xs font-medium", hintClass)}>{hint}</div>}
    </Card>
  );
}

