import { expect, it } from "vitest";
import { errorRecuperacion } from "./recuperacion-contrasena";

it.each([{ status: 429 }, { code: "over_email_send_rate_limit" }])(
  "el límite de envío no promete un plazo exacto: %j",
  error => {
    expect(errorRecuperacion(error)).toContain("límite");
    expect(errorRecuperacion(error)).toContain("esperá");
  },
);
it("otros errores no informan si la cuenta existe", () => {
  expect(errorRecuperacion({ code: "user_not_found" })).toBe(
    errorRecuperacion({ status: 500 }),
  );
});
