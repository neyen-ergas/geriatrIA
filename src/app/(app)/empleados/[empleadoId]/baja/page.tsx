import { notFound } from "next/navigation";
import Link from "next/link";
import { requerirSesion } from "@/lib/auth";
import { obtenerEmpleado } from "@/lib/empleados-datos";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { darBajaEmpleado } from "../../actions";
import { FormularioEmpleado } from "../../formulario-empleado";

export default async function BajaEmpleadoPage({ params }: { params: Promise<{ empleadoId: string }> }): Promise<React.ReactElement> {
  await requerirSesion();
  const empleado = await obtenerEmpleado((await params).empleadoId);
  if (!empleado) notFound();
  const volver = `/empleados/${empleado.id}`;
  if (empleado.terminated_at) return <p>La baja ya está registrada. <Link href={volver} className="underline">Ver ficha</Link></p>;
  const hoy = hoyEnArgentina();
  return <div className="mx-auto max-w-3xl"><h1 className="text-2xl font-bold">Dar de baja a {empleado.first_name} {empleado.last_name}</h1>
    <FormularioEmpleado key={empleado.updated_at} action={darBajaEmpleado.bind(null, empleado.id, empleado.updated_at)} baja hoy={hoy}
      valores={{ hired_at: empleado.hired_at, terminated_at: hoy }} volver={volver} />
  </div>;
}
