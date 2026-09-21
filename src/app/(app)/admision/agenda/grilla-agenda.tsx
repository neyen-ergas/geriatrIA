import Link from "next/link";
import { Phone, ArrowRight, CalendarPlus } from "lucide-react";
import { SoloGestion } from "@/components/permisos";
import { Card } from "@/components/ui";
import { FRANJAS, type Franja } from "@/lib/admision";
import { etiquetaDiaAgenda, type SemanaAgenda, type VisitaAgenda } from "@/lib/agenda";

export function GrillaAgenda({
  semana,
  visitas,
  hoy,
}: {
  semana: SemanaAgenda;
  visitas: VisitaAgenda[];
  hoy: string;
}): React.ReactElement {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {semana.dias.map(dia => {
        const esHoy = dia === hoy;
        return (
          <section
            key={dia}
            aria-label={etiquetaDiaAgenda(dia)}
            className={
              esHoy
                ? "rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/[0.04] p-2.5 shadow-sm ring-4 ring-emerald-500/5"
                : "rounded-2xl border border-slate-200/80 bg-slate-50/40 p-2.5"
            }
          >
            <h2 className="mb-3 flex min-h-11 items-center justify-between text-xs font-bold capitalize text-slate-800 border-b border-slate-200/50 pb-2">
              <time dateTime={dia} className="truncate">
                {etiquetaDiaAgenda(dia)}
              </time>
              {esHoy && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-300/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping" />
                  Hoy
                </span>
              )}
            </h2>
            <div className="space-y-2.5">
              {(Object.entries(FRANJAS) as [Franja, string][]).map(
                ([franja, etiqueta]) => {
                  const visita = visitas.find(
                    v => v.visita_fecha === dia && v.visita_franja === franja,
                  );
                  return (
                    <Card
                      key={franja}
                      className={`min-h-44 p-3.5 transition-all duration-200 ${
                        visita
                          ? "border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 shadow-2xs hover:shadow-xs"
                          : "border-slate-200/70 bg-white/80 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          {etiqueta}
                        </span>
                        {visita ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-100/90 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            Ocupado
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {dia < hoy ? "Sin visita agendada" : "Libre"}
                          </span>
                        )}
                      </div>

                      {visita ? (
                        <div className="mt-2.5 flex flex-col justify-between">
                          <div>
                            <p className="break-words text-sm font-bold tracking-tight text-slate-900">
                              {visita.nombre}
                            </p>
                            <a
                              href={`tel:${visita.telefono.replace(/\s/g, "")}`}
                              className="mt-1.5 inline-flex items-center gap-1 break-all text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                            >
                              <Phone className="h-3 w-3 shrink-0 text-emerald-600" />
                              {visita.telefono}
                            </a>
                          </div>
                          <Link
                            href={`/admision/${visita.id}?semana=${semana.inicio}`}
                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                          >
                            Ver consulta
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      ) : (
                        <div className="mt-3 flex flex-col justify-between">
                          <p className="text-xs text-slate-400">
                            {dia < hoy ? "Período concluido" : "Turno disponible"}
                          </p>
                          {dia >= hoy && (
                            <SoloGestion>
                              <Link
                                href={`/admision/agenda/reservar?fecha=${dia}&franja=${franja}`}
                                className="mt-3 inline-flex items-center justify-center gap-1 rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 hover:shadow-xs active:scale-[0.98]"
                              >
                                <CalendarPlus className="h-3 w-3" />
                                Reservar visita
                              </Link>
                            </SoloGestion>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                },
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
