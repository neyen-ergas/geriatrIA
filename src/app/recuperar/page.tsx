import type { Metadata } from "next";
import Link from "next/link";
import { PantallaAcceso } from "@/components/pantalla-acceso";
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
    <PantallaAcceso
      titulo="Recuperar acceso"
      bajada="Te enviamos un enlace para que elijas una contraseña nueva."
      pie={
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center font-semibold text-casona-800 underline hover:text-casona-950"
        >
          Volver al ingreso
        </Link>
      }
    >
      <p className="text-base text-piedra-700">
        Ingresá tu correo institucional. Abrí el enlace que recibas en este mismo
        navegador.
      </p>
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-oxido-300 bg-oxido-50 p-3 text-base text-oxido-900"
        >
          El enlace no es válido, venció o se abrió en otro navegador. Pedí uno nuevo
          desde esta página.
        </div>
      )}
      <FormularioRecuperacion />
    </PantallaAcceso>
  );
}
