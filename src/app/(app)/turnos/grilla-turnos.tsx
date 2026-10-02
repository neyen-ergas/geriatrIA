"use client";

import { useState } from "react";
import { Plus, UserCheck, AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui";
import {
  COLORES_FRANJA,
  ETIQUETAS_CORTAS_FRANJA,
  etiquetaDiaSemana,
  horarioTurno,
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
    idSolicitud?: string;
  } | null>(null);
  const [diaMovil, setDiaMovil] = useState(
    semana.dias.includes(hoy) ? hoy : semana.dias[0],
  );

  return (
    <div className="mt-6">
      {modalAbierto && (
        <ModalTurno
          modo={modalAbierto.modo}
          fechaInicial={modalAbierto.fecha}
          franjaInicial={modalAbierto.franja}
          empleadoIdInicial={modalAbierto.empleadoId}
          turnoExistente={modalAbierto.turno}
          idSolicitud={modalAbierto.idSolicitud}
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
        <>
          <div className="space-y-3 md:hidden">
            <label className="block text-sm font-semibold text-slate-800">
              Día a revisar
              <select
                value={diaMovil}
                onChange={evento => setDiaMovil(evento.target.value)}
                className="mt-1 block h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
              >
                {semana.dias.map(dia => (
                  <option key={dia} value={dia}>
                    {etiquetaDiaSemana(dia)}
                    {dia === hoy ? " · Hoy" : ""}
                  </option>
                ))}
              </select>
            </label>
            {empleados.map(empleado => {
              const turnosDelDia = turnos.filter(
                turno =>
                  (turno.employee_id === empleado.id ||
                    turno.covered_by_employee_id === empleado.id) &&
                  turno.shift_date === diaMovil &&
                  turno.status !== "cancelled",
              );
              return (
                <Card key={empleado.id} className="p-4">
                  <h2 className="font-bold text-slate-900">
                    {empleado.last_name}, {empleado.first_name}
                  </h2>
                  <p className="text-xs text-slate-500">{empleado.job_title}</p>
                  {turnosDelDia.length === 0 && (
                    <p className="mt-3 text-sm text-slate-500">Sin turnos ese día.</p>
                  )}
                  <ul className="mt-3 space-y-2">
                    {turnosDelDia.map(turno => (
                      <li
                        key={turno.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                      >
                        <p className="text-sm font-bold text-slate-900">
                          {ETIQUETAS_CORTAS_FRANJA[turno.shift_type as FranjaTurno] ||
                            turno.shift_type}{" "}
                          · {horarioTurno(turno)}
                        </p>
                        {turno.status === "absent" && (
                          <p className="text-xs font-bold text-rose-700">
                            Ausente
                            {turno.covered_by
                              ? ` · Cubre ${turno.covered_by.last_name}`
                              : " · Sin cobertura"}
                          </p>
                        )}
                        {turno.covered_by_employee_id === empleado.id && (
                          <p className="text-xs text-emerald-800">
                            Cubre a {turno.employee?.last_name || "otro empleado"}
                          </p>
                        )}
                        {esAdmin &&
                          turno.employee_id === empleado.id &&
                          ["scheduled", "absent"].includes(turno.status) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setModalAbierto({
                                    modo: "asignar",
                                    turno,
                                    empleadoId: empleado.id,
                                    fecha: diaMovil,
                                  })
                                }
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
                              >
                                Editar
                              </button>
                              {turno.shift_type !== "franco" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setModalAbierto({ modo: "cubrir", turno })
                                  }
                                  className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900"
                                >
                                  {turno.status === "absent"
                                    ? "Cambiar cobertura"
                                    : "Registrar ausencia o cobertura"}
                                </button>
                              )}
                            </div>
                          )}
                      </li>
                    ))}
                  </ul>
                  {esAdmin && (
                    <button
                      type="button"
                      onClick={() =>
                        setModalAbierto({
                          modo: "asignar",
                          fecha: diaMovil,
                          empleadoId: empleado.id,
                          idSolicitud: crypto.randomUUID(),
                        })
                      }
                      className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white"
                    >
                      <Plus className="h-4 w-4" /> Asignar turno
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs md:block">
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
                        const turnosDelDia = turnos.filter(
                          t =>
                            (t.employee_id === empleado.id ||
                              t.covered_by_employee_id === empleado.id) &&
                            t.shift_date === dia &&
                            t.status !== "cancelled",
                        );
                        const esHoy = dia === hoy;

                        return (
                          <td
                            key={dia}
                            className={`p-2 align-top text-xs ${
                              esHoy ? "bg-sky-50/30" : ""
                            }`}
                          >
                            {turnosDelDia.map(turnoDelDia => (
                              <div
                                key={turnoDelDia.id}
                                className={`group relative mb-2 rounded-lg border p-2 shadow-2xs transition ${
                                  turnoDelDia.status === "absent" &&
                                  turnoDelDia.employee_id === empleado.id
                                    ? "border-red-200 bg-red-50/60"
                                    : COLORES_FRANJA[
                                        turnoDelDia.shift_type as FranjaTurno
                                      ]?.badge || "border-slate-200 bg-slate-50"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold">
                                    {ETIQUETAS_CORTAS_FRANJA[
                                      turnoDelDia.shift_type as FranjaTurno
                                    ] || turnoDelDia.shift_type}
                                  </span>
                                  {turnoDelDia.status === "absent" &&
                                  turnoDelDia.employee_id === empleado.id ? (
                                    <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                                  ) : (
                                    <Clock className="h-3 w-3 opacity-60" />
                                  )}
                                </div>

                                <div className="mt-1 text-[10px]">
                                  {horarioTurno(turnoDelDia)}
                                </div>
                                {turnoDelDia.covered_by_employee_id === empleado.id && (
                                  <div className="mt-1 font-semibold text-emerald-800">
                                    Cubre a:{" "}
                                    {turnoDelDia.employee?.last_name || "otro empleado"}
                                  </div>
                                )}
                                {turnoDelDia.status === "absent" &&
                                  turnoDelDia.employee_id === empleado.id && (
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

                                {esAdmin &&
                                  turnoDelDia.employee_id === empleado.id &&
                                  ["scheduled", "absent"].includes(
                                    turnoDelDia.status,
                                  ) && (
                                    <div className="mt-2 flex items-center gap-1 border-t border-slate-200/60 pt-1.5">
                                      {turnoDelDia.shift_type !== "franco" && (
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
                                          {turnoDelDia.status === "absent"
                                            ? "Cambiar cobertura"
                                            : "Cubrir"}
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
                            ))}
                            {turnosDelDia.length === 0 && !esAdmin && (
                              <span className="text-slate-400">Sin turnos</span>
                            )}
                            {esAdmin && (
                              <div className="group flex min-h-14 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 p-1 hover:border-slate-300">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setModalAbierto({
                                      modo: "asignar",
                                      fecha: dia,
                                      empleadoId: empleado.id,
                                      idSolicitud: crypto.randomUUID(),
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded bg-slate-900 px-2 py-1 text-[10px] font-medium text-white shadow-2xs hover:bg-slate-800"
                                >
                                  <Plus className="h-3 w-3" />
                                  Asignar
                                </button>
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
        </>
      )}
    </div>
  );
}
