import { expect, it } from "vitest";
import { enlaceResidentes } from "./paginacion-residentes";
import { paginaListado } from "./paginacion";

it("conserva la vista al navegar y ajusta páginas fuera de rango", () => {
  expect(enlaceResidentes(2, true)).toBe("/residentes?estado=bajas&pagina=2");
  expect(enlaceResidentes(1, true)).toBe("/residentes?estado=bajas");
  expect(enlaceResidentes(2, false)).toBe("/residentes?pagina=2");
  expect(enlaceResidentes(1, false)).toBe("/residentes");
  expect(paginaListado("99", 1255)).toBe(26);
  expect(paginaListado(["2"], 1255)).toBe(1);
  expect(paginaListado("2", 0)).toBe(1);
});
