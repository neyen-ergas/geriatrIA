import { expect, it } from "vitest";
import { validarConsultaManual } from "./consulta-manual";

function formulario() {
  const datos = new FormData();
  datos.set("nombre", " Ana Pérez ");
  datos.set("telefono", " 11 5555 1234 ");
  datos.set("motivo", " Consulta por vacante ");
  datos.set("origen", "telefono");
  datos.set("momento", "indistinto");
  datos.set("proximo_paso", "llamar");
  return datos;
}

it("recoge sólo los datos mínimos y limpia espacios", () => {
  expect(validarConsultaManual(formulario())).toEqual({
    ok: true,
    datos: {
      nombre: "Ana Pérez",
      telefono: "11 5555 1234",
      motivo: "Consulta por vacante",
      origen: "telefono",
      momento: "indistinto",
      proximoPaso: "llamar",
      permitirDuplicado: false,
    },
  });
});

it("rechaza teléfonos incompletos y valores de origen o acción inventados", () => {
  const datos = formulario();
  datos.set("telefono", "---");
  expect(validarConsultaManual(datos).ok).toBe(false);
  datos.set("telefono", "11 5555 1234");
  datos.set("origen", "web");
  expect(validarConsultaManual(datos).ok).toBe(false);
  datos.set("origen", "presencial");
  datos.set("proximo_paso", "borrar");
  expect(validarConsultaManual(datos).ok).toBe(false);
});
