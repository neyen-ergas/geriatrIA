import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import TurnosPage from "./page";

const mocks = vi.hoisted(() => ({
  sesion: vi.fn(),
  turnos: vi.fn(),
  empleados: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/turnos-datos", () => ({
  listarTurnosSemana: mocks.turnos,
  listarEmpleadosParaTurnos: mocks.empleados,
}));

const parametros = { searchParams: Promise.resolve({ semana: "2026-09-16" }) };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.sesion.mockResolvedValue("admin");
  mocks.turnos.mockResolvedValue([]);
  mocks.empleados.mockResolvedValue([]);
});

it("exige sesión antes de consultar la planificación de turnos", async () => {
  mocks.sesion.mockRejectedValue(new Error("LOGIN"));
  await expect(TurnosPage(parametros)).rejects.toThrow("LOGIN");
  expect(mocks.turnos).not.toHaveBeenCalled();
  expect(mocks.empleados).not.toHaveBeenCalled();
});

it("renderiza la navegación semanal y la grilla con turnos asignados", async () => {
  mocks.empleados.mockResolvedValue([
    {
      id: "emp-1",
      first_name: "Lucía",
      last_name: "González",
      job_title: "Enfermera",
      hired_at: "2026-01-01",
      terminated_at: null,
    },
  ]);
  mocks.turnos.mockResolvedValue([
    {
      id: "turno-1",
      employee_id: "emp-1",
      shift_date: "2026-09-16",
      shift_type: "manana",
      status: "scheduled",
      notes: "Sector A",
      created_at: "2026-09-15T10:00:00Z",
      updated_at: "2026-09-15T10:00:00Z",
    },
  ]);

  const html = renderToStaticMarkup(await TurnosPage(parametros));
  expect(html).toContain("Turnos del personal");
  expect(html).toContain("González, Lucía");
  expect(html).toContain("Enfermera");
  expect(html).toContain("Mañana");
  expect(html).toContain("Sector A");
  expect(html).toContain("1 turno programado");
  expect(html).toContain('href="/turnos?semana=2026-09-21"');
});

it("muestra mensaje apropiado cuando no hay empleados para planificar", async () => {
  mocks.empleados.mockResolvedValue([]);
  mocks.turnos.mockResolvedValue([]);

  const html = renderToStaticMarkup(await TurnosPage(parametros));
  expect(html).toContain("No hay empleados activos para planificar turnos");
});

it("muestra ausencia y cobertura cuando un turno está marcado como absent", async () => {
  mocks.empleados.mockResolvedValue([
    {
      id: "emp-1",
      first_name: "Carlos",
      last_name: "Benítez",
      job_title: "Cuidador",
      hired_at: "2026-01-01",
      terminated_at: null,
    },
  ]);
  mocks.turnos.mockResolvedValue([
    {
      id: "turno-2",
      employee_id: "emp-1",
      shift_date: "2026-09-15",
      shift_type: "noche",
      status: "absent",
      absence_reason: "Gripe",
      covered_by_employee_id: "emp-2",
      covered_by: { first_name: "Marta", last_name: "Pérez" },
      notes: null,
      created_at: "2026-09-15T10:00:00Z",
      updated_at: "2026-09-15T10:00:00Z",
    },
  ]);

  const html = renderToStaticMarkup(await TurnosPage(parametros));
  expect(html).toContain("Ausente");
  expect(html).toContain("Cubre: Pérez");
});
