import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PantallaAcceso } from "@/components/pantalla-acceso";
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
    <PantallaAcceso
      titulo="Elegí una contraseña nueva"
      bajada={<span className="break-all">Para {user.email}</span>}
      pie={undefined}
    >
      <FormularioContrasena />
    </PantallaAcceso>
  );
}
