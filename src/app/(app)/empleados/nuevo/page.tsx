import type { Metadata } from "next";
import { requerirSesion } from "@/lib/auth";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { guardarEmpleado } from "../actions";
import { FormularioEmpleado } from "../formulario-empleado";

export const metadata: Metadata = { title: "Registrar empleado · geriatrIA" };
export default async function NuevoEmpleadoPage(): Promise<React.ReactElement> {
  await requerirSesion("administration");
  const hoy = hoyEnArgentina();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Registrar empleado</h1>
      <FormularioEmpleado
        action={guardarEmpleado.bind(null, null, null)}
        valores={{ hired_at: hoy }}
        hoy={hoy}
        volver="/empleados"
      />
    </div>
  );
}
