import { describe, expect, it } from "vitest";
import {
  mensajeErrorGestionConsulta,
  validarGestionConsulta,
  type AccionConsulta,
} from "@/lib/gestion-consulta";

const ID = "00000000-0000-4000-8000-000000000001";
const VERSION = "2026-09-06T10:00:00.123456+00:00";
const HOY = "2026-09-06";

describe("gestión de consultas", () => {
  it("conserva los microsegundos de la versión vista por el operador", () => {
    expect(validarGestionConsulta("change_state", formulario(), HOY)).toEqual({
      ok: true,
      datos: {
        p_id: ID,
        p_expected_updated_at: VERSION,
        p_expected_state: "nuevo",
        p_action: "change_state",
        p_state: "contactado",
      },
    });
  });

  it.each([
    ["id", ""],
    ["id", "no-es-un-uuid"],
    ["actualizado_en", ""],
    ["actualizado_en", "2026-09-06"],
    ["estado_esperado", ""],
    ["estado_esperado", "inventado"],
  ])("rechaza %s inválido sin construir una escritura", (campo, valor) => {
    const datos = formulario({ [campo]: valor });
    expect(validarGestionConsulta("change_state", datos, HOY).ok).toBe(false);
  });

  it("impide registrar un ingreso directamente desde una consulta nueva", () => {
    const datos = formulario({ estado: "ingreso" });
    expect(validarGestionConsulta("change_state", datos, HOY).ok).toBe(false);
  });

  it("permite reabrir explícitamente una consulta descartada", () => {
    const datos = formulario({
      estado_esperado: "descartada",
      estado: "nuevo",
    });
    expect(validarGestionConsulta("change_state", datos, HOY).ok).toBe(true);
  });

  it.each(["ingreso", "descartada"])(
    "no permite agendar ni cancelar una consulta cerrada como %s",
    (estado) => {
      const datos = formulario({ estado_esperado: estado });
      expect(validarGestionConsulta("schedule_visit", datos, HOY).ok).toBe(
        false,
      );
      expect(validarGestionConsulta("cancel_visit", datos, HOY).ok).toBe(false);
    },
  );

  it("cancela una visita vigente y envía su versión original", () => {
    const datos = formulario({ estado_esperado: "visita_agendada" });
    expect(validarGestionConsulta("cancel_visit", datos, HOY)).toMatchObject({
      ok: true,
      datos: { p_expected_updated_at: VERSION, p_action: "cancel_visit" },
    });
  });

  it("reprograma aunque el estado no cambie y conserva la versión", () => {
    const datos = formulario({ estado_esperado: "visita_agendada" });
    expect(validarGestionConsulta("schedule_visit", datos, HOY)).toMatchObject({
      ok: true,
      datos: {
        p_expected_updated_at: VERSION,
        p_visit_date: "2026-09-07",
        p_visit_slot: "tarde",
      },
    });
  });

  it.each([
    ["visita_fecha", "2026-09-31"],
    ["visita_fecha", "2026-09-05"],
    ["visita_franja", "noche"],
  ])("rechaza una agenda con %s inválido", (campo, valor) => {
    const datos = formulario({ [campo]: valor });
    expect(validarGestionConsulta("schedule_visit", datos, HOY).ok).toBe(false);
  });

  it.each(["nuevo", "ingreso", "descartada"])(
    "permite notas en %s sin eludir el control de versión",
    (estado) => {
      const datos = formulario({
        estado_esperado: estado,
        notas_internas: " ",
      });
      expect(validarGestionConsulta("save_notes", datos, HOY)).toMatchObject({
        ok: true,
        datos: { p_expected_updated_at: VERSION, p_notes: "" },
      });
    },
  );

  it.each<AccionConsulta>([
    "change_state",
    "schedule_visit",
    "cancel_visit",
    "save_notes",
  ])("exige la versión también para %s", (accion) => {
    const datos = formulario({ actualizado_en: "" });
    expect(validarGestionConsulta(accion, datos, HOY).ok).toBe(false);
  });
});

describe("errores de escritura", () => {
  it("pide recargar al detectar un conflicto", () => {
    expect(mensajeErrorGestionConsulta({ code: "40001" })).toContain(
      "Recargala",
    );
  });

  it("explica el choque de turno", () => {
    expect(mensajeErrorGestionConsulta({ code: "23505" })).toContain("ocupado");
  });

  it("no devuelve códigos internos para errores inesperados", () => {
    expect(mensajeErrorGestionConsulta({ code: "XX000" })).toBe(
      "No se pudo guardar el cambio. Intentá nuevamente en unos minutos.",
    );
  });
});

function formulario(campos: Record<string, string> = {}): FormData {
  const datos = new FormData();
  for (const [nombre, valor] of Object.entries({
    id: ID,
    actualizado_en: VERSION,
    estado_esperado: "nuevo",
    estado: "contactado",
    visita_fecha: "2026-09-07",
    visita_franja: "tarde",
    ...campos,
  }))
    datos.set(nombre, valor);
  return datos;
}
