import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui";

export default function SinPermiso() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="relative max-w-md overflow-hidden border border-slate-200/80 bg-white/90 p-8 text-center shadow-xl backdrop-blur-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/10 to-amber-500/10 text-rose-600 ring-8 ring-rose-500/5">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="mt-4 inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
          Acceso Restringido
        </div>

        <h1 className="mt-3 text-xl font-extrabold tracking-tight text-slate-900">
          Tu perfil no permite esta operación
        </h1>

        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Si necesitás otro acceso, consultá al Administrador de la residencia.
        </p>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-[0.98]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a Inicio
          </Link>
        </div>
      </Card>
    </div>
  );
}
