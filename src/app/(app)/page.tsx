import type { Metadata } from "next";
import Link from "next/link";
import {
  Calendar,
  CalendarDays,
  Clock,
  UserPlus,
  PhoneCall,
  Receipt,
  Users,
  ArrowRight,
  Inbox,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { SoloGestion } from "@/components/permisos";
import { Card } from "@/components/ui";
import { requerirSesion } from "@/lib/auth";
import { obtenerInicio, type BloqueInicio } from "@/lib/inicio-datos";
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

function iconoParaBloque(titulo: string) {
  const t = titulo.toLowerCase();
  if (t.includes("consulta")) return PhoneCall;
  if (t.includes("hoy")) return Clock;
  if (t.includes("mañana")) return CalendarDays;
  if (t.includes("cuota")) return Receipt;
  return Users;
}

function estiloParaBloque(titulo: string) {
  const t = titulo.toLowerCase();
  if (t.includes("consulta")) {
    return {
      bgIcono: "bg-amber-100/80 text-amber-700",
      badge: "bg-amber-50 text-amber-700 border-amber-200/80",
      borde: "border-slate-200/80 hover:border-amber-300",
    };
  }
  if (t.includes("hoy")) {
    return {
      bgIcono: "bg-emerald-100/80 text-emerald-700",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      borde:
        "border-emerald-200/80 bg-gradient-to-b from-emerald-50/20 via-white to-white hover:border-emerald-300",
    };
  }
  if (t.includes("mañana")) {
    return {
      bgIcono: "bg-sky-100/80 text-sky-700",
      badge: "bg-sky-50 text-sky-700 border-sky-200/80",
      borde: "border-slate-200/80 hover:border-sky-300",
    };
  }
  if (t.includes("cuota")) {
    return {
      bgIcono: "bg-rose-100/80 text-rose-700",
      badge: "bg-rose-50 text-rose-700 border-rose-200/80",
      borde: "border-slate-200/80 hover:border-rose-300",
    };
  }
  return {
    bgIcono: "bg-indigo-100/80 text-indigo-700",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    borde: "border-slate-200/80 hover:border-indigo-300",
  };
}

export default async function InicioPage(): Promise<React.ReactElement> {
  await requerirSesion("operational.read");
  const hoy = hoyEnArgentina();
  const bloques = await obtenerInicio(hoy);
  const fechaCompleta = fechaEnEspanol(hoy);

  return (
    <div className="space-y-7">
      {/* Hero Header */}
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/40 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] sm:p-7">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Jornada activa
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Panel de Inicio
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {fechaCompleta} · Pendientes al {formatearFechaPago(hoy)} (Hora de Argentina)
            </p>
          </div>

          {/* Accesos rápidos */}
          <nav
            aria-label="Accesos rápidos"
            className="flex flex-wrap items-center gap-2.5 text-sm font-medium"
          >
            <Link
              href="/admision/agenda"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 hover:shadow-xs active:scale-[0.98]"
            >
              <Calendar className="h-4 w-4" />
              Agenda de visitas
            </Link>
            <SoloGestion>
              <Link
                href="/residentes/nuevo"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-[0.98]"
              >
                <UserPlus className="h-4 w-4 text-emerald-600" />
                Registrar ingreso
              </Link>
            </SoloGestion>
            <Link
              href="/contabilidad/vencimientos?alcance=todas"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-[0.98]"
            >
              <Receipt className="h-4 w-4 text-amber-600" />
              Revisar cuotas vencidas
            </Link>
            <Link
              href="/admision"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-[0.98]"
            >
              <Inbox className="h-4 w-4 text-sky-600" />
              Admisión
            </Link>
          </nav>
        </div>

        {/* KPIs resumidos en cinta horizontal */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3 lg:grid-cols-5">
          {bloques.map(bloque => {
            const Icono = iconoParaBloque(bloque.titulo);
            const estilo = estiloParaBloque(bloque.titulo);
            const total = bloque.resumen ? bloque.resumen.total : 0;
            return (
              <Link
                key={`kpi-${bloque.titulo}`}
                href={bloque.href}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xs"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-2xs ${estilo.bgIcono}`}
                >
                  <Icono className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-slate-500">
                    {bloque.titulo}
                  </div>
                  <div className="text-lg font-extrabold tabular-nums text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {bloque.resumen ? total : "—"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Grilla operativa con tarjetas detalladas */}
      <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
        {bloques.map(bloque => {
          const Icono = iconoParaBloque(bloque.titulo);
          const estilo = estiloParaBloque(bloque.titulo);

          return (
            <Card
              key={bloque.titulo}
              className={`flex flex-col justify-between p-6 transition-all duration-200 hover:shadow-xs ${estilo.borde}`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-2xs ${estilo.bgIcono}`}
                    >
                      <Icono className="h-4 w-4" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      {bloque.titulo}
                    </h2>
                  </div>
                  {bloque.resumen && (
                    <Link
                      href={bloque.href}
                      aria-label={`Abrir ${bloque.titulo}`}
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-extrabold tabular-nums transition hover:opacity-80 shadow-2xs ${estilo.badge}`}
                    >
                      {bloque.resumen.total}
                    </Link>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-slate-500">{bloque.descripcion}</p>

                {bloque.resumen ? (
                  <>
                    {bloque.resumen.total === 0 && (
                      <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50/90 border border-slate-100 p-3 text-xs text-slate-500">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>No hay registros en este grupo.</span>
                      </div>
                    )}
                    <ul className="mt-4 divide-y divide-slate-100/80">
                      {bloque.resumen.elementos.map(item => (
                        <li key={item.id} className="py-2">
                          <Link
                            href={item.href}
                            className="group flex flex-col rounded-xl p-2 transition-colors hover:bg-slate-50/90"
                          >
                            <span className="font-semibold text-sky-900 group-hover:text-sky-950 transition-colors text-sm">
                              {item.titulo}
                            </span>
                            <span className="mt-0.5 text-xs text-slate-500">
                              {item.detalle}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {bloque.resumen.total > bloque.resumen.elementos.length && (
                      <p className="mt-3 text-xs font-medium text-slate-400">
                        Mostrando {bloque.resumen.elementos.length} de{" "}
                        {bloque.resumen.total}.
                      </p>
                    )}
                  </>
                ) : (
                  <div
                    role="alert"
                    className="mt-5 flex items-start gap-2 rounded-xl bg-red-50/80 border border-red-100 p-3 text-xs text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <span>
                      No pudimos cargar este grupo. Abrí la sección para volver a
                      consultar.
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3">
                <Link
                  href={bloque.href}
                  className="group inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                >
                  Abrir sección
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 text-xs text-slate-500 shadow-2xs">
        Los saldos corresponden a cuotas creadas. El panel se actualiza al abrirlo; no se
        refresca automáticamente mientras permanece abierto.
      </div>
    </div>
  );
}
