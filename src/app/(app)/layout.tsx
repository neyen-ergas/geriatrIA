import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { esGestor } from "@/lib/roles";
import type { Rol } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("usuario_perfil")
    .select("nombre, organizacion:organizacion_id(nombre)")
    .eq("id", user.id)
    .single();

  const { data: roles } = await supabase
    .from("usuario_rol")
    .select("rol")
    .eq("usuario_id", user.id);

  const misRoles = (roles ?? []).map((r) => r.rol as Rol);
  const orgNombre =
    (perfil?.organizacion as { nombre?: string } | null)?.nombre ?? "";
  const nombre = perfil?.nombre ?? "";
  const gestor = esGestor(misRoles);

  // El cuidador solo usa "Tomas de mi turno": sin sidebar de navegación a
  // secciones que no le corresponden, para que la interfaz refleje lo que
  // puede hacer en vez de mostrar el mismo menú completo a todo el mundo.
  if (!gestor) {
    return (
      <div className="min-h-screen">
        <Topbar nombre={nombre} roles={misRoles} showBrand />
        <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar orgNombre={orgNombre} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar nombre={nombre} roles={misRoles} showMobileNav />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
