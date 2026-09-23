import { ShieldAlert } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Button, Card } from "@/components/ui";

export default function SinAcceso() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-600/20 shadow-xs">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <Card className="rounded-3xl border border-slate-200/80 bg-white/95 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm text-center">
          <h1 className="text-xl font-bold text-slate-900">
            Tu cuenta no tiene acceso habilitado
          </h1>
          <p className="my-3 text-sm text-slate-500 leading-relaxed">
            Pedile al Administrador de la residencia que revise tu perfil y habilite los
            permisos correspondientes.
          </p>
          <form action={logout} className="mt-6">
            <Button type="submit" variant="secondary" className="w-full">
              Cerrar sesión
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
