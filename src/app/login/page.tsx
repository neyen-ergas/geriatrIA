import { redirect } from "next/navigation";
import Link from "next/link";
import { PantallaAcceso } from "@/components/pantalla-acceso";
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
    <PantallaAcceso
      titulo="Ingresar"
      bajada="Usá el correo y la contraseña que te dio el administrador."
      pie={
        <Link
          href="/recuperar"
          className="inline-flex min-h-11 items-center font-semibold text-casona-800 underline hover:text-casona-950"
        >
          Olvidé mi contraseña
        </Link>
      }
    >
      <LoginForm errorMessage={errorMessage} />
    </PantallaAcceso>
  );
}
