import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/nav-link";
import { LogoutButton } from "@/components/logout-button";
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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/turno" className="text-lg font-bold text-slate-900">
              geriatr<span className="text-emerald-600">IA</span>
            </Link>
            <span className="hidden text-sm text-slate-400 sm:inline">
              {orgNombre}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden gap-1 sm:flex">
              {misRoles.map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600"
                >
                  {r}
                </span>
              ))}
            </div>
            <span className="hidden text-sm text-slate-600 md:inline">
              {perfil?.nombre}
            </span>
            <LogoutButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-1 px-2 pb-1">
          <NavLink href="/turno">Tomas de mi turno</NavLink>
          <NavLink href="/residentes">Residentes</NavLink>
          <NavLink href="/dashboard">Dashboard</NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
