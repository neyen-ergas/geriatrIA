import { logout } from "@/app/login/actions";
import { PantallaAcceso } from "@/components/pantalla-acceso";
import { Button } from "@/components/ui";

export default function SinAcceso() {
  return (
    <PantallaAcceso
      titulo="Tu cuenta todavía no tiene acceso"
      bajada="Pedile al Administrador de la residencia que revise tu perfil y habilite los permisos que necesitás."
    >
      <form action={logout}>
        <Button type="submit" variant="outline" className="w-full">
          Cerrar sesión
        </Button>
      </form>
    </PantallaAcceso>
  );
}
