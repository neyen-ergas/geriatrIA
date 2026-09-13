import { expect, it } from "vitest";
import { busquedaConsultas, filtroBusquedaConsultas } from "./busqueda-consultas";
import { enlaceAdmision } from "./paginacion-admision";
import { enlaceVencimientos } from "./vencimientos";

it("busca nombres compuestos y teléfonos con separadores", () => {
  expect(filtroBusquedaConsultas("  Ana Pérez ")).toBe("nombre.ilike.*Ana*Pérez*,telefono.ilike.*Ana Pérez*");
  expect(filtroBusquedaConsultas("11-2345")).toContain("telefono.ilike.*1*1*2*3*4*5*");
  expect(filtroBusquedaConsultas("O'Connor")).toContain("nombre.ilike.*O'Connor*");
});
it("la entrada nunca incorpora operadores o comodines del filtro", () => {
  const filtro = filtroBusquedaConsultas('%,estado.eq.ingreso),nombre.ilike.("*');
  expect(filtro).not.toMatch(/[()%_"\\]/);
  expect(filtro?.split(",")).toHaveLength(2);
  expect(busquedaConsultas(["Ana"])).toBe("");
  expect(busquedaConsultas("x".repeat(200))).toHaveLength(80);
  expect(filtroBusquedaConsultas(" ")).toBeNull();
});
it("la búsqueda y el alcance sobreviven a la paginación", () => {
  const url = new URL(enlaceAdmision(2, "contactado", "Ana Pérez"), "https://ficticio.invalid");
  expect(url.searchParams.get("buscar")).toBe("Ana Pérez");
  expect(url.searchParams.get("estado")).toBe("contactado");
  expect(url.searchParams.get("pagina")).toBe("2");
  expect(enlaceVencimientos("2026-09", true, 2, true)).toContain("alcance=todas");
});
