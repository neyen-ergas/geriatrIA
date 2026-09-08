import { describe, expect, it } from "vitest";
import { enlaceAdmision, paginaAdmision } from "./paginacion-admision";

describe("navegación de Admisión", () => {
  it.each([undefined, ["2"], "0", "-1", "2.5", "1e3", "abc", "999999999999999999"])(
    "usa la primera página ante entrada inválida %s", (entrada) => {
      expect(paginaAdmision(entrada, 1255)).toBe(1);
    },
  );
  it("ajusta una página que dejó de existir tras cambiar el listado", () => {
    expect(paginaAdmision("99", 1255)).toBe(26);
    expect(paginaAdmision("99", 0)).toBe(1);
  });
  it("mantiene una página intermedia válida", () => {
    expect(paginaAdmision("12", 1255)).toBe(12);
  });
  it("conserva el filtro al navegar y elimina pagina al volver al inicio", () => {
    expect(enlaceAdmision(3, "contactado")).toBe("/admision?estado=contactado&pagina=3");
    expect(enlaceAdmision(1, "contactado")).toBe("/admision?estado=contactado");
    expect(enlaceAdmision(1)).toBe("/admision");
  });
});
