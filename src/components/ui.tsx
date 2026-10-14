// Primitivas de UI estilo shadcn/ui. Mismos patrones: Tailwind + cn().
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Los botones miden al menos 44px de alto en `md`: parte del equipo es mayor y
 * usa el sistema en el celular. El verde de la casona queda reservado para la
 * acción principal de cada pantalla.
 */
export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}) {
  const variants: Record<string, string> = {
    primary:
      "border border-casona-800 bg-casona-700 text-white hover:bg-casona-800 active:bg-casona-900",
    secondary:
      "border border-piedra-300 bg-piedra-100 text-piedra-900 hover:bg-piedra-200 active:bg-piedra-300",
    danger:
      "border border-oxido-800 bg-oxido-700 text-white hover:bg-oxido-800 active:bg-oxido-900",
    outline:
      "border border-piedra-300 bg-white text-piedra-900 hover:border-piedra-400 hover:bg-piedra-50 active:bg-piedra-100",
    ghost:
      "border border-transparent text-piedra-700 hover:bg-piedra-200/70 hover:text-piedra-950",
  };
  const sizes: Record<string, string> = {
    sm: "min-h-9 px-3 text-sm",
    md: "min-h-11 px-4 text-[0.9375rem]",
    lg: "min-h-12 px-5 text-base",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-casona-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

/** Una baldosa: superficie blanca con junta fina, sin sombra flotante. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md border border-piedra-200 bg-white", className)}
      {...props}
    />
  );
}

const CAMPO =
  "w-full rounded-md border border-piedra-300 bg-white px-3.5 text-base text-piedra-950 placeholder:text-piedra-500 outline-none transition-colors duration-150 hover:border-piedra-400 focus-visible:border-casona-700 focus-visible:ring-2 focus-visible:ring-casona-600/40 focus-visible:outline-none aria-invalid:border-oxido-600 disabled:pointer-events-none disabled:bg-piedra-100 disabled:text-piedra-500";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CAMPO, "min-h-11", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(CAMPO, "min-h-28 resize-y py-2.5", className)} {...props} />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CAMPO, "min-h-11", className)} {...props} />;
}

/** Etiquetas en minúscula de oración: se leen más rápido que las versalitas. */
export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-semibold text-piedra-800", className)}
      {...props}
    />
  );
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[0.8125rem] font-semibold",
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
  colorClass = "bg-piedra-700",
  className,
}: {
  nombre: string;
  colorClass?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white",
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
  iconClass = "bg-piedra-100 text-piedra-700",
  label,
  value,
  valueClass = "text-piedra-950",
  hint,
  hintClass = "text-piedra-600",
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
    <Card className="p-5">
      <div className="flex items-center gap-2.5">
        <div
          className={cn("flex h-8 w-8 items-center justify-center rounded-sm", iconClass)}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-sm font-semibold text-piedra-700">{label}</div>
      </div>
      <div className={cn("mt-3 text-3xl font-bold tabular-nums", valueClass)}>
        {value}
      </div>
      {hint && <div className={cn("mt-1 text-sm", hintClass)}>{hint}</div>}
    </Card>
  );
}
