import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Inbox, LogIn, PhoneCall } from "lucide-react";
import { Card, StatCard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { requerirSesion } from "@/lib/auth";
import {
  ESTADOS,
  ETIQUETAS_ESTADO,
  esEstado,
  type Estado,
} from "@/lib/admision";
import { contarPorEstado, listarConsultas } from "@/lib/admision-datos";
import { ConsultaCard } from "./consulta-card";

export const metadata: Metadata = {
  title: "Admisión · geriatrIA",
};

// Las descartadas no llevan tarjeta: se ven con el filtro, no son un número que
// haya que mirar todos los días.
const TARJETAS = [
  {
    estado: "nuevo" as const,
    icon: Inbox,
    iconClass: "bg-amber-50 text-amber-600",
    valueClass: "text-amber-600",
    hint: "Sin llamar",
  },
  {
    estado: "contactado" as const,
    icon: PhoneCall,
    iconClass: "bg-sky-50 text-sky-600",
    valueClass: "text-sky-600",
    hint: "Sin visita",
  },
  {
    estado: "visita_agendada" as const,
    icon: CalendarCheck,
    iconClass: "bg-emerald-50 text-emerald-600",
    valueClass: "text-emerald-600",
    hint: "Con turno",
  },
  {
    estado: "ingreso" as const,
    icon: LogIn,
    iconClass: "bg-violet-50 text-violet-600",
    valueClass: "text-violet-600",
    hint: "Cerradas",
  },
];

export default async function AdmisionPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  // El cliente admin saltea RLS, así que la sesión es lo único que separa estos
  // datos de cualquiera. El layout ya la verifica; acá se repite a propósito.
  await requerirSesion();

  const { estado: estadoParam } = await searchParams;
  const filtro: Estado | undefined = esEstado(estadoParam)
    ? estadoParam
    : undefined;

  const [consultas, conteo] = await Promise.all([
    listarConsultas(filtro),
    contarPorEstado(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Admisión</h1>
      <p className="mt-1 text-sm text-slate-500">
        Consultas recibidas desde la web de la residencia. La visita presencial
        se agenda acá, después de llamar a la familia.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TARJETAS.map(({ estado, icon, iconClass, valueClass, hint }) => (
          <StatCard
            key={estado}
            icon={icon}
            iconClass={iconClass}
            valueClass={valueClass}
            label={ETIQUETAS_ESTADO[estado]}
            value={conteo[estado]}
            hint={hint}
          />
        ))}
      </div>

      <nav className="mt-6 flex flex-wrap gap-2">
        <FiltroLink activo={!filtro}>Todas</FiltroLink>
        {ESTADOS.map((estado) => (
          <FiltroLink key={estado} estado={estado} activo={filtro === estado}>
            {ETIQUETAS_ESTADO[estado]}
          </FiltroLink>
        ))}
      </nav>

      {consultas.length === 0 ? (
        <Card className="mt-6 flex h-48 items-center justify-center p-6 text-sm text-slate-400">
          {filtro
            ? `No hay consultas en «${ETIQUETAS_ESTADO[filtro]}».`
            : "Todavía no entró ninguna consulta."}
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {consultas.map((consulta) => (
            <ConsultaCard key={consulta.id} consulta={consulta} />
          ))}
        </div>
      )}
    </div>
  );
}

function FiltroLink({
  estado,
  activo,
  children,
}: {
  estado?: Estado;
  activo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={estado ? `/admision?estado=${estado}` : "/admision"}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
        activo
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      )}
    >
      {children}
    </Link>
  );
}
