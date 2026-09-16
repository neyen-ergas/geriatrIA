import { notFound } from "next/navigation";
import Link from "next/link";
import { requerirSesion } from "@/lib/auth";
import { obtenerEmpleado } from "@/lib/empleados-datos";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { guardarEmpleado } from "../../actions";
import { FormularioEmpleado } from "../../formulario-empleado";

export default async function EditarEmpleadoPage({
  params,
}: {
  params: Promise<{ empleadoId: string }>;
}): Promise<React.ReactElement> {
  await requerirSesion("administration");
  const empleado = await obtenerEmpleado((await params).empleadoId);
  if (!empleado) notFound();
  const volver = `/empleados/${empleado.id}`;
  if (empleado.terminated_at)
    return (
      <p>
        La ficha está dada de baja.{" "}
        <Link href={volver} className="underline">
          Ver ficha
        </Link>
      </p>
    );
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Editar empleado</h1>
      <FormularioEmpleado
        key={empleado.updated_at}
        hoy={hoyEnArgentina()}
        volver={volver}
        action={guardarEmpleado.bind(null, empleado.id, empleado.updated_at)}
        valores={{
          first_name: empleado.first_name,
          last_name: empleado.last_name,
          dni: empleado.dni,
          job_title: empleado.job_title,
          hired_at: empleado.hired_at,
          birth_date: empleado.birth_date ?? "",
          phone: empleado.phone ?? "",
          email: empleado.email ?? "",
          notes: empleado.notes ?? "",
        }}
      />
    </div>
  );
}
