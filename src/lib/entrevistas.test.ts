import { expect, it } from "vitest";
import {
  calcularKpisEntrevistas,
  CONCLUSIONES_ENTREVISTA,
  ESTADOS_ENTREVISTA,
  ETIQUETAS_COGNITIVA,
  ETIQUETAS_CONCLUSION,
  ETIQUETAS_ESTADO_ENTREVISTA,
  ETIQUETAS_MOVILIDAD,
  EVALUACIONES_COGNITIVAS,
  EVALUACIONES_MOVILIDAD,
  validarEntrevistaForm,
  type Entrevista,
  type EntrevistaFormValues,
} from "./entrevistas";

it("valida todas las opciones de movilidad, estado cognitivo, estado y dictamen", () => {
  for (const estado of ESTADOS_ENTREVISTA) {
    expect(ETIQUETAS_ESTADO_ENTREVISTA[estado]).toBeDefined();
  }
  for (const mov of EVALUACIONES_MOVILIDAD) {
    expect(ETIQUETAS_MOVILIDAD[mov]).toBeDefined();
  }
  for (const cog of EVALUACIONES_COGNITIVAS) {
    expect(ETIQUETAS_COGNITIVA[cog]).toBeDefined();
  }
  for (const c of CONCLUSIONES_ENTREVISTA) {
    expect(ETIQUETAS_CONCLUSION[c]).toBeDefined();
  }
});

it("aprueba un formulario con datos válidos", () => {
  const form: Partial<EntrevistaFormValues> = {
    candidate_name: "Rosa Martínez",
    candidate_dni: "4892110",
    candidate_birth_date: "1945-06-12",
    interview_date: "2026-09-16",
    status: "scheduled",
    mobility_assessment: "autovalido",
    cognitive_assessment: "lucido",
    conclusion: "apto",
    companion_name: "Laura Gómez",
    companion_phone: "+54 11 4444-5555",
    companion_relationship: "Hija",
  };

  const resultado = validarEntrevistaForm(form);
  expect(resultado.valido).toBe(true);
  expect(resultado.errores).toEqual({});
});

it("rechaza si el nombre del postulante está vacío o supera 200 caracteres", () => {
  const vacio = validarEntrevistaForm({
    candidate_name: "   ",
    interview_date: "2026-09-16",
  });
  expect(vacio.valido).toBe(false);
  expect(vacio.errores.candidate_name).toBeDefined();

  const largo = validarEntrevistaForm({
    candidate_name: "A".repeat(201),
    interview_date: "2026-09-16",
  });
  expect(largo.valido).toBe(false);
  expect(largo.errores.candidate_name).toBeDefined();
});

it("exige fecha de entrevista con formato válido", () => {
  const sinFecha = validarEntrevistaForm({ candidate_name: "Rosa" });
  expect(sinFecha.valido).toBe(false);
  expect(sinFecha.errores.interview_date).toBeDefined();

  const fechaInvalida = validarEntrevistaForm({
    candidate_name: "Rosa",
    interview_date: "fecha-invalida",
  });
  expect(fechaInvalida.valido).toBe(false);
  expect(fechaInvalida.errores.interview_date).toBeDefined();
});

it("rechaza fecha de nacimiento futura", () => {
  const futuro = validarEntrevistaForm({
    candidate_name: "Rosa",
    interview_date: "2026-09-16",
    candidate_birth_date: "2099-01-01",
  });
  expect(futuro.valido).toBe(false);
  expect(futuro.errores.candidate_birth_date).toContain("no puede ser futura");
});

it("exige motivo obligatorio cuando el dictamen es no_apto", () => {
  const sinMotivo = validarEntrevistaForm({
    candidate_name: "Rosa",
    interview_date: "2026-09-16",
    conclusion: "no_apto",
    rejection_reason: "   ",
  });
  expect(sinMotivo.valido).toBe(false);
  expect(sinMotivo.errores.rejection_reason).toContain("Debe indicar el motivo");

  const conMotivo = validarEntrevistaForm({
    candidate_name: "Rosa",
    interview_date: "2026-09-16",
    conclusion: "no_apto",
    rejection_reason: "Requiere internación psiquiátrica monovalente.",
  });
  expect(conMotivo.valido).toBe(true);
});

it("valida límite de longitud en notas médicas y sociales", () => {
  const notasExcedidas = validarEntrevistaForm({
    candidate_name: "Rosa",
    interview_date: "2026-09-16",
    medical_notes: "M".repeat(4001),
    social_notes: "S".repeat(4001),
  });
  expect(notasExcedidas.valido).toBe(false);
  expect(notasExcedidas.errores.medical_notes).toBeDefined();
  expect(notasExcedidas.errores.social_notes).toBeDefined();
});

it("calcula métricas y KPIs de entrevistas correctamente", () => {
  const entrevistas: Entrevista[] = [
    {
      id: "1",
      candidate_name: "Postulante 1",
      candidate_dni: null,
      candidate_birth_date: null,
      companion_name: null,
      companion_phone: null,
      companion_relationship: null,
      consultation_id: null,
      interview_date: "2026-09-16",
      interviewer_employee_id: null,
      status: "scheduled",
      conclusion: "pendiente",
      mobility_assessment: null,
      cognitive_assessment: null,
      medical_notes: null,
      social_notes: null,
      rejection_reason: null,
      created_at: "2026-09-15T00:00:00Z",
      updated_at: "2026-09-15T00:00:00Z",
      created_by: "user-1",
      updated_by: "user-1",
    },
    {
      id: "2",
      candidate_name: "Postulante 2",
      candidate_dni: null,
      candidate_birth_date: null,
      companion_name: null,
      companion_phone: null,
      companion_relationship: null,
      consultation_id: null,
      interview_date: "2026-09-15",
      interviewer_employee_id: null,
      status: "completed",
      conclusion: "apto",
      mobility_assessment: "autovalido",
      cognitive_assessment: "lucido",
      medical_notes: null,
      social_notes: null,
      rejection_reason: null,
      created_at: "2026-09-15T00:00:00Z",
      updated_at: "2026-09-15T00:00:00Z",
      created_by: "user-1",
      updated_by: "user-1",
    },
    {
      id: "3",
      candidate_name: "Postulante 3",
      candidate_dni: null,
      candidate_birth_date: null,
      companion_name: null,
      companion_phone: null,
      companion_relationship: null,
      consultation_id: null,
      interview_date: "2026-09-14",
      interviewer_employee_id: null,
      status: "completed",
      conclusion: "apto_con_observaciones",
      mobility_assessment: "semidependiente",
      cognitive_assessment: "deterioro_leve",
      medical_notes: null,
      social_notes: null,
      rejection_reason: null,
      created_at: "2026-09-14T00:00:00Z",
      updated_at: "2026-09-14T00:00:00Z",
      created_by: "user-1",
      updated_by: "user-1",
    },
    {
      id: "4",
      candidate_name: "Postulante 4",
      candidate_dni: null,
      candidate_birth_date: null,
      companion_name: null,
      companion_phone: null,
      companion_relationship: null,
      consultation_id: null,
      interview_date: "2026-09-13",
      interviewer_employee_id: null,
      status: "completed",
      conclusion: "no_apto",
      mobility_assessment: "dependiente_total",
      cognitive_assessment: "demencia_avanzada",
      medical_notes: null,
      social_notes: null,
      rejection_reason: "Requiere monitoreo intensivo.",
      created_at: "2026-09-13T00:00:00Z",
      updated_at: "2026-09-13T00:00:00Z",
      created_by: "user-1",
      updated_by: "user-1",
    },
  ];

  const kpis = calcularKpisEntrevistas(entrevistas);
  expect(kpis.total).toBe(4);
  expect(kpis.programadas).toBe(1);
  expect(kpis.completadas).toBe(3);
  expect(kpis.aptas).toBe(2); // apto + apto_con_observaciones
  expect(kpis.noAptas).toBe(1);
  expect(kpis.pendientes).toBe(1);
});
