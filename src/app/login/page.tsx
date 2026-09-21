import { LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Completá el correo y la contraseña.",
  invalid_credentials: "El correo o la contraseña no son correctos.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/");
  }

  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Cabecera de marca */}
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm ring-1 ring-black/5">
            <LockKeyhole className="h-6 w-6 text-emerald-400" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
            Ingresar a geriatr<span className="text-emerald-600">IA</span>
          </h1>
          <p className="mt-1.5 text-xs font-medium text-slate-500">
            Acceso exclusivo para personal autorizado de la residencia
          </p>
        </div>

        {/* Tarjeta de autenticación */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white/95 p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
          <LoginForm errorMessage={errorMessage} />
          <div className="mt-5 border-t border-slate-100 pt-4 text-center">
            <Link
              href="/recuperar"
              className="text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors underline underline-offset-4"
            >
              Olvidé mi contraseña
            </Link>
          </div>
        </Card>

        {/* Nota de seguridad inferior */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Las cuentas son creadas por el administrador de la residencia.
        </p>
      </div>
    </main>
  );
}

