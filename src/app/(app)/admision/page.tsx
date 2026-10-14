import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { Baldosa } from "@/components/baldosa";
import { Badge, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { requerirSesion } from "@/lib/auth";
import {
  COLORES_ESTADO,
  ESTADOS,
  ETIQUETAS_ESTADO,
  esEstado,
  type Consulta,
  type Estado,
} from "@/lib/admision";
import { contarPorEstado, listarConsultas } from "@/lib/admision-datos";
import { paginaAdmision } from "@/lib/paginacion-admision";
import { busquedaConsultas } from "@/lib/busqueda-consultas";
import { enlaceAdmision } from "@/lib/paginacion-admision";
import { Paginacion } from "./paginacion";
import { SoloGestion } from "@/components/permisos";

export const metadata: Metadata = {
  title: "Admisión · geriatrIA",
};

const fechaRecibida = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

function ConsultaFila({ consulta }: { consulta: Consulta }): React.ReactElement {
  const pendiente = consulta.estado === "nuevo";
  return (
    <li className="grid grid-cols-[auto_1fr] gap-x-4 bg-white p-4 sm:px-5">
      <Baldosa estado={consulta.estado} className="mt-0.5 h-9 w-9" titulo={false} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <Link
            href={`/admision/${consulta.id}`}
            className="text-lg font-bold text-piedra-950 hover:text-casona-800 hover:underline"
          >
            {consulta.nombre}
          </Link>
          <Badge className={COLORES_ESTADO[consulta.estado]}>
            {ETIQUETAS_ESTADO[consulta.estado]}
          </Badge>
        </div>
        <p className="mt-0.5 text-sm text-piedra-600">
          Recibida el {fechaRecibida.format(new Date(consulta.creado_en))}
          {consulta.origen === "telefono"
            ? " · Llamada"
            : consulta.origen === "presencial"
              ? " · Presencial"
              : " · Web"}
        </p>
        {consulta.mensaje && (
          <p className="mt-2 line-clamp-2 max-w-[70ch] text-base text-piedra-800">
            {consulta.mensaje}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={`tel:${consulta.telefono.replace(/[^+\d]/g, "")}`}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-md border px-3.5 text-base font-semibold",
              pendiente
                ? "border-casona-800 bg-casona-700 text-white hover:bg-casona-800"
                : "border-piedra-300 bg-white text-piedra-900 hover:bg-piedra-50",
            )}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Llamar al {consulta.telefono}
          </a>
          <Link
            href={`/admision/${consulta.id}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-base font-semibold text-casona-800 hover:bg-casona-50"
          >
            Abrir consulta
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </li>
  );
}

export default async function AdmisionPage({
  searchParams,
}: {
  searchParams: Promise<{
    estado?: string | string[];
    pagina?: string | string[];
    buscar?: string | string[];
  }>;
}) {
  // El cliente admin saltea RLS, así que la sesión es lo único que separa estos
  // datos de cualquiera. El layout ya la verifica; acá se repite a propósito.
  await requerirSesion("operational.read");

  const { estado: estadoParam, pagina: paginaParam, buscar } = await searchParams;
  const busqueda = busquedaConsultas(buscar);
  const filtro: Estado | undefined = esEstado(estadoParam) ? estadoParam : undefined;

  const conteo = await contarPorEstado(busqueda);
  const totalConsultas = Object.values(conteo).reduce(
    (suma, cantidad) => suma + cantidad,
    0,
  );
  const total = filtro ? conteo[filtro] : totalConsultas;
  const pagina = paginaAdmision(paginaParam, total);
  const consultas = await listarConsultas(filtro, pagina, busqueda);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-piedra-950">Admisión</h1>
          <p className="mt-1 text-base text-piedra-700">
            Elegí una consulta para registrar el llamado, la visita o el ingreso.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SoloGestion>
            <Link
              href="/admision/nueva"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-casona-800 bg-casona-700 px-4 text-base font-semibold text-white hover:bg-casona-800"
            >
              Registrar consulta
            </Link>
          </SoloGestion>
          <Link
            href="/admision/agenda"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-piedra-300 bg-white px-4 text-base font-semibold text-piedra-900 hover:bg-piedra-50"
          >
            Ver agenda semanal
          </Link>
        </div>
      </div>

      <nav aria-label="Filtros por estado" className="flex flex-wrap gap-2">
        <FiltroLink activo={!filtro} busqueda={busqueda} cantidad={totalConsultas}>
          Todas
        </FiltroLink>
        {ESTADOS.map(estado => (
          <FiltroLink
            key={estado}
            estado={estado}
            activo={filtro === estado}
            busqueda={busqueda}
            cantidad={conteo[estado]}
          >
            {ETIQUETAS_ESTADO[estado]}
          </FiltroLink>
        ))}
      </nav>

      <form action="/admision" className="flex flex-wrap items-end gap-3">
        {filtro && <input type="hidden" name="estado" value={filtro} />}
        <label className="block w-full text-sm font-semibold text-piedra-800 sm:w-80">
          Buscar por nombre o teléfono
          <Input
            key={busqueda}
            name="buscar"
            type="search"
            maxLength={80}
            defaultValue={busqueda}
            className="mt-1.5"
          />
        </label>
        <button className="inline-flex min-h-11 items-center justify-center rounded-md border border-piedra-300 bg-white px-4 text-base font-semibold text-piedra-900 hover:bg-piedra-50">
          Buscar
        </button>
        {busqueda && (
          <Link
            href={enlaceAdmision(1, filtro)}
            className="inline-flex min-h-11 items-center text-base font-semibold text-casona-800 underline"
          >
            Limpiar búsqueda
          </Link>
        )}
      </form>

      {busqueda && (
        <p className="mt-3 text-sm text-piedra-500">
          Resultados para «{busqueda}». Los contadores corresponden a esta búsqueda.
        </p>
      )}
      {consultas.length > 0 && (
        <Paginacion pagina={pagina} total={total} estado={filtro} busqueda={busqueda} />
      )}

      {consultas.length === 0 ? (
        <div className="mt-6 rounded-md border border-piedra-200 bg-white p-6 text-sm text-piedra-600">
          {busqueda
            ? "No hay consultas que coincidan con la búsqueda."
            : filtro
              ? `No hay consultas en «${ETIQUETAS_ESTADO[filtro]}».`
              : "Todavía no entró ninguna consulta."}
        </div>
      ) : (
        <ul className="mt-4 grid gap-px overflow-hidden rounded-md border border-piedra-200 bg-piedra-200">
          {consultas.map(consulta => (
            <ConsultaFila key={consulta.id} consulta={consulta} />
          ))}
        </ul>
      )}
      {consultas.length > 0 && (
        <Paginacion pagina={pagina} total={total} estado={filtro} busqueda={busqueda} />
      )}
    </div>
  );
}

function FiltroLink({
  estado,
  activo,
  children,
  busqueda,
  cantidad,
}: {
  estado?: Estado;
  activo: boolean;
  children: React.ReactNode;
  busqueda?: string;
  cantidad: number;
}) {
  return (
    <Link
      href={enlaceAdmision(1, estado, busqueda)}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-md border px-3.5 text-base font-semibold transition-colors",
        activo
          ? "border-ocre-400 bg-ocre-300 text-casona-950"
          : "border-piedra-200 bg-white text-piedra-700 hover:bg-piedra-50",
      )}
    >
      {children}
      <span
        className={cn("tabular-nums", activo ? "text-casona-900" : "text-piedra-600")}
      >
        {cantidad}
      </span>
    </Link>
  );
}
