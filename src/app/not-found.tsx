import Link from "next/link";
import { PantallaAcceso } from "@/components/pantalla-acceso";

export default function NoEncontrado(): React.ReactElement {
  return (
    <PantallaAcceso
      titulo="No encontramos esta página"
      bajada="El enlace puede estar incompleto o el registro ya no está disponible."
    >
      <Link
        href="/"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-casona-800 bg-casona-700 px-4 text-base font-semibold text-white hover:bg-casona-800"
      >
        Volver al inicio
      </Link>
    </PantallaAcceso>
  );
}
