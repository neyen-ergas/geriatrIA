import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Inbox, Receipt, UserPlus } from "lucide-react";
import { SoloGestion } from "@/components/permisos";
import { requerirSesion } from "@/lib/auth";
import { obtenerInicio, type BloqueInicio } from "@/lib/inicio-datos";
import { listarCuotasSinCrear, type CuotaSinCrear } from "@/lib/cuotas-sin-crear";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { formatearFechaPago } from "@/lib/pagos";

export const metadata: Metadata = { title: "Inicio · geriatrIA" };

function fechaEnEspanol(fechaIso: string): string {
  try {
    const [y, m, d] = fechaIso.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const formateada = new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
    return formateada.charAt(0).toUpperCase() + formateada.slice(1);
  } catch {
    return formatearFechaPago(fechaIso);
  }
}

function ResumenBloque({ bloque }: { bloque: BloqueInicio }): React.ReactElement {
  const resumen = bloque.resumen;
  const elementos = resumen?.elementos.slice(0, 3) ?? [];

  return (
    <section className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{bloque.titulo}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{bloque.descripcion}</p>
        </div>
        <Link
          href={bloque.href}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          aria-label={`Ver ${bloque.titulo}`}
        >
          {resumen && <span className="tabular-nums">{resumen.total}</span>}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {!resumen ? (
        <p role="alert" className="mt-3 text-sm text-rose-700">
          No pudimos cargar este grupo. Abrí la sección para volver a consultar.
        </p>
      ) : resumen.total === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No hay registros en este grupo.</p>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
            {elementos.map(item => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex flex-col gap-0.5 py-2.5 text-sm hover:text-emerald-800 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <span className="font-medium text-slate-900">{item.titulo}</span>
                  <span className="text-slate-500">{item.detalle}</span>
                </Link>
              </li>
            ))}
          </ul>
          {resumen.total > elementos.length && (
            <p className="mt-2 text-xs text-slate-500">
              Mostrando {elementos.length} de {resumen.total}. Abrí la sección para ver el
              resto.
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default async function InicioPage(): Promise<React.ReactElement> {
  await requerirSesion("operational.read");
  const hoy = hoyEnArgentina();
  const bloques = await obtenerInicio(hoy);
  let cuotasSinCrear: CuotaSinCrear[] | null = null;
  try {
    cuotasSinCrear = await listarCuotasSinCrear(hoy.slice(0, 7));
  } catch {
    // Un problema de lectura no debe convertirse en un "todo al día" engañoso.
  }
  const mesActual = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${hoy.slice(0, 7)}-01T12:00:00Z`));

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Hoy en el hogar
        </h1>
        <p className="mt-1 text-sm text-slate-600">{fechaEnEspanol(hoy)}</p>
        <nav aria-label="Accesos rápidos" className="mt-5 flex flex-wrap gap-2">
          <SoloGestion>
            <Link
              href="/admision/nueva"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              <Inbox className="h-4 w-4" aria-hidden="true" />
              Registrar consulta
            </Link>
          </SoloGestion>
          <Link
            href="/admision/agenda"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Ver agenda
          </Link>
          <SoloGestion>
            <Link
              href="/residentes/nuevo"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Registrar ingreso
            </Link>
          </SoloGestion>
          <Link
            href="/contabilidad/vencimientos?alcance=todas"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <Receipt className="h-4 w-4" aria-hidden="true" />
            Ver cuotas vencidas
          </Link>
        </nav>
      </header>

      {cuotasSinCrear === null ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          No pudimos verificar si faltan cuotas por crear este mes. Revisá cada cuenta en
          Contabilidad.
        </div>
      ) : cuotasSinCrear.length > 0 ? (
        <section
          aria-label="Cuotas sin crear"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4"
        >
          <h2 className="font-semibold text-amber-950">
            {cuotasSinCrear.length}{" "}
            {cuotasSinCrear.length === 1 ? "cuota sin crear" : "cuotas sin crear"} en{" "}
            {mesActual}
          </h2>
          <p className="mt-1 text-sm text-amber-900">
            No aparecen como deuda vencida hasta que se crean.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {cuotasSinCrear.slice(0, 5).map(cuota => (
              <li key={cuota.admissionId}>
                <Link
                  href={`/contabilidad/${cuota.admissionId}`}
                  className="inline-flex rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100"
                >
                  Revisar cuenta de {cuota.nombre} →
                </Link>
              </li>
            ))}
          </ul>
          {cuotasSinCrear.length > 5 && (
            <p className="mt-3 text-xs text-amber-900">
              Hay más cuentas por revisar en Contabilidad.
            </p>
          )}
        </section>
      ) : null}

      <section aria-labelledby="resumen-titulo">
        <h2 id="resumen-titulo" className="mb-3 text-lg font-semibold text-slate-900">
          Resumen del día
        </h2>
        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {bloques.map(bloque => (
            <ResumenBloque key={bloque.titulo} bloque={bloque} />
          ))}
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Las cuotas vencidas incluyen solo cuotas ya creadas. Los datos se actualizan al
        volver a abrir esta página.
      </p>
    </div>
  );
}
