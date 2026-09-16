import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { ProveedorPermisos } from "@/components/permisos";
import { requerirSesion } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const rol = await requerirSesion();

  return (
    <ProveedorPermisos rol={rol}>
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:ring-2 focus:ring-slate-400 focus:outline-none"
      >
        Saltar al contenido principal
      </a>
      <div className="flex min-h-screen">
        <Sidebar rol={rol} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar rol={rol} />
          <main
            id="contenido-principal"
            tabIndex={-1}
            className="flex-1 px-4 py-6 outline-none lg:px-8"
          >
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
    </ProveedorPermisos>
  );
}
