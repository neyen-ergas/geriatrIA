import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { FormularioRecuperacion } from "./formulario";

export const metadata: Metadata = {
  title: "Recuperar acceso · geriatrIA",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}): Promise<React.ReactElement> {
  const { error } = await searchParams;
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm ring-1 ring-black/5">
            <span className="text-xl font-black text-emerald-400">@</span>
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
            Recuperar acceso
          </h1>
          <p className="mt-1.5 text-xs font-medium text-slate-500">
            Te enviaremos un enlace para establecer una contraseña nueva
          </p>
        </div>

        <Card className="rounded-3xl border border-slate-200/80 bg-white/95 p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
          <p className="text-xs text-slate-600 leading-relaxed">
            Ingresá tu correo institucional. Abrí el enlace que recibas en este mismo
            navegador.
          </p>
          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200/80 bg-red-50/90 p-3 text-xs font-medium text-red-700"
            >
              El enlace no es válido, venció o se abrió en otro navegador. Pedí uno nuevo
              desde esta página.
            </div>
          )}
          <FormularioRecuperacion />
          <div className="mt-5 border-t border-slate-100 pt-4 text-center">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors underline underline-offset-4"
            >
              ← Volver al ingreso
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}

