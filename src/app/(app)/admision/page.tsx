import type { Metadata } from "next";
import Link from "next/link";
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
  return (
    <li className="p-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/admision/${consulta.id}`}
            className="text-base font-semibold text-slate-900 hover:text-emerald-800 hover:underline"
          >
            {consulta.nombre}
          </Link>
          <p className="mt-1 text-sm text-slate-500">
            Recibida el {fechaRecibida.format(new Date(consulta.creado_en))}
            {consulta.origen === "telefono"
              ? " · Llamada"
              : consulta.origen === "presencial"
                ? " · Presencial"
                : " · Web"}
          </p>
          {consulta.mensaje && (
            <p className="mt-1 line-clamp-1 text-sm text-slate-600">{consulta.mensaje}</p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
            COLORES_ESTADO[consulta.estado],
          )}
        >
          {ETIQUETAS_ESTADO[consulta.estado]}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <a
          href={`tel:${consulta.telefono.replace(/[^+\d]/g, "")}`}
          className="font-medium text-slate-700 hover:text-emerald-800 hover:underline"
        >
          Llamar al {consulta.telefono}
        </a>
        <Link
          href={`/admision/${consulta.id}`}
          className="font-semibold text-emerald-800 hover:underline"
        >
          Abrir consulta →
        </Link>
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
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Admisión
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Elegí una consulta para registrar el llamado, la visita o el ingreso.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SoloGestion>
            <Link
              href="/admision/nueva"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
            >
              Registrar consulta
            </Link>
          </SoloGestion>
          <Link
            href="/admision/agenda"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
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
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Nombre o teléfono
          <input
            key={busqueda}
            name="buscar"
            maxLength={80}
            defaultValue={busqueda}
            placeholder="Buscar por nombre o teléfono..."
            className="mt-1.5 block w-64 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none shadow-2xs hover:border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all"
          />
        </label>
        <button className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 active:scale-[0.98] transition-all">
          Buscar
        </button>
        {busqueda && (
          <Link
            href={enlaceAdmision(1, filtro)}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 underline pb-2"
          >
            Limpiar búsqueda
          </Link>
        )}
      </form>

      {busqueda && (
        <p className="mt-3 text-sm text-slate-500">
          Resultados para «{busqueda}». Los contadores corresponden a esta búsqueda.
        </p>
      )}
      {consultas.length > 0 && (
        <Paginacion pagina={pagina} total={total} estado={filtro} busqueda={busqueda} />
      )}

      {consultas.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          {busqueda
            ? "No hay consultas que coincidan con la búsqueda."
            : filtro
              ? `No hay consultas en «${ETIQUETAS_ESTADO[filtro]}».`
              : "Todavía no entró ninguna consulta."}
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
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
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        activo
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      )}
    >
      {children}
      <span className={cn("tabular-nums", activo ? "text-slate-300" : "text-slate-500")}>
        {cantidad}
      </span>
    </Link>
  );
}
