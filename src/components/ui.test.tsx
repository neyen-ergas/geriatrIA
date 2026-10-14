import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { Button, Input, Select, Textarea } from "./ui";

it("renderiza Button con clases de foco visible de alto contraste", () => {
  const html = renderToStaticMarkup(<Button>Acción</Button>);
  expect(html).toContain("focus-visible:ring-2");
  expect(html).toContain("focus-visible:ring-casona-700");
  expect(html).toContain("focus-visible:ring-offset-2");
});

it("renderiza Input con clases de foco visible accesibles", () => {
  const html = renderToStaticMarkup(<Input id="campo" name="campo" />);
  expect(html).toContain("focus-visible:ring-2");
  expect(html).toContain("focus-visible:ring-casona-600/40");
});

it("renderiza Textarea con clases de foco visible accesibles", () => {
  const html = renderToStaticMarkup(<Textarea id="notas" name="notas" />);
  expect(html).toContain("focus-visible:ring-2");
  expect(html).toContain("focus-visible:ring-casona-600/40");
});

it("renderiza Select accesible con opciones y clases de foco", () => {
  const html = renderToStaticMarkup(
    <Select id="opciones" name="opciones">
      <option value="1">Opción 1</option>
      <option value="2">Opción 2</option>
    </Select>,
  );
  expect(html).toContain("<select");
  expect(html).toContain("focus-visible:ring-2");
  expect(html).toContain("focus-visible:ring-casona-600/40");
  expect(html).toContain("Opción 1");
});

it("botones y campos ofrecen un objetivo táctil de al menos 44px", () => {
  for (const html of [
    renderToStaticMarkup(<Button>Acción</Button>),
    renderToStaticMarkup(<Input id="campo" />),
    renderToStaticMarkup(<Select id="opciones" />),
  ])
    expect(html).toContain("min-h-11");
});
