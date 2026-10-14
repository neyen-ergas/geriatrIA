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
        <Card className="flex h-48 items-center justify-center p-6 text-sm text-piedra-500">
          No hay empleados activos para planificar turnos. Registrá personal en la sección
          Empleados.
        </Card>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            <label className="block text-sm font-semibold text-piedra-800">
              Día a revisar
              <select
                value={diaMovil}
                onChange={evento => setDiaMovil(evento.target.value)}
                className="mt-1 block h-11 w-full rounded-md border border-piedra-300 bg-white px-3 text-sm"
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
                  <h2 className="font-bold text-piedra-900">
                    {empleado.last_name}, {empleado.first_name}
                  </h2>
                  <p className="text-sm text-piedra-500">{empleado.job_title}</p>
                  {turnosDelDia.length === 0 && (
                    <p className="mt-3 text-sm text-piedra-500">Sin turnos ese día.</p>
                  )}
                  <ul className="mt-3 space-y-2">
                    {turnosDelDia.map(turno => (
                      <li
                        key={turno.id}
                        className="rounded-md border border-piedra-200 bg-piedra-50 p-3"
                      >
                        <p className="text-sm font-bold text-piedra-900">
                          {ETIQUETAS_CORTAS_FRANJA[turno.shift_type as FranjaTurno] ||
                            turno.shift_type}{" "}
                          · {horarioTurno(turno)}
                        </p>
                        {turno.status === "absent" && (
                          <p className="text-sm font-bold text-oxido-700">
                            Ausente
                            {turno.covered_by
                              ? ` · Cubre ${turno.covered_by.last_name}`
                              : " · Sin cobertura"}
                          </p>
                        )}
                        {turno.covered_by_employee_id === empleado.id && (
                          <p className="text-sm text-casona-800">
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
                                className="rounded-md border border-piedra-300 bg-white px-3 py-2 text-sm font-semibold"
                              >
                                Editar
                              </button>
                              {turno.shift_type !== "franco" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setModalAbierto({ modo: "cubrir", turno })
                                  }
                                  className="rounded-md border border-ocre-300 bg-white px-3 py-2 text-sm font-semibold text-ocre-900"
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
                      className="min-h-11 mt-3 inline-flex w-full items-center justify-center gap-1 rounded-md bg-casona-700 px-3 py-2.5 text-sm font-semibold text-white"
                    >
                      <Plus className="h-4 w-4" /> Asignar turno
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto rounded-md border border-piedra-200 bg-white md:block">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-piedra-200 bg-piedra-50/80">
                  <th className="sticky left-0 z-10 w-36 bg-piedra-50 p-3 text-sm font-semibold text-piedra-700 xl:w-52">
                    Empleado
                  </th>
                  {semana.dias.map(dia => {
                    const esHoy = dia === hoy;
                    return (
                      <th
                        key={dia}
                        className={`p-2 text-center text-sm font-semibold ${
                          esHoy
                            ? "bg-ocre-100 font-bold text-ocre-950"
                            : "text-piedra-700"
                        }`}
                      >
                        <div className="capitalize">{etiquetaDiaSemana(dia)}</div>
                        {esHoy && (
                          <span className="mt-0.5 inline-block rounded-sm bg-ocre-300 px-1.5 text-sm font-bold text-casona-950">
                            Hoy
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-piedra-100">
                {empleados.map(empleado => {
                  return (
                    <tr key={empleado.id} className="hover:bg-piedra-50/50">
                      <td className="sticky left-0 z-10 bg-white p-3.5">
                        <div className="font-semibold text-piedra-900">
                          {empleado.last_name}, {empleado.first_name}
                        </div>
                        <div className="text-sm text-piedra-500">
                          {empleado.job_title}
                        </div>
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
                            className={`p-1.5 align-top text-sm ${
                              esHoy ? "bg-ocre-50" : ""
                            }`}
                          >
                            {turnosDelDia.map(turnoDelDia => (
                              <div
                                key={turnoDelDia.id}
                                className={`group relative mb-2 rounded-md border p-2 transition ${
                                  turnoDelDia.status === "absent" &&
                                  turnoDelDia.employee_id === empleado.id
                                    ? "border-oxido-200 bg-oxido-50/60"
                                    : COLORES_FRANJA[
                                        turnoDelDia.shift_type as FranjaTurno
                                      ]?.badge || "border-piedra-200 bg-piedra-50"
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
                                    <AlertCircle className="h-3.5 w-3.5 text-oxido-600" />
                                  ) : (
                                    <Clock className="h-3 w-3 opacity-60" />
                                  )}
                                </div>

                                <div className="mt-1 text-sm">
                                  {horarioTurno(turnoDelDia)}
                                </div>
                                {turnoDelDia.covered_by_employee_id === empleado.id && (
                                  <div className="mt-1 font-semibold text-casona-800">
                                    Cubre a:{" "}
                                    {turnoDelDia.employee?.last_name || "otro empleado"}
                                  </div>
                                )}
                                {turnoDelDia.status === "absent" &&
                                  turnoDelDia.employee_id === empleado.id && (
                                    <div className="mt-1 text-sm text-oxido-700">
                                      <div className="font-medium">Ausente</div>
                                      {turnoDelDia.covered_by && (
                                        <div className="flex items-center gap-1 text-sm text-casona-800">
                                          <UserCheck className="h-3 w-3" />
                                          Cubre: {turnoDelDia.covered_by.last_name}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                {turnoDelDia.notes && (
                                  <div className="mt-1 truncate text-sm text-piedra-600">
                                    {turnoDelDia.notes}
                                  </div>
                                )}

                                {esAdmin &&
                                  turnoDelDia.employee_id === empleado.id &&
                                  ["scheduled", "absent"].includes(
                                    turnoDelDia.status,
                                  ) && (
                                    <div className="mt-2 flex flex-wrap gap-1 border-t border-piedra-200 pt-2">
                                      {turnoDelDia.shift_type !== "franco" && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setModalAbierto({
                                              modo: "cubrir",
                                              turno: turnoDelDia,
                                            })
                                          }
                                          className="min-h-9 flex-1 rounded-sm border border-piedra-300 bg-white px-2 text-sm font-semibold text-piedra-800 hover:bg-piedra-100"
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
                                        className="min-h-9 flex-1 rounded-sm border border-piedra-300 bg-white px-2 text-sm font-semibold text-piedra-800 hover:bg-piedra-100"
                                      >
                                        Editar
                                      </button>
                                    </div>
                                  )}
                              </div>
                            ))}
                            {turnosDelDia.length === 0 && !esAdmin && (
                              <span className="text-piedra-500">Sin turnos</span>
                            )}
                            {esAdmin && (
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
                                aria-label={`Asignar turno a ${empleado.last_name}, ${empleado.first_name} el ${etiquetaDiaSemana(dia)}`}
                                className={`flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-piedra-300 text-sm font-semibold text-piedra-600 hover:border-casona-600 hover:bg-casona-50 hover:text-casona-800 ${
                                  turnosDelDia.length > 0 ? "min-h-9" : "min-h-11"
                                }`}
                              >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                {turnosDelDia.length > 0 ? "Otro turno" : "Asignar"}
                              </button>
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
