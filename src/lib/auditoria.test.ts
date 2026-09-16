import { expect, it } from "vitest";
import {
  enlaceAuditoria,
  leerFiltrosAuditoria,
  limiteFechaAuditoria,
  regresoAuditoria,
} from "./auditoria";
import { formatearValorAuditoria } from "./auditoria-campos";
import { puedeVerSeccion } from "./permisos";

it.each([
  { tabla: "auth.users" },
  { accion: "truncate" },
  { autor: "x,or(role.eq.admin)" },
  { desde: "2025-02-29" },
  { hasta: "2026-04-31" },
  { desde: "2026-09-02", hasta: "2026-09-01" },
  { tabla: ["payments", "employees"] },
  { registro: "84000000-0000-4000-8000-000000000001" },
])("rechaza filtros inválidos sin ampliar silenciosamente la búsqueda: %j", filtros => {
  expect(leerFiltrosAuditoria(filtros).error).toBeTruthy();
});
it("admite fechas reales y límites inclusivos del día argentino", () => {
  expect(
    leerFiltrosAuditoria({
      desde: "2024-02-29",
      hasta: "2024-02-29",
      autor: "sin-usuario",
    }).error,
  ).toBeNull();
  expect(limiteFechaAuditoria("2024-02-29")).toBe("2024-02-29T03:00:00.000Z");
  expect(limiteFechaAuditoria("2024-02-29", true)).toBe("2024-03-01T03:00:00.000Z");
  expect(limiteFechaAuditoria("2026-12-31", true)).toBe("2027-01-01T03:00:00.000Z");
});
it("conserva filtros y página al volver, sin admitir destinos externos", () => {
  const enlace = enlaceAuditoria(
    { tabla: "payments", autor: "sin-usuario", desde: "2026-09-01" },
    4,
  );
  expect(regresoAuditoria(enlace)).toBe(enlace);
  for (const entrada of [
    "https://evil.invalid",
    "//evil.invalid",
    "/auditoria/../accesos",
    [enlace],
    "/auditoria?tabla=payments&tabla=employees",
  ])
    expect(regresoAuditoria(entrada)).toBe("/auditoria");
});
it("distingue dato desconocido, vacío y valores sin alterar texto literal", () => {
  expect(formatearValorAuditoria("notes", undefined)).toBe("No registrado");
  expect(formatearValorAuditoria("notes", null)).toBe("Vacío");
  expect(formatearValorAuditoria("enabled", false)).toBe("No");
  expect(formatearValorAuditoria("role", "management")).toBe("Gestión");
  expect(formatearValorAuditoria("birth_date", "1940-01-02")).toBe("02/01/1940");
  expect(formatearValorAuditoria("notes", "1940-01-02")).toBe("1940-01-02");
});
it("solo Administrador encuentra Auditoría en navegación", () => {
  expect(puedeVerSeccion("admin", "/auditoria")).toBe(true);
  expect(puedeVerSeccion("management", "/auditoria")).toBe(false);
  expect(puedeVerSeccion("readonly", "/auditoria")).toBe(false);
});
