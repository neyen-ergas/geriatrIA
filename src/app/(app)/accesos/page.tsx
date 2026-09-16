import { requerirSesion } from "@/lib/auth";
import { listarAccesos } from "@/lib/accesos-datos";
import { FormularioAcceso } from "./formulario-acceso";

export const metadata = { title: "Accesos · geriatrIA" };

export default async function AccesosPage() {
  await requerirSesion("administration");
  const accesos = await listarAccesos();
  return (
    <div>
      <h1 className="text-2xl font-bold">Accesos</h1>
      <p className="mt-2 text-sm text-slate-600">
        Administrá las cuentas existentes. Las cuentas nuevas quedan sin acceso hasta que
        les asignes un perfil y las habilites.
      </p>
      <ul className="my-5 list-disc space-y-2 pl-5 text-sm text-slate-600">
        <li>
          <strong>Administrador:</strong> todas las secciones, Empleados y Accesos.
        </li>
        <li>
          <strong>Gestión:</strong> consulta y modifica Admisión, Residentes y
          Contabilidad.
        </li>
        <li>
          <strong>Solo lectura:</strong> consulta esas tres secciones sin modificar datos.
        </li>
      </ul>
      <p className="mb-5 text-sm text-slate-600">
        Los cambios se aplican en el siguiente pedido. Suspender el acceso conserva los
        registros de la persona. Debe quedar al menos un Administrador habilitado.
      </p>
      <div className="space-y-4">
        {accesos.map(acceso => (
          <FormularioAcceso
            key={`${acceso.user_id}-${acceso.updated_at}`}
            acceso={acceso}
          />
        ))}
      </div>
    </div>
  );
}
