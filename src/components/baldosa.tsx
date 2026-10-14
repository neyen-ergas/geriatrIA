import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ETIQUETAS_ESTADO, type Estado } from "@/lib/admision";

/**
 * Avance de una consulta por el circuito de admisión, dibujado como una baldosa
 * calcárea: cuatro cuartos iguales que forman la flor central. Cada paso del
 * circuito completa un cuarto, en el sentido de las agujas del reloj.
 *
 * Una consulta descartada conserva la baldosa en contorno: no se borra, se
 * deja de recorrer. El estado siempre se nombra en texto al lado o en
 * `aria-label`; la baldosa no es la única forma de leerlo.
 */
const CUARTOS_COMPLETOS: Record<Estado, number> = {
  nuevo: 1,
  contactado: 2,
  visita_agendada: 3,
  ingreso: 4,
  descartada: 0,
};

const PASOS: readonly Estado[] = ["nuevo", "contactado", "visita_agendada", "ingreso"];

// Un cuarto de la baldosa, en el cuadrante superior izquierdo de un lienzo de
// 40×40: la hoja apunta a la esquina y el triángulo marca la junta exterior.
const HOJA = "M20 20C20 12.5 14.5 5 5 5C5 14.5 12.5 20 20 20Z";
const ESQUINA = "M0 0H8.5L0 8.5Z";

export function Baldosa({
  estado,
  className,
  titulo = true,
}: {
  estado: Estado;
  className?: string;
  /** Con `false` la baldosa es decorativa porque el estado ya se lee al lado. */
  titulo?: boolean;
}): React.ReactElement {
  const completos = CUARTOS_COMPLETOS[estado];
  const descartada = estado === "descartada";
  const terminada = estado === "ingreso";
  const relleno = terminada ? "fill-casona-600" : "fill-ocre-500";
  const etiqueta = descartada
    ? `${ETIQUETAS_ESTADO[estado]}: circuito interrumpido`
    : `${ETIQUETAS_ESTADO[estado]}: paso ${completos} de 4 del circuito de admisión`;

  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-7 w-7 shrink-0", className)}
      role={titulo ? "img" : undefined}
      aria-label={titulo ? etiqueta : undefined}
      aria-hidden={titulo ? undefined : true}
    >
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="39"
        rx="2"
        className={cn(
          descartada
            ? "fill-piedra-100 stroke-piedra-400"
            : "fill-white stroke-piedra-300",
        )}
        strokeWidth="1"
        strokeDasharray={descartada ? "3 2" : undefined}
      />
      {[0, 90, 180, 270].map((giro, indice) => {
        const lleno = indice < completos;
        return (
          <g key={giro} transform={`rotate(${giro} 20 20)`}>
            <path
              d={HOJA}
              className={cn(
                lleno ? relleno : descartada ? "fill-none" : "fill-piedra-100",
                lleno ? "stroke-none" : "stroke-piedra-300",
              )}
              strokeWidth="1"
            />
            <path
              d={ESQUINA}
              className={cn(lleno ? relleno : "fill-none")}
              transform="translate(0.5 0.5)"
            />
          </g>
        );
      })}
      <circle
        cx="20"
        cy="20"
        r="2.25"
        className={terminada ? "fill-white" : "fill-piedra-300"}
      />
    </svg>
  );
}

/**
 * La baldosa grande con los cuatro pasos nombrados, para el detalle de una
 * consulta. El paso actual se destaca y los siguientes quedan en piedra.
 */
export function CircuitoAdmision({ estado }: { estado: Estado }): React.ReactElement {
  const completos = CUARTOS_COMPLETOS[estado];
  const descartada = estado === "descartada";
  return (
    <div className="flex items-center gap-4">
      <Baldosa estado={estado} className="h-14 w-14" />
      <ol
        className="grid gap-1 text-sm sm:flex sm:flex-wrap sm:items-center"
        aria-label="Circuito de admisión"
      >
        {PASOS.map((paso, indice) => {
          const hecho = !descartada && indice < completos;
          const actual = !descartada && indice === completos - 1;
          return (
            <li key={paso} className="flex items-center gap-1">
              {indice > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className="hidden h-3.5 w-3.5 text-piedra-500 sm:block"
                />
              )}
              <span
                aria-current={actual ? "step" : undefined}
                className={cn(
                  "rounded-sm px-1.5 py-0.5",
                  actual && "bg-ocre-100 font-bold text-ocre-950",
                  actual && paso === "ingreso" && "bg-casona-100 text-casona-900",
                  hecho && !actual && "text-piedra-800",
                  !hecho && "text-piedra-500",
                )}
              >
                {ETIQUETAS_ESTADO[paso]}
              </span>
            </li>
          );
        })}
        {descartada && (
          <li className="ml-2 rounded-sm bg-piedra-200 px-1.5 py-0.5 font-semibold text-piedra-800">
            Descartada
          </li>
        )}
      </ol>
    </div>
  );
}

/** Marca de geriatrIA: la baldosa completa, en los colores del riel. */
export function MarcaGeriatria({
  className,
}: {
  className?: string;
}): React.ReactElement {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 40 40" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect
          x="0.5"
          y="0.5"
          width="39"
          height="39"
          rx="3"
          className="fill-casona-950 stroke-casona-700"
        />
        {[0, 90, 180, 270].map(giro => (
          <g key={giro} transform={`rotate(${giro} 20 20)`}>
            <path d={HOJA} className="fill-ocre-300" />
            <path
              d={ESQUINA}
              className="fill-casona-300"
              transform="translate(0.5 0.5)"
            />
          </g>
        ))}
        <circle cx="20" cy="20" r="2.25" className="fill-casona-950" />
      </svg>
      <span className="text-xl font-bold">
        geriatr<span className="text-ocre-300">IA</span>
      </span>
    </span>
  );
}
