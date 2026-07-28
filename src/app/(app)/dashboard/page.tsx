import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
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
        <Card className="p-6">
          <div className="text-sm font-medium text-slate-500">Camas</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900">{ocupadas}</span>
            <span className="text-slate-400">/ {totalCamas} ocupadas</span>
          </div>
          <div className="mt-1 text-sm text-emerald-600">
            {libres} {libres === 1 ? "cama libre" : "camas libres"}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-slate-500">
            Cumplimiento (7 días)
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={
                "text-4xl font-bold " +
                (pctCumplidas >= 90
                  ? "text-emerald-600"
                  : pctCumplidas >= 75
                    ? "text-amber-600"
                    : "text-red-600")
              }
            >
              {pctCumplidas}%
            </span>
          </div>
          <div className="mt-1 text-sm text-slate-400">
            {cumplidas} de {consideradas} tomas registradas
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-slate-500">
            Omitidas hoy
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={
                "text-4xl font-bold " +
                (omitidasHoy === 0 ? "text-emerald-600" : "text-red-600")
              }
            >
              {omitidasHoy}
            </span>
          </div>
          <div className="mt-1 text-sm text-slate-400">
            Tomas que vencieron sin registrar
          </div>
        </Card>
      </div>
    </div>
  );
}
