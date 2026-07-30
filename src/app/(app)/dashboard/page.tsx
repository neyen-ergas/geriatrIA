import { BedDouble, CheckCircle2, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui";
import { rangoHoyAR, haceNDiasAR } from "@/lib/fecha-ar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { desde: hoyDesde, hasta: hoyHasta } = rangoHoyAR();
  const hace7 = haceNDiasAR(7);
  const ahora = new Date().toISOString();

  const [habRes, resRes, tomas7Res, omitidasHoyRes] = await Promise.all([
    supabase.from("habitacion").select("capacidad"),
    supabase.from("residente").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase
      .from("administracion_medicamento")
      .select("estado")
      .gte("programada_para", hace7)
      .lt("programada_para", ahora),
    supabase
      .from("administracion_medicamento")
      .select("id", { count: "exact", head: true })
      .eq("estado", "omitida")
      .gte("programada_para", hoyDesde)
      .lt("programada_para", hoyHasta),
  ]);

  const totalCamas = (habRes.data ?? []).reduce(
    (s, h: { capacidad: number }) => s + (h.capacidad ?? 0),
    0,
  );
  const ocupadas = resRes.count ?? 0;
  const libres = Math.max(0, totalCamas - ocupadas);

  const tomas7 = (tomas7Res.data ?? []) as { estado: string }[];
  const cumplidas = tomas7.filter(
    (t) => t.estado === "administrada" || t.estado === "rechazada",
  ).length;
  const consideradas = tomas7.filter((t) =>
    ["administrada", "rechazada", "omitida"].includes(t.estado),
  ).length;
  const pctCumplidas =
    consideradas > 0 ? Math.round((cumplidas / consideradas) * 100) : 0;

  const omitidasHoy = omitidasHoyRes.count ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Vista rápida de la residencia</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={BedDouble}
          iconClass="bg-sky-100 text-sky-600"
          label="Camas"
          value={
            <>
              {ocupadas}
              <span className="text-lg font-normal text-slate-400">
                {" "}
                / {totalCamas}
              </span>
            </>
          }
          hint={`${libres} ${libres === 1 ? "cama libre" : "camas libres"}`}
          hintClass="text-emerald-600"
        />

        <StatCard
          icon={CheckCircle2}
          iconClass={
            pctCumplidas >= 90
              ? "bg-emerald-100 text-emerald-600"
              : pctCumplidas >= 75
                ? "bg-amber-100 text-amber-600"
                : "bg-red-100 text-red-600"
          }
          label="Cumplimiento (7 días)"
          value={`${pctCumplidas}%`}
          valueClass={
            pctCumplidas >= 90
              ? "text-emerald-600"
              : pctCumplidas >= 75
                ? "text-amber-600"
                : "text-red-600"
          }
          hint={`${cumplidas} de ${consideradas} tomas registradas`}
        />

        <StatCard
          icon={TriangleAlert}
          iconClass={
            omitidasHoy === 0
              ? "bg-emerald-100 text-emerald-600"
              : "bg-red-100 text-red-600"
          }
          label="Omitidas hoy"
          value={omitidasHoy}
          valueClass={omitidasHoy === 0 ? "text-emerald-600" : "text-red-600"}
          hint="Tomas que vencieron sin registrar"
        />
      </div>
    </div>
  );
}
