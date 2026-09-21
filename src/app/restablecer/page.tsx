import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { FormularioContrasena } from "./formulario";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Nueva contraseña · geriatrIA",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function RestablecerPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/recuperar?error=sesion");
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm ring-1 ring-black/5">
            <span className="text-xl font-black text-emerald-400">#</span>
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
            Establecer contraseña
          </h1>
          <p className="mt-1.5 break-all text-xs font-medium text-slate-500">
            {user.email}
          </p>
        </div>

        <Card className="rounded-3xl border border-slate-200/80 bg-white/95 p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
          <FormularioContrasena />
        </Card>
      </div>
    </main>
  );
}

