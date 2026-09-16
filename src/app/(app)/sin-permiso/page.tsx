import Link from "next/link";

export default function SinPermiso() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Tu perfil no permite esta operación</h1>
      <p className="my-4 text-slate-600">
        Si necesitás otro acceso, consultá al Administrador de la residencia.
      </p>
      <Link href="/" className="underline">
        Volver a Inicio
      </Link>
    </div>
  );
}
