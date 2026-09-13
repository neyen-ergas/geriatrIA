import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { ProveedorPermisos } from "@/components/permisos";
import { requerirSesion } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const rol = await requerirSesion();

  return (
    <ProveedorPermisos rol={rol}>
      <div className="flex min-h-screen">
        <Sidebar rol={rol} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar rol={rol} />
          <main className="flex-1 px-4 py-6 lg:px-8">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
    </ProveedorPermisos>
  );
}
