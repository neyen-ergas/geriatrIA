import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button, Card } from "@/components/ui";
import { formatFecha } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ResidenteRow {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  fecha_nacimiento: string | null;
  activo: boolean;
  habitacion: { numero: string } | null;
}

export default async function ResidentesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("residente")
    .select(
      "id, nombre, apellido, dni, fecha_nacimiento, activo, habitacion:habitacion_id ( numero )",
    )
    .eq("activo", true)
    .order("apellido", { ascending: true });

  const residentes = (data ?? []) as unknown as ResidenteRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Residentes</h1>
          <p className="text-sm text-slate-500">
            {residentes.length} residentes activos
          </p>
        </div>
        <Link href="/residentes/nuevo">
          <Button>+ Nuevo residente</Button>
        </Link>
      </div>

      <Card className="divide-y divide-slate-100">
        {residentes.map((r) => (
          <Link
            key={r.id}
            href={`/residentes/${r.id}/editar`}
            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
          >
            <div>
              <div className="font-medium text-slate-900">
                {r.apellido}, {r.nombre}
              </div>
              <div className="text-xs text-slate-500">
                {r.dni ? `DNI ${r.dni}` : "Sin DNI"}
                {r.fecha_nacimiento
                  ? ` · Nac. ${formatFecha(r.fecha_nacimiento)}`
                  : ""}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {r.habitacion && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  Hab. {r.habitacion.numero}
                </span>
              )}
              <span className="text-slate-300">›</span>
            </div>
          </Link>
        ))}
        {residentes.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            No hay residentes cargados.
          </p>
        )}
      </Card>
    </div>
  );
}
