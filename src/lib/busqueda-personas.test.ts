import { expect, it } from "vitest";
import { busquedaPersonas, filtroBusquedaPersonas } from "./busqueda-personas";

it("limpia sintaxis del buscador y admite nombre y apellido en ambos órdenes", () => {
  expect(busquedaPersonas("  Ana,(Pérez)  ")).toBe("Ana Pérez");
  expect(filtroBusquedaPersonas("Ana Pérez")).toContain(
    "and(first_name.ilike.*Ana*,last_name.ilike.*Pérez*)",
  );
  expect(filtroBusquedaPersonas("Ana Pérez")).toContain(
    "and(first_name.ilike.*Pérez*,last_name.ilike.*Ana*)",
  );
  expect(filtroBusquedaPersonas("%%,,")).toBeNull();
});
