import { logout } from "@/app/login/actions";
import { Button, Card } from "@/components/ui";

export default function SinAcceso() {
  return <main className="mx-auto max-w-lg px-4 py-16"><Card className="p-6">
    <h1 className="text-xl font-semibold">Tu cuenta no tiene acceso habilitado</h1>
    <p className="my-4 text-slate-600">Pedile al Administrador de la residencia que revise tu perfil.</p>
    <form action={logout}><Button type="submit">Cerrar sesión</Button></form>
  </Card></main>;
}
