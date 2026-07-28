"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge, Button, Card } from "@/components/ui";
import { formatHora, cn } from "@/lib/utils";
import { estadoVisual, ESTADO_META, MOTIVOS_RECHAZO } from "@/lib/tomas";
import type { TomaTurno, EstadoVisual } from "@/lib/types";

export function TurnoLista({ tomas }: { tomas: TomaTurno[] }) {
  const ahora = new Date();

  // Resumen del turno.
  const resumen = useMemo(() => {
    const acc = { pendientes: 0, hechas: 0, atrasadas: 0, omitidas: 0 };
    for (const t of tomas) {
      const v = estadoVisual(t.estado, t.programada_para, ahora);
      if (t.estado === "administrada") acc.hechas++;
      else if (t.estado === "omitida") acc.omitidas++;
      else if (t.estado === "rechazada") acc.hechas++;
      else if (v === "atrasada" || v === "vencida") acc.atrasadas++;
      else acc.pendientes++;
    }
    return acc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tomas]);

  // Agrupar por horario (HH:MM).
  const grupos = useMemo(() => {
    const map = new Map<string, TomaTurno[]>();
    for (const t of tomas) {
      const k = formatHora(t.programada_para);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return Array.from(map.entries());
  }, [tomas]);

  if (tomas.length === 0) {
    return (
      <Card className="p-8 text-center text-slate-500">
        No hay tomas programadas para hoy.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Tomas de mi turno</h1>
        <p className="text-sm text-slate-500">
          {new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Resumen label="Pendientes" value={resumen.pendientes} color="text-slate-700" />
        <Resumen label="Atrasadas" value={resumen.atrasadas} color="text-amber-600" />
        <Resumen label="Registradas" value={resumen.hechas} color="text-emerald-600" />
        <Resumen label="Omitidas" value={resumen.omitidas} color="text-red-600" />
      </div>

      {grupos.map(([hora, items]) => (
        <section key={hora} className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">{hora}</h2>
            <span className="text-xs text-slate-400">
              {items.length} {items.length === 1 ? "toma" : "tomas"}
            </span>
          </div>
          <div className="space-y-2">
            {items.map((t) => (
              <TomaCard key={t.id} toma={t} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Resumen({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="p-3">
      <div className={cn("text-2xl font-bold", color)}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </Card>
  );
}

function EstadoBadge({ estado }: { estado: EstadoVisual }) {
  const meta = ESTADO_META[estado];
  return (
    <Badge className={meta.badge}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </Badge>
  );
}

function TomaCard({ toma }: { toma: TomaTurno }) {
  const router = useRouter();
  const [modo, setModo] = useState<"idle" | "armado" | "motivo">("idle");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visual = estadoVisual(toma.estado, toma.programada_para);
  const editable = toma.estado === "pendiente";

  async function registrar(
    estado: "administrada" | "rechazada",
    motivo?: string,
  ) {
    setEnviando(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("registrar_toma", {
      p_toma_id: toma.id,
      p_estado: estado,
      p_motivo: motivo ?? null,
      p_observacion: null,
    });
    if (error) {
      setError(error.message);
      setEnviando(false);
      return;
    }
    setModo("idle");
    router.refresh();
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow",
        editable && modo === "idle" && "cursor-pointer hover:shadow-md",
        (visual === "atrasada" || visual === "vencida") && "border-amber-200",
      )}
    >
      <div
        className="flex items-start justify-between gap-3 p-4"
        onClick={() => editable && modo === "idle" && setModo("armado")}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">
              {toma.residente.apellido}, {toma.residente.nombre}
            </span>
            {toma.habitacion_numero && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                Hab. {toma.habitacion_numero}
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-slate-700">
            {toma.medicamento_nombre}{" "}
            <span className="text-slate-400">· {toma.dosis}</span>
          </div>
          {toma.indicaciones && (
            <div className="mt-0.5 text-xs text-slate-400">
              {toma.indicaciones}
            </div>
          )}
          {toma.estado === "rechazada" && toma.motivo && (
            <div className="mt-1 text-xs text-orange-600">
              Motivo: {toma.motivo}
            </div>
          )}
        </div>
        <EstadoBadge estado={visual} />
      </div>

      {editable && modo === "armado" && (
        <div className="flex gap-2 border-t border-slate-100 bg-slate-50 p-3">
          <Button
            variant="primary"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            size="lg"
            disabled={enviando}
            onClick={() => registrar("administrada")}
          >
            {enviando ? "…" : "Administrada"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            disabled={enviando}
            onClick={() => setModo("motivo")}
          >
            Rechazó
          </Button>
          <Button
            variant="ghost"
            size="lg"
            disabled={enviando}
            onClick={() => setModo("idle")}
          >
            Cancelar
          </Button>
        </div>
      )}

      {editable && modo === "motivo" && (
        <div className="border-t border-slate-100 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-medium text-slate-500">
            Motivo del rechazo
          </p>
          <div className="flex flex-wrap gap-2">
            {MOTIVOS_RECHAZO.map((m) => (
              <Button
                key={m}
                variant="outline"
                disabled={enviando}
                onClick={() => registrar("rechazada", m)}
                className="text-sm"
              >
                {m}
              </Button>
            ))}
            <Button
              variant="ghost"
              disabled={enviando}
              onClick={() => setModo("armado")}
            >
              Volver
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
    </Card>
  );
}
