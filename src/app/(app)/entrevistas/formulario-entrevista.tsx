"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import {
  type ConsultaParaEntrevista,
  type Entrevista,
  type Entrevistador,
  ESTADOS_ENTREVISTA,
  EVALUACIONES_COGNITIVAS,
  EVALUACIONES_MOVILIDAD,
  CONCLUSIONES_ENTREVISTA,
  ETIQUETAS_COGNITIVA,
  ETIQUETAS_CONCLUSION,
  ETIQUETAS_ESTADO_ENTREVISTA,
  ETIQUETAS_MOVILIDAD,
  type ConclusionEntrevista,
} from "@/lib/entrevistas";
import { guardarEntrevistaAction, type ResultadoEntrevista } from "./actions";

interface FormularioEntrevistaProps {
  entrevista?: Entrevista | null;
  consultas: ConsultaParaEntrevista[];
  entrevistadores: Entrevistador[];
  preselectedConsultaId?: string;
}

const estadoInicial: ResultadoEntrevista = {
  ok: false,
};

export function FormularioEntrevista({
  entrevista,
  consultas,
  entrevistadores,
  preselectedConsultaId,
}: FormularioEntrevistaProps) {
  const [state, formAction, isPending] = useActionState(
    guardarEntrevistaAction,
    estadoInicial,
  );

  const [conclusionSeleccionada, setConclusionSeleccionada] =
    useState<ConclusionEntrevista>(
      (entrevista?.conclusion as ConclusionEntrevista) || "pendiente",
    );

  const [nombreCandidato, setNombreCandidato] = useState(
    entrevista?.candidate_name || "",
  );
  const [telefonoAcompanante, setTelefonoAcompanante] = useState(
    entrevista?.companion_phone || "",
  );
  const [notasSociales, setNotasSociales] = useState(entrevista?.social_notes || "");
  const [consultaIdSeleccionada, setConsultaIdSeleccionada] = useState(
    entrevista?.consultation_id || preselectedConsultaId || "",
  );

  const handleConsultaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setConsultaIdSeleccionada(selectedId);

    if (selectedId) {
      const encontrada = consultas.find(c => c.id === selectedId);
      if (encontrada) {
        if (!nombreCandidato) {
          setNombreCandidato(encontrada.nombre);
        }
        if (!telefonoAcompanante) {
          setTelefonoAcompanante(encontrada.telefono);
        }
        if (!notasSociales && encontrada.mensaje) {
          setNotasSociales(`Mensaje inicial de consulta: ${encontrada.mensaje}`);
        }
      }
    }
  };

  const hoyStr = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-8">
      {entrevista?.id && <input type="hidden" name="id" value={entrevista.id} />}

      {/* Alerta de error global */}
      {!state.ok && state.error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <p className="font-semibold">{state.error}</p>
        </div>
      )}

      {/* Alerta de éxito */}
      {state.ok && state.mensaje && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <p className="font-semibold">{state.mensaje}</p>
          <div className="mt-2">
            <Link
              href="/entrevistas"
              className="font-medium text-emerald-900 underline hover:text-emerald-950"
            >
              Volver al listado de entrevistas →
            </Link>
          </div>
        </div>
      )}

      {/* Sección 1: Vinculación y Postulante */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          1. Postulante y Entorno Familiar
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Datos de la persona mayor interesada y su contacto de referencia familiar.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Vinculación con Consulta */}
          <div className="sm:col-span-2">
            <Label htmlFor="consultation_id">
              Vincular con Consulta de Admisión (opcional)
            </Label>
            <Select
              id="consultation_id"
              name="consultation_id"
              value={consultaIdSeleccionada}
              onChange={handleConsultaChange}
            >
              <option value="">-- Sin consulta previa vinculada --</option>
              {consultas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.telefono}) - Estado: {c.estado}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-slate-400">
              Al seleccionar una consulta, se precargan los datos de contacto inicial.
            </p>
          </div>

          {/* Nombre del Postulante */}
          <div>
            <Label htmlFor="candidate_name">
              Nombre y Apellido del Postulante <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="candidate_name"
              name="candidate_name"
              required
              value={nombreCandidato}
              onChange={e => setNombreCandidato(e.target.value)}
              placeholder="Ej: Rosa Martínez"
              aria-invalid={Boolean(state.errores?.candidate_name)}
              aria-describedby={
                state.errores?.candidate_name ? "candidate_name-error" : undefined
              }
              className={state.errores?.candidate_name ? "border-rose-300" : ""}
            />
            {state.errores?.candidate_name && (
              <p
                id="candidate_name-error"
                role="alert"
                className="mt-1 text-xs text-rose-600"
              >
                {state.errores.candidate_name}
              </p>
            )}
          </div>

          {/* DNI */}
          <div>
            <Label htmlFor="candidate_dni">DNI / Documento</Label>
            <Input
              id="candidate_dni"
              name="candidate_dni"
              defaultValue={entrevista?.candidate_dni || ""}
              placeholder="Ej: 4.892.110"
              aria-invalid={Boolean(state.errores?.candidate_dni)}
              aria-describedby={
                state.errores?.candidate_dni ? "candidate_dni-error" : undefined
              }
              className={state.errores?.candidate_dni ? "border-rose-300" : ""}
            />
            {state.errores?.candidate_dni && (
              <p
                id="candidate_dni-error"
                role="alert"
                className="mt-1 text-xs text-rose-600"
              >
                {state.errores.candidate_dni}
              </p>
            )}
          </div>

          {/* Fecha de Nacimiento */}
          <div>
            <Label htmlFor="candidate_birth_date">Fecha de Nacimiento</Label>
            <Input
              id="candidate_birth_date"
              name="candidate_birth_date"
              type="date"
              max={hoyStr}
              defaultValue={entrevista?.candidate_birth_date || ""}
              aria-invalid={Boolean(state.errores?.candidate_birth_date)}
              aria-describedby={
                state.errores?.candidate_birth_date
                  ? "candidate_birth_date-error"
                  : undefined
              }
              className={state.errores?.candidate_birth_date ? "border-rose-300" : ""}
            />
            {state.errores?.candidate_birth_date && (
              <p
                id="candidate_birth_date-error"
                role="alert"
                className="mt-1 text-xs text-rose-600"
              >
                {state.errores.candidate_birth_date}
              </p>
            )}
          </div>

          {/* Nombre del Acompañante */}
          <div>
            <Label htmlFor="companion_name">Familiar / Acompañante de Contacto</Label>
            <Input
              id="companion_name"
              name="companion_name"
              defaultValue={entrevista?.companion_name || ""}
              placeholder="Ej: Laura Gómez"
              aria-invalid={Boolean(state.errores?.companion_name)}
              aria-describedby={
                state.errores?.companion_name ? "companion_name-error" : undefined
              }
              className={state.errores?.companion_name ? "border-rose-300" : ""}
            />
            {state.errores?.companion_name && (
              <p
                id="companion_name-error"
                role="alert"
                className="mt-1 text-xs text-rose-600"
              >
                {state.errores.companion_name}
              </p>
            )}
          </div>

          {/* Teléfono del Acompañante */}
          <div>
            <Label htmlFor="companion_phone">Teléfono del Acompañante</Label>
            <Input
              id="companion_phone"
              name="companion_phone"
              value={telefonoAcompanante}
              onChange={e => setTelefonoAcompanante(e.target.value)}
              placeholder="Ej: +54 11 5555-1234"
              aria-invalid={Boolean(state.errores?.companion_phone)}
              aria-describedby={
                state.errores?.companion_phone ? "companion_phone-error" : undefined
              }
              className={state.errores?.companion_phone ? "border-rose-300" : ""}
            />
            {state.errores?.companion_phone && (
              <p
                id="companion_phone-error"
                role="alert"
                className="mt-1 text-xs text-rose-600"
              >
                {state.errores.companion_phone}
              </p>
            )}
          </div>

          {/* Vínculo */}
          <div>
            <Label htmlFor="companion_relationship">Vínculo con el Postulante</Label>
            <Input
              id="companion_relationship"
              name="companion_relationship"
              defaultValue={entrevista?.companion_relationship || ""}
              placeholder="Ej: Hija, Cónyuge, Sobrino, Apoderado"
              aria-invalid={Boolean(state.errores?.companion_relationship)}
              aria-describedby={
                state.errores?.companion_relationship
                  ? "companion_relationship-error"
                  : undefined
              }
              className={state.errores?.companion_relationship ? "border-rose-300" : ""}
            />
            {state.errores?.companion_relationship && (
              <p
                id="companion_relationship-error"
                role="alert"
                className="mt-1 text-xs text-rose-600"
              >
                {state.errores.companion_relationship}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Sección 2: Encuentro y Coordinación */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          2. Coordinación de la Entrevista
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Fecha de realización, profesional interviniente y estado de la entrevista.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Fecha de la Entrevista */}
          <div>
            <Label htmlFor="interview_date">
              Fecha de la Entrevista <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="interview_date"
              name="interview_date"
              type="date"
              required
              defaultValue={entrevista?.interview_date || hoyStr}
              aria-invalid={Boolean(state.errores?.interview_date)}
              aria-describedby={
                state.errores?.interview_date ? "interview_date-error" : undefined
              }
              className={state.errores?.interview_date ? "border-rose-300" : ""}
            />
            {state.errores?.interview_date && (
              <p
                id="interview_date-error"
                role="alert"
                className="mt-1 text-xs text-rose-600"
              >
                {state.errores.interview_date}
              </p>
            )}
          </div>

          {/* Profesional Entrevistador */}
          <div>
            <Label htmlFor="interviewer_employee_id">Profesional Asignado</Label>
            <Select
              id="interviewer_employee_id"
              name="interviewer_employee_id"
              defaultValue={entrevista?.interviewer_employee_id || ""}
            >
              <option value="">-- Sin profesional asignado --</option>
              {entrevistadores.map(e => (
                <option key={e.id} value={e.id}>
                  {e.last_name}, {e.first_name} ({e.job_title})
                </option>
              ))}
            </Select>
          </div>

          {/* Estado de la Entrevista */}
          <div>
            <Label htmlFor="status">Estado del Encuentro</Label>
            <Select
              id="status"
              name="status"
              defaultValue={entrevista?.status || "scheduled"}
            >
              {ESTADOS_ENTREVISTA.map(est => (
                <option key={est} value={est}>
                  {ETIQUETAS_ESTADO_ENTREVISTA[est]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Sección 3: Evaluación Integral Interdisciplinaria */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          3. Evaluación Integral Interdisciplinaria
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Valoración de la autonomía motriz, estado cognitivo, necesidades clínicas y
          perfil psicosocial.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Movilidad */}
          <div>
            <Label htmlFor="mobility_assessment">Autonomía y Movilidad</Label>
            <Select
              id="mobility_assessment"
              name="mobility_assessment"
              defaultValue={entrevista?.mobility_assessment || ""}
            >
              <option value="">-- No evaluado aún --</option>
              {EVALUACIONES_MOVILIDAD.map(m => (
                <option key={m} value={m}>
                  {ETIQUETAS_MOVILIDAD[m]}
                </option>
              ))}
            </Select>
          </div>

          {/* Cognitivo */}
          <div>
            <Label htmlFor="cognitive_assessment">Estado Cognitivo y Orientación</Label>
            <Select
              id="cognitive_assessment"
              name="cognitive_assessment"
              defaultValue={entrevista?.cognitive_assessment || ""}
            >
              <option value="">-- No evaluado aún --</option>
              {EVALUACIONES_COGNITIVAS.map(c => (
                <option key={c} value={c}>
                  {ETIQUETAS_COGNITIVA[c]}
                </option>
              ))}
            </Select>
          </div>

          {/* Notas Médicas */}
          <div className="sm:col-span-2">
            <Label htmlFor="medical_notes">
              Antecedentes Médicos y Cuidados Clínicos
            </Label>
            <Textarea
              id="medical_notes"
              name="medical_notes"
              rows={3}
              defaultValue={entrevista?.medical_notes || ""}
              placeholder="Diagnósticos previos, medicación habitual, alergias, requerimiento de oxígeno, sondas, cuidados de enfermería..."
              aria-invalid={Boolean(state.errores?.medical_notes)}
              aria-describedby={
                state.errores?.medical_notes ? "medical_notes-error" : undefined
              }
              className={state.errores?.medical_notes ? "border-rose-300" : ""}
            />
            {state.errores?.medical_notes && (
              <p
                id="medical_notes-error"
                role="alert"
                className="mt-1 text-xs text-rose-600"
              >
                {state.errores.medical_notes}
              </p>
            )}
          </div>

          {/* Notas Sociales */}
          <div className="sm:col-span-2">
            <Label htmlFor="social_notes">Dinámica Familiar y Aspecto Social</Label>
            <Textarea
              id="social_notes"
              name="social_notes"
              rows={3}
              value={notasSociales}
              onChange={e => setNotasSociales(e.target.value)}
              placeholder="Motivo de consulta, entorno de contención familiar, hábitos personales, expectativas y preferencias..."
              aria-invalid={Boolean(state.errores?.social_notes)}
              aria-describedby={
                state.errores?.social_notes ? "social_notes-error" : undefined
              }
              className={state.errores?.social_notes ? "border-rose-300" : ""}
            />
            {state.errores?.social_notes && (
              <p
                id="social_notes-error"
                role="alert"
                className="mt-1 text-xs text-rose-600"
              >
                {state.errores.social_notes}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Sección 4: Dictamen y Aptitud */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          4. Dictamen de Admisión y Conclusión
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Determinación de compatibilidad con el perfil asistencial de la residencia.
        </p>

        <div className="mt-6 space-y-6">
          {/* Conclusión */}
          <div>
            <Label htmlFor="conclusion">
              Dictamen de Aptitud <span className="text-rose-600">*</span>
            </Label>
            <Select
              id="conclusion"
              name="conclusion"
              value={conclusionSeleccionada}
              onChange={e =>
                setConclusionSeleccionada(e.target.value as ConclusionEntrevista)
              }
            >
              {CONCLUSIONES_ENTREVISTA.map(c => (
                <option key={c} value={c}>
                  {ETIQUETAS_CONCLUSION[c]}
                </option>
              ))}
            </Select>
          </div>

          {/* Motivo de No Apto (condicional obligatorio) */}
          {conclusionSeleccionada === "no_apto" && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-4">
              <Label htmlFor="rejection_reason" className="font-semibold text-rose-900">
                Motivo del Dictamen No Apto <span className="text-rose-600">*</span>
              </Label>
              <p className="mb-2 text-xs text-rose-700">
                Detallá las razones técnicas o asistenciales por las cuales el perfil
                excede las capacidades de atención de la residencia (ej. requerimiento de
                internación psiquiátrica monovalente).
              </p>
              <Textarea
                id="rejection_reason"
                name="rejection_reason"
                required
                rows={3}
                defaultValue={entrevista?.rejection_reason || ""}
                placeholder="Indique con claridad los motivos clínicos o de seguridad..."
                aria-invalid={Boolean(state.errores?.rejection_reason)}
                aria-describedby={
                  state.errores?.rejection_reason ? "rejection_reason-error" : undefined
                }
                className={state.errores?.rejection_reason ? "border-rose-300" : ""}
              />
              {state.errores?.rejection_reason && (
                <p
                  id="rejection_reason-error"
                  role="alert"
                  className="mt-1 text-xs text-rose-600"
                >
                  {state.errores.rejection_reason}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3">
        <Link href="/entrevistas">
          <Button type="button" variant="outline" disabled={isPending}>
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando..."
            : entrevista?.id
              ? "Actualizar Entrevista"
              : "Guardar Entrevista"}
        </Button>
      </div>
    </form>
  );
}
