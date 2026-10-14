import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import ErrorGlobal from "../global-error";
import ErrorSeccion from "./error";

const error = Object.assign(new Error("dato privado de la base"), {
  digest: "identificador-interno",
});

it.each([
  ["la sección", ErrorSeccion],
  ["la aplicación", ErrorGlobal],
])("el error de %s ofrece recargar sin mostrar el detalle interno", (_, Componente) => {
  const html = renderToStaticMarkup(createElement(Componente, { error, reset: vi.fn() }));
  expect(html).toContain("Volver a cargar");
  expect(html).toContain('role="alert"');
  expect(html).not.toContain("dato privado");
  expect(html).not.toContain("identificador-interno");
});
