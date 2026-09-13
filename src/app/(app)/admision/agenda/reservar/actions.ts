"use server";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth";
import { semanaAgenda } from "@/lib/agenda";
import { agendarVisita, type Resultado } from "../../actions";

export async function reservarVisita(fecha: string, franja: string, anterior: Resultado, datos: FormData): Promise<Resultado> {
  await requerirSesion();
  datos.set("visita_fecha", fecha);
  datos.set("visita_franja", franja);
  const resultado = await agendarVisita(anterior, datos);
  if (!resultado.ok) return resultado;
  redirect(`/admision/${datos.get("id")}?semana=${semanaAgenda(fecha, fecha).inicio}`);
}
