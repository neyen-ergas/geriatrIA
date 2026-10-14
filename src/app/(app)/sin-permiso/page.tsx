import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui";

export default function SinPermiso() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-6">
      <Card className="max-w-lg p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <ShieldAlert
            className="mt-1 h-7 w-7 shrink-0 text-oxido-700"
            aria-hidden="true"
          />
          <div>
            <h1 className="text-2xl font-bold text-piedra-950">
              Tu perfil no permite esta operación
            </h1>
            <p className="mt-2 text-base text-piedra-700">
              Si necesitás otro acceso, consultá al Administrador de la residencia.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md border border-casona-800 bg-casona-700 px-4 text-base font-semibold text-white hover:bg-casona-800"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver a Inicio
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
