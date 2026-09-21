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
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-xl font-bold">Recuperar acceso</h1>
        <p className="mt-2 text-sm text-slate-600">
          Te enviaremos un enlace para establecer una contraseña nueva. Abrilo en este
          mismo navegador.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            El enlace no es válido, venció o se abrió en otro navegador. Pedí uno nuevo
            desde esta página.
          </p>
        )}
        <FormularioRecuperacion />
        <Link href="/login" className="mt-5 block text-sm underline">
          Volver al ingreso
        </Link>
      </Card>
    </main>
  );
}
