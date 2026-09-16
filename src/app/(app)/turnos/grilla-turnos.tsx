"use client";

import { useState } from "react";
import { Plus, UserCheck, AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui";
import {
  COLORES_FRANJA,
  ETIQUETAS_CORTAS_FRANJA,
  etiquetaDiaSemana,
  type EmpleadoTurno,
  type FranjaTurno,
  type SemanaTurnos,
  type Turno,
} from "@/lib/turnos";
import { ModalTurno } from "./modal-turno";

type GrillaTurnosProps = {
  semana: SemanaTurnos;
  turnos: Turno[];
  empleados: EmpleadoTurno[];
  hoy: string;
  esAdmin: boolean;
};

export function GrillaTurnos({
  semana,
  turnos,
  empleados,
  hoy,
  esAdmin,
}: GrillaTurnosProps) {
  const [modalAbierto, setModalAbierto] = useState<{
    modo: "asignar" | "cubrir";
    fecha?: string;
    empleadoId?: string;
    franja?: FranjaTurno;
    turno?: Turno;
  } | null>(null);

  return (
    <div className="mt-6">
      {modalAbierto && (
        <ModalTurno
          modo={modalAbierto.modo}
          fechaInicial={modalAbierto.fecha}
          franjaInicial={modalAbierto.franja}
          empleadoIdInicial={modalAbierto.empleadoId}
          turnoExistente={modalAbierto.turno}
          empleados={empleados}
          onCerrar={() => setModalAbierto(null)}
        />
      )}

      {empleados.length === 0 ? (
        <Card className="flex h-48 items-center justify-center p-6 text-sm text-slate-400">
          No hay empleados activos para planificar turnos. Registrá personal en la sección
          Empleados.
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="sticky left-0 z-10 min-w-56 bg-slate-50/95 p-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-xs">
                  Empleado
                </th>
                {semana.dias.map(dia => {
                  const esHoy = dia === hoy;
                  return (
                    <th
                      key={dia}
                      className={`min-w-36 p-3 text-center text-xs font-semibold ${
                        esHoy ? "bg-sky-50/80 text-sky-900 font-bold" : "text-slate-700"
                      }`}
                    >
                      <div className="capitalize">{etiquetaDiaSemana(dia)}</div>
                      {esHoy && (
                        <span className="mt-0.5 inline-block rounded-full bg-sky-200/80 px-2 py-0.2 text-[10px] font-bold text-sky-800">
                          Hoy
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {empleados.map(empleado => {
                return (
                  <tr key={empleado.id} className="hover:bg-slate-50/50">
                    <td className="sticky left-0 z-10 bg-white p-3.5 shadow-xs">
                      <div className="font-semibold text-slate-900">
                        {empleado.last_name}, {empleado.first_name}
                      </div>
                      <div className="text-xs text-slate-500">{empleado.job_title}</div>
                    </td>

                    {semana.dias.map(dia => {
                      const turnoDelDia = turnos.find(
                        t => t.employee_id === empleado.id && t.shift_date === dia,
                      );
                      const esHoy = dia === hoy;

                      return (
                        <td
                          key={dia}
                          className={`p-2 align-top text-xs ${
                            esHoy ? "bg-sky-50/30" : ""
                          }`}
                        >
                          {turnoDelDia ? (
                            <div
                              className={`group relative rounded-lg border p-2 shadow-2xs transition ${
                                turnoDelDia.status === "absent"
                                  ? "border-red-200 bg-red-50/60"
                                  : COLORES_FRANJA[turnoDelDia.shift_type as FranjaTurno]
                                      ?.badge || "border-slate-200 bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold">
                                  {ETIQUETAS_CORTAS_FRANJA[
                                    turnoDelDia.shift_type as FranjaTurno
                                  ] || turnoDelDia.shift_type}
                                </span>
                                {turnoDelDia.status === "absent" ? (
                                  <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                                ) : (
                                  <Clock className="h-3 w-3 opacity-60" />
                                )}
                              </div>

                              {turnoDelDia.status === "absent" && (
                                <div className="mt-1 text-[11px] text-red-700">
                                  <div className="font-medium">Ausente</div>
                                  {turnoDelDia.covered_by && (
                                    <div className="flex items-center gap-1 text-[10px] text-emerald-800">
                                      <UserCheck className="h-3 w-3" />
                                      Cubre: {turnoDelDia.covered_by.last_name}
                                    </div>
                                  )}
                                </div>
                              )}

                              {turnoDelDia.notes && (
                                <div className="mt-1 truncate text-[10px] text-slate-500">
                                  {turnoDelDia.notes}
                                </div>
                              )}

                              {esAdmin && (
                                <div className="mt-2 flex items-center gap-1 border-t border-slate-200/60 pt-1.5 opacity-0 transition group-hover:opacity-100">
                                  {turnoDelDia.status !== "absent" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setModalAbierto({
                                          modo: "cubrir",
                                          turno: turnoDelDia,
                                        })
                                      }
                                      className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-amber-700 shadow-2xs hover:bg-amber-50"
                                      title="Registrar ausencia o reemplazo"
                                    >
                                      Cubrir
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setModalAbierto({
                                        modo: "asignar",
                                        turno: turnoDelDia,
                                        empleadoId: empleado.id,
                                        fecha: dia,
                                      })
                                    }
                                    className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-700 shadow-2xs hover:bg-slate-100"
                                  >
                                    Editar
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="group flex min-h-14 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 p-1 hover:border-slate-300">
                              <span className="text-[11px] text-slate-400 group-hover:hidden">
                                Libre
                              </span>
                              {esAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setModalAbierto({
                                      modo: "asignar",
                                      fecha: dia,
                                      empleadoId: empleado.id,
                                    })
                                  }
                                  className="hidden items-center gap-1 rounded bg-slate-900 px-2 py-1 text-[10px] font-medium text-white shadow-2xs hover:bg-slate-800 group-hover:inline-flex"
                                >
                                  <Plus className="h-3 w-3" />
                                  Asignar
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
