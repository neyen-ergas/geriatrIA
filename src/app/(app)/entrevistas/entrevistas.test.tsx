import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import EntrevistasPage from "./page";

const mocks = vi.hoisted(() => ({
  sesion: vi.fn(),
  entrevistas: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/entrevistas-datos", () => ({
  listarEntrevistas: mocks.entrevistas,
}));

const parametros = {
  searchParams: Promise.resolve({}),
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.sesion.mockResolvedValue("admin");
  mocks.entrevistas.mockResolvedValue([]);
});

it("exige sesión de administración antes de consultar entrevistas", async () => {
  mocks.sesion.mockRejectedValue(new Error("ACCESO_DENEGADO"));
  await expect(EntrevistasPage(parametros)).rejects.toThrow("ACCESO_DENEGADO");
  expect(mocks.entrevistas).not.toHaveBeenCalled();
});

it("renderiza la cabecera, métricas KPI y el listado de entrevistas", async () => {
  mocks.entrevistas.mockResolvedValue([
    {
      id: "ent-1",
      candidate_name: "Rosa Martínez",
      candidate_dni: "4892110",
      candidate_birth_date: "1945-06-12",
      companion_name: "Laura Gómez",
      companion_phone: "+54 11 4444-5555",
      companion_relationship: "Hija",
      consultation_id: null,
      interview_date: "2026-09-16",
      interviewer_employee_id: "emp-1",
      status: "scheduled",
      conclusion: "apto",
      mobility_assessment: "autovalido",
      cognitive_assessment: "lucido",
      medical_notes: "Hipertensión controlada",
      social_notes: "Muy acompañada por su familia",
      rejection_reason: null,
      created_at: "2026-09-15T10:00:00Z",
      updated_at: "2026-09-15T10:00:00Z",
      created_by: "user-1",
      updated_by: "user-1",
      interviewer: {
        id: "emp-1",
        first_name: "Carlos",
        last_name: "Médico",
        job_title: "Director Médico",
      },
    },
  ]);

  const html = renderToStaticMarkup(await EntrevistasPage(parametros));
  expect(html).toContain("Entrevistas de Admisión");
  expect(html).toContain("Rosa Martínez");
  expect(html).toContain("DNI 4892110");
  expect(html).toContain("Laura Gómez");
  expect(html).toContain("Autoválido");
  expect(html).toContain("Lúcido / Sin deterioro");
  expect(html).toContain("Director Médico");
  expect(html).toContain('href="/entrevistas/ent-1"');
});

it("muestra estado vacío amigable cuando no hay entrevistas", async () => {
  mocks.entrevistas.mockResolvedValue([]);

  const html = renderToStaticMarkup(await EntrevistasPage(parametros));
  expect(html).toContain("No se encontraron entrevistas");
  expect(html).toContain("Programar primera entrevista");
  expect(html).toContain('href="/entrevistas/nueva"');
});

it("muestra tarjeta de error recuperable si falla la base de datos", async () => {
  mocks.entrevistas.mockRejectedValue(new Error("DB_DOWN"));

  const html = renderToStaticMarkup(await EntrevistasPage(parametros));
  expect(html).toContain("No se pudieron cargar las entrevistas de admisión");
  expect(html).toContain("Reintentar carga");
});
