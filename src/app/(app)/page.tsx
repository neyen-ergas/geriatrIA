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
    <div className="space-y-8">
      {/* Showstopper Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-gradient-to-br from-slate-950 via-slate-900 to-[#071f18] p-6 text-white shadow-2xl sm:p-8">
        {/* Glow ambient orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/70 px-3.5 py-1 text-xs font-semibold text-emerald-300 shadow-inner">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              Jornada activa
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-4xl">
              Panel de Control Residencial
            </h1>
            <p className="mt-1.5 text-xs font-medium text-slate-300 sm:text-sm">
              {fechaCompleta} · Pendientes al {formatearFechaPago(hoy)} (Hora de Argentina)
            </p>
          </div>

          {/* Accesos rápidos con estilo glassmorphism */}
          <nav
            aria-label="Accesos rápidos"
            className="flex flex-wrap items-center gap-2.5 text-sm font-medium"
          >
            <Link
              href="/admision/agenda"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-all hover:bg-emerald-50 hover:text-emerald-950 active:scale-[0.98]"
            >
              <Calendar className="h-4 w-4 text-emerald-600" />
              Agenda de visitas
            </Link>
            <SoloGestion>
              <Link
                href="/residentes/nuevo"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98]"
              >
                <UserPlus className="h-4 w-4 text-emerald-400" />
                Registrar ingreso
              </Link>
            </SoloGestion>
            <Link
              href="/contabilidad/vencimientos?alcance=todas"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98]"
            >
              <Receipt className="h-4 w-4 text-amber-400" />
              Revisar cuotas vencidas
            </Link>
            <Link
              href="/admision"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98]"
            >
              <Inbox className="h-4 w-4 text-sky-400" />
              Admisión
            </Link>
          </nav>
        </div>

        {/* KPIs resumidos en cinta horizontal translúcida */}
        <div className="relative z-10 mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-3 lg:grid-cols-5">
          {bloques.map(bloque => {
            const Icono = iconoParaBloque(bloque.titulo);
            const total = bloque.resumen ? bloque.resumen.total : 0;
            return (
              <Link
                key={`kpi-${bloque.titulo}`}
                href={bloque.href}
                className="group flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-white/10 hover:shadow-lg"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-inner group-hover:scale-105 transition-transform">
                  <Icono className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-slate-300">
                    {bloque.titulo}
                  </div>
                  <div className="text-xl font-black tabular-nums tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                    {total}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Sección Operativa */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Monitor de Pendientes Operativos
            </h2>
            <p className="text-xs text-slate-500">
              Grupos clínicos y asistenciales organizados por prioridad
            </p>
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
                className={`flex flex-col justify-between p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${estilo.borde}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-xs ${estilo.bgIcono}`}
                      >
                        <Icono className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {bloque.titulo}
                        </h3>
                        <p className="text-xs text-slate-500">{bloque.descripcion}</p>
                      </div>
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

                  {bloque.resumen ? (
                    <>
                      {bloque.resumen.total === 0 && (
                        <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs font-medium text-emerald-800">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>No hay registros en este grupo.</span>
                        </div>
                      )}
                      <ul className="mt-4 divide-y divide-slate-100">
                        {bloque.resumen.elementos.map(item => (
                          <li key={item.id} className="py-2.5">
                            <Link
                              href={item.href}
                              className="group flex flex-col rounded-xl p-2 transition-colors hover:bg-slate-50"
                            >
                              <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
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
                      className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/80 p-3.5 text-xs font-medium text-rose-800"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                      <span>
                        No pudimos cargar este grupo. Abrí la sección para volver a
                        consultar.
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-3.5">
                  <Link
                    href={bloque.href}
                    className="group inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                  >
                    Abrir sección
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-xs font-medium text-slate-500 shadow-2xs backdrop-blur-xs">
        Los saldos corresponden a cuotas creadas. El panel se actualiza al abrirlo; no se
        refresca automáticamente mientras permanece abierto.
      </div>
    </div>
  );
}
