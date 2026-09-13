import type { Metadata } from "next";
import Link from "next/link";
import { Button, Input, Label } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { enlaceVencimientos, mesVencimientos } from "@/lib/vencimientos";
import { listarVencimientos } from "@/lib/vencimientos-datos";
import { ListaVencimientos } from "./lista-vencimientos";

export const metadata: Metadata = { title: "Vencimientos · geriatrIA" };

export default async function VencimientosPage({ searchParams }: {
  searchParams: Promise<{
    mes?: string | string[]; estado?: string | string[]; pagina?: string | string[];
    alcance?: string | string[];
  }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.read");
  const parametros = await searchParams;
  const mes = mesVencimientos(parametros.mes, hoyEnArgentina());
  const todosLosMeses = parametros.alcance === "todas";
  const vencidas = todosLosMeses || parametros.estado === "vencidas";
  const { vencimientos, total, pagina } = await listarVencimientos(mes, vencidas, parametros.pagina, todosLosMeses);
  return (
    <div>
      <Link href="/contabilidad" className="text-sm font-medium text-sky-700 hover:underline">← Volver a Contabilidad</Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">{todosLosMeses ? "Cuotas vencidas de todos los meses" : "Vencimientos del mes"}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Cuotas creadas con saldo pendiente, incluidas las de estadías finalizadas.
        Se usa el vencimiento confirmado al crear cada cuota.
      </p>
      <Link href={todosLosMeses ? "/contabilidad/vencimientos" : "/contabilidad/vencimientos?alcance=todas"} className="mt-4 inline-block text-sm underline">
        {todosLosMeses ? "Consultar un mes" : "Ver todas las cuotas vencidas"}
      </Link>
      {!todosLosMeses && <form action="/contabilidad/vencimientos" method="get"
        className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <Label htmlFor="mes">Mes de vencimiento</Label>
          <Input id="mes" name="mes" type="month" required defaultValue={mes} key={mes} />
        </div>
        <div>
          <Label htmlFor="estado">Mostrar</Label>
          <select id="estado" name="estado" defaultValue={vencidas ? "vencidas" : "pendientes"}
            key={String(vencidas)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">
            <option value="pendientes">Todas con saldo</option>
            <option value="vencidas">Solo vencidas</option>
          </select>
        </div>
        <Button type="submit">Consultar</Button>
      </form>}
      <ListaVencimientos vencimientos={vencimientos} vencidas={vencidas} todosLosMeses={todosLosMeses} />
      <PaginacionListado pagina={pagina} total={total} etiqueta="cuotas con saldo"
        anterior={enlaceVencimientos(mes, vencidas, pagina - 1, todosLosMeses)}
        siguiente={enlaceVencimientos(mes, vencidas, pagina + 1, todosLosMeses)} />
      <p className="mt-4 text-xs text-slate-500">
        {todosLosMeses ? "Este listado incluye vencimientos de cualquier mes, pero no períodos sin cuota creada." : "Este listado no incluye períodos sin cuota creada ni saldos de otros meses."}
      </p>
    </div>
  );
}
