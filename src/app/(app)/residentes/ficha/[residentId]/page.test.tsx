import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import type { FichaResidente } from "@/lib/ficha-residente";
import FichaPage from "./page";

const mocks = vi.hoisted(() => ({ sesion: vi.fn(), ficha: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/ficha-residente-datos", () => ({ obtenerFichaResidente: mocks.ficha }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
const residenteId = "86000000-0000-4000-8000-000000000001";
const ficha: FichaResidente = {
  residente: { id: residenteId, first_name: "Persona <script>", last_name: "Ficticia",
    dni: "TEST-FICHA", birth_date: "1940-01-02", phone: null, address: null,
    notes: "<script>alert(1)</script>" },
  ingresoActivoId: "activo",
  contactos: { total: 1, pagina: 1, filas: [{ id: "familiar", first_name: "Familiar",
    last_name: "Ficticio", relationship: "Hija", phone: "0000000",
    is_emergency_contact: true, is_payment_responsible: false, notes: null }] },
  estadias: { total: 1205, pagina: 25, filas: [{ id: "historico", admitted_at: "2025-01-02",
    discharged_at: "2025-02-02", discharge_reason: "Motivo ficticio", room: "1",
    monthly_fee: 100, currency: "ARS", due_day: 10, administrative_notes: null }] },
};
const parametros = {
  params: Promise.resolve({ residentId: residenteId }),
  searchParams: Promise.resolve({ estadias: "25" }),
};
beforeEach(() => {
  vi.resetAllMocks(); mocks.sesion.mockResolvedValue("admin");
  mocks.ficha.mockResolvedValue(ficha);
});
it("exige permiso operativo antes de leer la ficha", async () => {
  mocks.sesion.mockRejectedValue(new Error("SIN_ACCESO"));
  await expect(FichaPage(parametros)).rejects.toThrow("SIN_ACCESO");
  expect(mocks.sesion).toHaveBeenCalledWith("operational.read");
  expect(mocks.ficha).not.toHaveBeenCalled();
});
it("Solo lectura ve contactos, bajas y cuentas sin acciones de gestión", async () => {
  mocks.sesion.mockResolvedValue("readonly");
  const html = renderToStaticMarkup(await FichaPage(parametros));
  expect(html).toContain("Familiar Ficticio");
  expect(html).toContain("Motivo ficticio");
  expect(html).toContain("/contabilidad/historico");
  expect(html).not.toMatch(/\/editar|\/baja|\/reingreso\//);
  expect(html).toContain("02/01/1940");
  expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  expect(html).not.toContain("<script>");
});
it.each(["admin", "management"])("%s gestiona el ingreso activo aunque mire una página antigua", async rol => {
  mocks.sesion.mockResolvedValue(rol);
  const html = renderToStaticMarkup(await FichaPage(parametros));
  expect(html).toContain("/residentes/activo/editar");
  expect(html).not.toContain("/residentes/historico/editar");
  expect(html).not.toContain("Registrar reingreso");
  expect(html).toContain("estadias=24#estadias");
});
it("sin ingreso activo ofrece reingreso y mantiene el historial", async () => {
  mocks.ficha.mockResolvedValue({ ...ficha, ingresoActivoId: null });
  const html = renderToStaticMarkup(await FichaPage(parametros));
  expect(html).toContain(`/residentes/reingreso/${residenteId}`);
  expect(html).toContain("Sin estadía activa");
});
it("presenta estados vacíos y no ofrece reingreso sin estadías previas", async () => {
  mocks.ficha.mockResolvedValue({ ...ficha, ingresoActivoId: null,
    contactos: { total: 0, pagina: 1, filas: [] },
    estadias: { total: 0, pagina: 1, filas: [] } });
  const html = renderToStaticMarkup(await FichaPage(parametros));
  expect(html).toContain("No hay contactos registrados");
  expect(html).toContain("No hay estadías registradas");
  expect(html).not.toContain("Registrar reingreso");
});
it("responde no encontrado solo cuando la persona no existe", async () => {
  mocks.ficha.mockResolvedValue(null);
  await expect(FichaPage(parametros)).rejects.toThrow("NOT_FOUND");
  mocks.ficha.mockRejectedValue(new Error("No se pudo cargar la ficha"));
  await expect(FichaPage(parametros)).rejects.toThrow("No se pudo cargar la ficha");
});
