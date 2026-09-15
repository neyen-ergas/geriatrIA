import { LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
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
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Ingresar a geriatr<span className="text-emerald-600">IA</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Acceso exclusivo para personal autorizado.
          </p>
        </div>

        <Card className="p-6">
          <LoginForm errorMessage={errorMessage} />
        </Card>

        <p className="mt-4 text-center text-xs text-slate-400">
          Las cuentas son creadas por el administrador de la residencia.
        </p>
      </div>
    </main>
  );
}
