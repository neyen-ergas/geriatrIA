"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Phone, ArrowRight, CalendarPlus } from "lucide-react";
import { usePuedeGestionar } from "@/components/permisos";
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
  const puedeGestionar = usePuedeGestionar();
  const [mostrarPasados, setMostrarPasados] = useState(semana.fin < hoy);
  const tieneDiasPasados = semana.dias.some(dia => dia < hoy) && semana.fin >= hoy;
  return (
    <>
      {tieneDiasPasados && (
        <button
          type="button"
          onClick={() => setMostrarPasados(valor => !valor)}
          className="mt-3 rounded-md border border-piedra-200 bg-white px-3 py-2 text-sm font-semibold text-piedra-700 sm:hidden"
        >
          {mostrarPasados ? "Ocultar días anteriores" : "Ver días anteriores"}
        </button>
      )}
      <div className="mt-3 grid gap-px overflow-hidden rounded-md border border-piedra-200 bg-piedra-200 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        {semana.dias.map(dia => {
          const esHoy = dia === hoy;
          const pasado = dia < hoy;
          return (
            <section
              key={dia}
              aria-label={etiquetaDiaAgenda(dia)}
              className={cn(
                "flex flex-col p-3",
                pasado && !mostrarPasados && "hidden sm:flex",
                esHoy ? "bg-ocre-50" : pasado ? "bg-piedra-50" : "bg-white",
              )}
            >
              <h2 className="mb-3 flex min-h-9 items-center justify-between gap-2 text-base font-bold capitalize text-piedra-950">
                <time dateTime={dia}>{etiquetaDiaAgenda(dia)}</time>
                {esHoy && (
                  <span className="rounded-sm bg-ocre-300 px-1.5 py-0.5 text-sm font-bold text-casona-950 normal-case">
                    Hoy
                  </span>
                )}
              </h2>
              <div className="grid flex-1 gap-2">
                {(Object.entries(FRANJAS) as [Franja, string][]).map(
                  ([franja, etiqueta]) => {
                    const visita = visitas.find(
                      v => v.visita_fecha === dia && v.visita_franja === franja,
                    );
                    if (visita)
                      return (
                        <div
                          key={franja}
                          className="rounded-md border border-casona-300 bg-casona-50 p-3"
                        >
                          <p className="flex flex-wrap items-center justify-between gap-1 text-sm font-semibold text-casona-800">
                            <span>{etiqueta}</span>
                            <span className="rounded-sm bg-casona-700 px-1.5 text-white">
                              Ocupado
                            </span>
                          </p>
                          <p className="mt-1.5 break-words text-base font-bold text-piedra-950">
                            {visita.nombre}
                          </p>
                          <a
                            href={`tel:${visita.telefono.replace(/\s/g, "")}`}
                            className="mt-1 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-casona-800 hover:underline"
                          >
                            <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {visita.telefono}
                          </a>
                          <Link
                            href={`/admision/${visita.id}?semana=${semana.inicio}`}
                            className="flex min-h-9 items-center gap-1 text-sm font-semibold text-piedra-800 hover:text-piedra-950 hover:underline"
                          >
                            Ver consulta
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      );
                    if (pasado)
                      return (
                        <div
                          key={franja}
                          className="rounded-md border border-piedra-200 p-3 text-sm text-piedra-600"
                        >
                          <p className="font-semibold">{etiqueta}</p>
                          <p className="mt-1">Sin visita agendada</p>
                        </div>
                      );
                    return (
                      <div key={franja} className="flex flex-col">
                        {!puedeGestionar ? (
                          <div className="rounded-md border border-dashed border-piedra-300 p-3 text-sm text-piedra-600">
                            <p className="font-semibold">{etiqueta}</p>
                            <p className="mt-1">Libre</p>
                          </div>
                        ) : (
                          <Link
                            href={`/admision/agenda/reservar?fecha=${dia}&franja=${franja}`}
                            className="group flex flex-1 flex-col rounded-md border border-dashed border-piedra-300 p-3 text-sm hover:border-casona-600 hover:bg-casona-50"
                          >
                            <span className="font-semibold text-piedra-700">
                              {etiqueta}
                            </span>
                            <span className="text-piedra-600">Libre</span>
                            <span className="mt-2 inline-flex items-center gap-1.5 font-semibold text-casona-800 group-hover:underline">
                              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                              <span>Reservar visita</span>
                            </span>
                          </Link>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </section>
          );
        })}
        <div aria-hidden="true" className="hidden bg-piedra-50 lg:block 2xl:hidden" />
      </div>
    </>
  );
}
