import Link from "next/link";
import { Card } from "@/components/ui";
import { FRANJAS, type Franja } from "@/lib/admision";
import { etiquetaDiaAgenda, type SemanaAgenda, type VisitaAgenda } from "@/lib/agenda";

export function GrillaAgenda({ semana, visitas, hoy }: {
  semana: SemanaAgenda;
  visitas: VisitaAgenda[];
  hoy: string;
}): React.ReactElement {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {semana.dias.map(dia => (
        <section key={dia} aria-label={etiquetaDiaAgenda(dia)}>
          <h2 className="mb-3 min-h-12 text-sm font-semibold capitalize text-slate-800">
            <time dateTime={dia}>{etiquetaDiaAgenda(dia)}</time>
            {dia === hoy && <span className="ml-2 text-sky-700">Hoy</span>}
          </h2>
          <div className="space-y-3">
            {(Object.entries(FRANJAS) as [Franja, string][]).map(([franja, etiqueta]) => {
              const visita = visitas.find(v => v.visita_fecha === dia && v.visita_franja === franja);
              return (
                <Card key={franja} className={`min-h-44 p-3 ${visita ? "border-sky-200 bg-sky-50" : "bg-slate-50"}`}>
                  <h3 className="text-xs font-medium text-slate-600">{etiqueta}</h3>
                  {visita ? (
                    <>
                      <p className="mt-2 text-xs font-semibold text-sky-800">Ocupado</p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{visita.nombre}</p>
                      <a href={`tel:${visita.telefono.replace(/\s/g, "")}`} className="mt-2 block break-all text-sm text-sky-800 underline">
                        {visita.telefono}
                      </a>
                      <Link href={`/admision/${visita.id}?semana=${semana.inicio}`} className="mt-3 inline-block text-sm font-medium underline">
                        Ver consulta
                      </Link>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">{dia < hoy ? "Sin visita agendada" : "Libre"}</p>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
