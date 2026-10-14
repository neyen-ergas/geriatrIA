import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Inbox, Receipt, UserPlus } from "lucide-react";
import { SoloGestion } from "@/components/permisos";
import { requerirSesion } from "@/lib/auth";
import { obtenerInicio, type BloqueInicio } from "@/lib/inicio-datos";
import { listarCuotasSinCrear, type CuotaSinCrear } from "@/lib/cuotas-sin-crear";
import { hoyEnArgentina } from "@/lib/primer-ingreso";
import { formatearFechaPago } from "@/lib/pagos";
import { cn } from "@/lib/utils";
import { Baldosa } from "@/components/baldosa";
import type { Estado } from "@/lib/admision";

export const metadata: Metadata = { title: "Inicio · geriatrIA" };

function fechaEnEspanol(fechaIso: string): string {
  try {
    const [y, m, d] = fechaIso.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const formateada = new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(date);
    return formateada.charAt(0).toUpperCase() + formateada.slice(1);
  } catch {
    return formatearFechaPago(fechaIso);
  }
}

type Tono = "pendiente" | "critico" | "agenda" | "neutro";

const TONOS: Record<string, Tono> = {
  "Consultas sin llamar": "pendiente",
  "Visitas de hoy": "agenda",
  "Visitas de mañana": "agenda",
  "Cuotas vencidas": "critico",
};

/** Las filas que son familias en el circuito de admisión muestran su baldosa. */
const ESTADO_FILAS: Record<string, Estado> = {
  "Consultas sin llamar": "nuevo",
  "Visitas de hoy": "visita_agendada",
  "Visitas de mañana": "visita_agendada",
};

const COLOR_CANTIDAD: Record<Tono, string> = {
  pendiente: "text-ocre-800",
  critico: "text-oxido-700",
  agenda: "text-casona-700",
  neutro: "text-piedra-800",
};

/** Una baldosa del piso de Inicio: un grupo de pendientes con su cantidad. */
function ResumenBloque({ bloque }: { bloque: BloqueInicio }): React.ReactElement {
  const resumen = bloque.resumen;
  const elementos = resumen?.elementos.slice(0, 3) ?? [];
  const tono = TONOS[bloque.titulo] ?? "neutro";
  const estado = ESTADO_FILAS[bloque.titulo];
  const vacio = resumen?.total === 0;

  return (
    <section className="flex flex-col bg-white p-5" aria-labelledby={idBloque(bloque)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id={idBloque(bloque)} className="text-lg font-bold text-piedra-950">
            {bloque.titulo}
          </h3>
          <p className="mt-0.5 text-sm text-piedra-600">{bloque.descripcion}</p>
        </div>
        {resumen && (
          <span
            className={cn(
              "text-4xl leading-none font-bold tabular-nums",
              vacio ? "text-piedra-300" : COLOR_CANTIDAD[tono],
            )}
          >
            {resumen.total}
          </span>
        )}
      </div>

      {!resumen ? (
        <p role="alert" className="mt-4 text-base text-oxido-700">
          No pudimos cargar este grupo. Abrí la sección para volver a consultar.
        </p>
      ) : vacio ? (
        <p className="mt-4 text-base text-piedra-600">No hay registros en este grupo.</p>
      ) : (
        <ul className="mt-4 divide-y divide-piedra-200 border-y border-piedra-200">
          {elementos.map(item => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex min-h-12 items-center gap-3 py-2 hover:bg-piedra-50"
              >
                {estado && <Baldosa estado={estado} titulo={false} />}
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-semibold text-piedra-950 group-hover:text-casona-800 group-hover:underline">
                    {item.titulo}
                  </span>
                  <span className="text-sm text-piedra-600">{item.detalle}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        {resumen && resumen.total > elementos.length && elementos.length > 0 ? (
          <p className="text-sm text-piedra-600">
            Mostrando {elementos.length} de {resumen.total}
          </p>
        ) : (
          <span />
        )}
        <Link
          href={bloque.href}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-base font-semibold text-casona-800 hover:bg-casona-50"
          aria-label={`Ver ${bloque.titulo}`}
        >
          Abrir
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function idBloque(bloque: BloqueInicio): string {
  return `bloque-${bloque.href.replace(/[^a-z]/gi, "-")}-${bloque.titulo.length}`;
}

/**
 * La única próxima decisión del día, en el orden en que la resuelve el equipo:
 * primero quien espera un llamado, después quien viene hoy, después la deuda.
 */
function proximoPaso(bloques: BloqueInicio[]): {
  texto: string;
  detalle: string;
  href: string;
  tono: Tono;
  accion: string;
  estado?: Estado;
} | null {
  const buscar = (titulo: string) =>
    bloques.find(b => b.titulo === titulo)?.resumen?.elementos[0];
  const llamar = buscar("Consultas sin llamar");
  if (llamar)
    return {
      texto: `Llamar a ${llamar.titulo}`,
      detalle: `Es la consulta que más tiempo lleva esperando · ${llamar.detalle}`,
      href: llamar.href,
      tono: "pendiente",
      accion: "Abrir consulta",
      estado: "nuevo",
    };
  const visita = buscar("Visitas de hoy");
  if (visita)
    return {
      texto: `Recibir a ${visita.titulo}`,
      detalle: `Visita de hoy · ${visita.detalle}`,
      href: visita.href,
      tono: "agenda",
      accion: "Abrir consulta",
      estado: "visita_agendada",
    };
  const cuota = buscar("Cuotas vencidas");
  if (cuota)
    return {
      texto: `Revisar la cuota de ${cuota.titulo}`,
      detalle: cuota.detalle,
      href: cuota.href,
      tono: "critico",
      accion: "Abrir cuota",
    };
  return null;
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

  const paso = proximoPaso(bloques);
  const cargoTodo = bloques.every(b => b.resumen);

  return (
    <div className="space-y-6">
      <header>
        <div>
          <h1 className="text-4xl font-bold text-piedra-950 sm:text-5xl">
            Hoy, {fechaEnEspanol(hoy).replace(/^./, letra => letra.toLowerCase())}
          </h1>
        </div>
      </header>

      {paso ? (
        <Link
          href={paso.href}
          aria-label={`Próximo paso: ${paso.texto}. ${paso.accion}`}
          className="group grid gap-4 rounded-md bg-casona-900 p-5 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"
        >
          <div className="flex min-w-0 items-center gap-4">
            {paso.estado && (
              <Baldosa estado={paso.estado} className="h-14 w-14" titulo={false} />
            )}
            <div className="min-w-0">
              <p className="text-2xl font-bold sm:text-3xl">{paso.texto}</p>
              <p className="mt-1 text-base text-casona-100">{paso.detalle}</p>
            </div>
          </div>
          <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-ocre-300 px-5 text-base font-bold text-casona-950 group-hover:bg-ocre-200">
            {paso.accion}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </span>
        </Link>
      ) : (
        cargoTodo && (
          <div className="rounded-md bg-casona-900 p-5 text-white sm:p-6">
            <p className="text-2xl font-bold">Todo al día</p>
            <p className="mt-1 text-base text-casona-100">
              No hay llamados, visitas de hoy ni cuotas vencidas pendientes.
            </p>
          </div>
        )
      )}

      {cuotasSinCrear === null ? (
        <div
          role="alert"
          className="rounded-md border border-ocre-400 bg-ocre-100 p-4 text-base text-ocre-950"
        >
          No pudimos verificar si faltan cuotas por crear este mes. Revisá cada cuenta en
          Contabilidad.
        </div>
      ) : cuotasSinCrear.length > 0 ? (
        <section
          aria-label="Cuotas sin crear"
          className="rounded-md border border-ocre-400 bg-ocre-100 p-4 sm:p-5"
        >
          <h2 className="text-lg font-bold text-ocre-950">
            {cuotasSinCrear.length}{" "}
            {cuotasSinCrear.length === 1 ? "cuota sin crear" : "cuotas sin crear"} en{" "}
            {mesActual}
          </h2>
          <p className="mt-1 text-base text-ocre-900">
            No aparecen como deuda vencida hasta que se crean.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {cuotasSinCrear.slice(0, 5).map(cuota => (
              <li key={cuota.admissionId}>
                <Link
                  href={`/contabilidad/${cuota.admissionId}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-ocre-400 bg-white px-3 text-base font-semibold text-ocre-950 hover:bg-ocre-50"
                >
                  Revisar cuenta de {cuota.nombre}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          {cuotasSinCrear.length > 5 && (
            <p className="mt-3 text-sm text-ocre-900">
              Hay más cuentas por revisar en Contabilidad.
            </p>
          )}
        </section>
      ) : null}

      <section aria-labelledby="resumen-titulo">
        <h2 id="resumen-titulo" className="mb-3 text-xl font-bold text-piedra-950">
          Resumen del día
        </h2>
        <div className="grid gap-px overflow-hidden rounded-md border border-piedra-200 bg-piedra-200 md:grid-cols-2 xl:grid-cols-3">
          {bloques.map(bloque => (
            <ResumenBloque key={bloque.titulo} bloque={bloque} />
          ))}
          <section
            className="flex flex-col bg-piedra-50 p-5"
            aria-labelledby="accesos-titulo"
          >
            <h3 id="accesos-titulo" className="text-lg font-bold text-piedra-950">
              Accesos rápidos
            </h3>
            <nav aria-labelledby="accesos-titulo" className="mt-4 grid gap-2">
              <SoloGestion>
                <AccesoRapido href="/admision/nueva" icono={Inbox}>
                  Registrar consulta
                </AccesoRapido>
              </SoloGestion>
              <AccesoRapido href="/admision/agenda" icono={CalendarDays}>
                Ver agenda
              </AccesoRapido>
              <SoloGestion>
                <AccesoRapido href="/residentes/nuevo" icono={UserPlus}>
                  Registrar ingreso
                </AccesoRapido>
              </SoloGestion>
              <AccesoRapido
                href="/contabilidad/vencimientos?alcance=todas"
                icono={Receipt}
              >
                Ver cuotas vencidas
              </AccesoRapido>
            </nav>
          </section>
        </div>
      </section>

      <p className="text-sm text-piedra-600">
        Las cuotas vencidas incluyen solo cuotas ya creadas. Los datos se actualizan al
        volver a abrir esta página.
      </p>
    </div>
  );
}

function AccesoRapido({
  href,
  icono: Icono,
  children,
}: {
  href: string;
  icono: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-md border border-piedra-300 bg-white px-3.5 text-base font-semibold text-piedra-900 hover:border-piedra-400 hover:bg-piedra-50"
    >
      <Icono className="h-4 w-4 text-piedra-600" aria-hidden="true" />
      {children}
    </Link>
  );
}
