import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import ErrorAdmision from "./error";

it("ofrece recargar sin mostrar el error interno ni su identificador", () => {
  const error = Object.assign(new Error("dato privado de la base"), {
    digest: "identificador-interno",
  });
  const html = renderToStaticMarkup(createElement(ErrorAdmision, {
    error, reset: vi.fn(),
  }));
  expect(html).toContain("No pudimos cargar Admisión");
  expect(html).toContain("Volver a cargar");
  expect(html).toContain('role="alert"');
  expect(html).not.toContain("dato privado");
  expect(html).not.toContain("identificador-interno");
});
