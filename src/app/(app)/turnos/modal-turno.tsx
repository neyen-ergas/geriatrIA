"use client";

import { useActionState } from "react";
import { X, Calendar, UserCheck, AlertTriangle } from "lucide-react";
import { Button, Input, Label, Textarea } from "@/components/ui";
import {
  FRANJAS_TURNO,
  ETIQUETAS_FRANJA_TURNO,
  type EmpleadoTurno,
  type FranjaTurno,
  type Turno,
} from "@/lib/turnos";
import {
  asignarTurnoAction,
  cubrirTurnoAction,
  cancelarTurnoAction,
  type ResultadoTurno,
} from "./actions";

type ModalProps = {
  modo: "asignar" | "cubrir";
  fechaInicial?: string;
  franjaInicial?: FranjaTurno;
  empleadoIdInicial?: string;
  turnoExistente?: Turno;
  empleados: EmpleadoTurno[];
  onCerrar: () => void;
};

const ESTADO_INICIAL: ResultadoTurno = { ok: false };

export function ModalTurno({
  modo,
  fechaInicial,
  franjaInicial = "manana",
  empleadoIdInicial,
  turnoExistente,
  empleados,
  onCerrar,
}: ModalProps) {
  const [estadoAsignar, accionAsignar, pendienteAsignar] = useActionState(
    asignarTurnoAction,
    ESTADO_INICIAL,
  );
  const [estadoCubrir, accionCubrir, pendienteCubrir] = useActionState(
    cubrirTurnoAction,
    ESTADO_INICIAL,
  );
  const [estadoCancelar, accionCancelar, pendienteCancelar] = useActionState(
    cancelarTurnoAction,
    ESTADO_INICIAL,
  );

  // Si la acción fue exitosa, cerramos el modal
  if (estadoAsignar.ok || estadoCubrir.ok || estadoCancelar.ok) {
    onCerrar();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            {modo === "asignar" ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <Calendar className="h-5 w-5" />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {modo === "asignar" ? "Asignar turno" : "Registrar ausencia y cobertura"}
              </h3>
              <p className="text-xs text-slate-500">
                {modo === "asignar"
                  ? "Programá el horario de un empleado para la jornada."
                  : "Marcá el motivo de ausencia y asigná quién cubre el turno."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar ventana"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {modo === "asignar" ? (
          <form action={accionAsignar} className="mt-5 space-y-4">
            {turnoExistente?.id && (
              <input type="hidden" name="id" value={turnoExistente.id} />
            )}

            <div>
              <Label htmlFor="employee_id">Empleado</Label>
              <select
                id="employee_id"
                name="employee_id"
                required
                defaultValue={empleadoIdInicial || turnoExistente?.employee_id || ""}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="" disabled>
                  Seleccioná un empleado
                </option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.last_name}, {emp.first_name} ({emp.job_title})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shift_date">Fecha</Label>
                <Input
                  id="shift_date"
                  name="shift_date"
                  type="date"
                  required
                  defaultValue={fechaInicial || turnoExistente?.shift_date || ""}
                />
              </div>

              <div>
                <Label htmlFor="shift_type">Franja horaria</Label>
                <select
                  id="shift_type"
                  name="shift_type"
                  required
                  defaultValue={turnoExistente?.shift_type || franjaInicial}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  {FRANJAS_TURNO.map(franja => (
                    <option key={franja} value={franja}>
                      {ETIQUETAS_FRANJA_TURNO[franja]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observaciones (opcional)</Label>
              <Textarea
                id="notes"
                name="notes"
                maxLength={1000}
                defaultValue={turnoExistente?.notes || ""}
                placeholder="Notas sobre el turno o sector asignado..."
                className="min-h-20"
              />
            </div>

            {estadoAsignar.error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                {estadoAsignar.error}
              </p>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              {turnoExistente?.id ? (
                <form action={accionCancelar}>
                  <input type="hidden" name="shift_id" value={turnoExistente.id} />
                  <Button
                    type="submit"
                    variant="danger"
                    size="md"
                    disabled={pendienteCancelar}
                  >
                    {pendienteCancelar ? "Cancelando..." : "Cancelar turno"}
                  </Button>
                </form>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onCerrar}>
                  Volver
                </Button>
                <Button type="submit" disabled={pendienteAsignar}>
                  {pendienteAsignar ? "Guardando..." : "Guardar turno"}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <form action={accionCubrir} className="mt-5 space-y-4">
            <input type="hidden" name="shift_id" value={turnoExistente?.id || ""} />

            <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700">
              <div className="font-semibold text-slate-900">
                Turno: {turnoExistente?.shift_date} ·{" "}
                {turnoExistente &&
                  ETIQUETAS_FRANJA_TURNO[turnoExistente.shift_type as FranjaTurno]}
              </div>
              <div className="mt-1 text-slate-600">
                Titular: {turnoExistente?.employee?.last_name},{" "}
                {turnoExistente?.employee?.first_name}
              </div>
            </div>

            <div>
              <Label htmlFor="absence_reason">Motivo de ausencia</Label>
              <Input
                id="absence_reason"
                name="absence_reason"
                required
                maxLength={500}
                placeholder="Ej. Licencia médica, enfermedad, imprevisto personal..."
              />
            </div>

            <div>
              <Label htmlFor="covered_by_employee_id">Empleado que cubre el turno</Label>
              <select
                id="covered_by_employee_id"
                name="covered_by_employee_id"
                required
                defaultValue=""
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="" disabled>
                  Seleccioná quién realizará la cobertura
                </option>
                {empleados
                  .filter(emp => emp.id !== turnoExistente?.employee_id)
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.last_name}, {emp.first_name} ({emp.job_title})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label htmlFor="notes">Notas de cobertura (opcional)</Label>
              <Textarea
                id="notes"
                name="notes"
                maxLength={1000}
                placeholder="Observaciones de la reasignación..."
                className="min-h-20"
              />
            </div>

            {estadoCubrir.error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                {estadoCubrir.error}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="outline" onClick={onCerrar}>
                Volver
              </Button>
              <Button type="submit" disabled={pendienteCubrir}>
                <UserCheck className="h-4 w-4" />
                {pendienteCubrir ? "Registrando..." : "Confirmar cobertura"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
