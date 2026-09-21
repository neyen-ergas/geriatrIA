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
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-xl font-bold">Establecer contraseña nueva</h1>
        <p className="mt-2 break-all text-sm text-slate-600">{user.email}</p>
        <FormularioContrasena />
      </Card>
    </main>
  );
}
