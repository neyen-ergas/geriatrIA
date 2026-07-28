"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import type { ResultadoAccion } from "@/app/(app)/residentes/actions";

export interface HabitacionOpt {
  id: string;
  numero: string;
}

export interface ResidenteInicial {
  nombre?: string;
  apellido?: string;
  dni?: string | null;
  fecha_nacimiento?: string | null;
  sexo?: string | null;
  habitacion_id?: string | null;
  observaciones?: string | null;
}

export function ResidenteForm({
  action,
  habitaciones,
  inicial,
  titulo,
}: {
  action: (prev: ResultadoAccion, fd: FormData) => Promise<ResultadoAccion>;
  habitaciones: HabitacionOpt[];
  inicial?: ResidenteInicial;
  titulo: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, { ok: false });

  useEffect(() => {
    if (state.ok) {
      router.push("/residentes");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <Card className="mx-auto max-w-lg p-6">
      <h1 className="mb-4 text-lg font-bold text-slate-900">{titulo}</h1>
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" defaultValue={inicial?.nombre} required />
          </div>
          <div>
            <Label htmlFor="apellido">Apellido</Label>
            <Input
              id="apellido"
              name="apellido"
              defaultValue={inicial?.apellido}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="dni">DNI</Label>
            <Input id="dni" name="dni" defaultValue={inicial?.dni ?? ""} />
          </div>
          <div>
            <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
            <Input
              id="fecha_nacimiento"
              name="fecha_nacimiento"
              type="date"
              defaultValue={inicial?.fecha_nacimiento ?? ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sexo">Sexo</Label>
            <select
              id="sexo"
              name="sexo"
              defaultValue={inicial?.sexo ?? ""}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="">—</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
              <option value="X">Otro</option>
            </select>
          </div>
          <div>
            <Label htmlFor="habitacion_id">Habitación</Label>
            <select
              id="habitacion_id"
              name="habitacion_id"
              defaultValue={inicial?.habitacion_id ?? ""}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="">Sin asignar</option>
              {habitaciones.map((h) => (
                <option key={h.id} value={h.id}>
                  Hab. {h.numero}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="observaciones">Observaciones</Label>
          <textarea
            id="observaciones"
            name="observaciones"
            defaultValue={inicial?.observaciones ?? ""}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/residentes")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
