import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Filter } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { enlaceVencimientos, mesVencimientos } from "@/lib/vencimientos";
import { listarVencimientos } from "@/lib/vencimientos-datos";
import { ListaVencimientos } from "./lista-vencimientos";

export const metadata: Metadata = { title: "Vencimientos · geriatrIA" };

export default async function VencimientosPage({
  searchParams,
}: {
  searchParams: Promise<{
    mes?: string | string[];
    estado?: string | string[];
    pagina?: string | string[];
    alcance?: string | string[];
  }>;
}): Promise<React.ReactElement> {
  await requerirSesion("operational.read");
  const parametros = await searchParams;
  const mes = mesVencimientos(parametros.mes, hoyEnArgentina());
  const todosLosMeses = parametros.alcance === "todas";
  const vencidas = todosLosMeses || parametros.estado === "vencidas";
  const { vencimientos, total, pagina } = await listarVencimientos(
    mes,
    vencidas,
    parametros.pagina,
    todosLosMeses,
  );
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/contabilidad"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Contabilidad
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Gestión de Cobranzas
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {todosLosMeses
              ? "Cuotas vencidas de todos los meses"
              : "Vencimientos del mes"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cuotas creadas con saldo pendiente, incluidas las de estadías finalizadas. Se
            usa el vencimiento confirmado al crear cada cuota.
          </p>
        </div>
      </div>

      {/* Segmented Control de Alcance */}
      <nav
        aria-label="Alcance de vencimientos"
        className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-2xs text-xs font-semibold text-slate-700"
      >
        <Link
          href="/contabilidad/vencimientos"
          className={`rounded-xl px-4 py-2 transition-all ${
            !todosLosMeses
              ? "bg-slate-900 text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
          }`}
        >
          Consultar un mes
        </Link>
        <Link
          href="/contabilidad/vencimientos?alcance=todas"
          className={`rounded-xl px-4 py-2 transition-all ${
            todosLosMeses
              ? "bg-slate-900 text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
          }`}
        >
          Ver todas las cuotas vencidas
        </Link>
      </nav>

      {!todosLosMeses && (
        <Card className="p-5 shadow-2xs">
          <form
            action="/contabilidad/vencimientos"
            method="get"
            className="flex flex-wrap items-end gap-4"
          >
            <div className="min-w-[180px]">
              <Label htmlFor="mes" className="text-xs font-bold text-slate-700">
                Mes de vencimiento
              </Label>
              <Input
                id="mes"
                name="mes"
                type="month"
                required
                defaultValue={mes}
                key={mes}
                className="mt-1.5"
              />
            </div>
            <div className="min-w-[180px]">
              <Label htmlFor="estado" className="text-xs font-bold text-slate-700">
                Mostrar
              </Label>
              <select
                id="estado"
                name="estado"
                defaultValue={vencidas ? "vencidas" : "pendientes"}
                key={String(vencidas)}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="pendientes">Todas con saldo</option>
                <option value="vencidas">Solo vencidas</option>
              </select>
            </div>
            <Button type="submit" size="sm" className="h-10 px-5 shadow-2xs">
              <Filter className="h-3.5 w-3.5" />
              Consultar
            </Button>
          </form>
        </Card>
      )}

      <ListaVencimientos
        vencimientos={vencimientos}
        vencidas={vencidas}
        todosLosMeses={todosLosMeses}
      />

      <PaginacionListado
        pagina={pagina}
        total={total}
        etiqueta="cuotas con saldo"
        anterior={enlaceVencimientos(mes, vencidas, pagina - 1, todosLosMeses)}
        siguiente={enlaceVencimientos(mes, vencidas, pagina + 1, todosLosMeses)}
      />

      <p className="mt-4 text-xs text-slate-400">
        {todosLosMeses
          ? "Este listado incluye vencimientos de cualquier mes, pero no períodos sin cuota creada."
          : "Este listado no incluye períodos sin cuota creada ni saldos de otros meses."}
      </p>
    </div>
  );
}
