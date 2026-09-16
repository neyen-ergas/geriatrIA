import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import ReservarPage from "./page";
import { reservarVisita } from "./actions";

const mocks = vi.hoisted(() => ({
  sesion: vi.fn(),
  agenda: vi.fn(),
  familias: vi.fn(),
  guardar: vi.fn(),
  redirigir: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/agenda-datos", () => ({ listarVisitasSemana: mocks.agenda }));
vi.mock("@/lib/reserva-visita-datos", () => ({ listarCandidatasVisita: mocks.familias }));
vi.mock("../../actions", () => ({ agendarVisita: mocks.guardar }));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirigir,
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("./formulario-reserva", () => ({
  FormularioReserva: () => <button>Reservar para esta familia</button>,
}));
const consulta = {
  id: "familia",
  nombre: "Familia ficticia",
  telefono: "000000",
  actualizado_en: "2026-01-01T12:00:00.123456Z",
  estado: "nuevo",
};
const parametros = { fecha: "2099-01-01", franja: "manana", buscar: "Ana", pagina: "2" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.agenda.mockResolvedValue([]);
  mocks.familias.mockResolvedValue({ consultas: [consulta], total: 51, pagina: 2 });
  mocks.guardar.mockResolvedValue({ ok: true, error: null });
  mocks.redirigir.mockImplementation(() => {
    throw new Error("REDIRECT");
  });
});
it.each([
  () => ReservarPage({ searchParams: Promise.resolve(parametros) }),
  () =>
    reservarVisita(
      parametros.fecha,
      parametros.franja,
      { ok: false, error: null },
      new FormData(),
    ),
])("exige sesión antes de consultar o reservar", async accion => {
  mocks.sesion.mockRejectedValue(new Error("LOGIN"));
  await expect(accion()).rejects.toThrow("LOGIN");
  expect(mocks.agenda).not.toHaveBeenCalled();
  expect(mocks.guardar).not.toHaveBeenCalled();
});
it("mantiene turno y búsqueda al paginar candidatas", async () => {
  const html = renderToStaticMarkup(
    await ReservarPage({ searchParams: Promise.resolve(parametros) }),
  );
  expect(mocks.familias).toHaveBeenCalledWith("Ana", "2");
  expect(html).toContain("Familia ficticia");
  expect(html).toContain(
    "fecha=2099-01-01&amp;franja=manana&amp;buscar=Ana&amp;pagina=1",
  );
});
it("si otro operador ocupó el turno no ofrece reservarlo", async () => {
  mocks.agenda.mockResolvedValue([
    { id: "otra", visita_fecha: parametros.fecha, visita_franja: parametros.franja },
  ]);
  const html = renderToStaticMarkup(
    await ReservarPage({ searchParams: Promise.resolve(parametros) }),
  );
  expect(html).toContain("El turno ya está ocupado");
  expect(mocks.familias).not.toHaveBeenCalled();
});
it("no muestra un error de disponibilidad como turno libre", async () => {
  mocks.agenda.mockRejectedValue(new Error("No se pudo cargar"));
  await expect(
    ReservarPage({ searchParams: Promise.resolve(parametros) }),
  ).rejects.toThrow();
  expect(mocks.familias).not.toHaveBeenCalled();
});
it("envía el turno elegido y conserva la versión antes de abrir la consulta", async () => {
  const datos = new FormData();
  datos.set("id", consulta.id);
  datos.set("actualizado_en", consulta.actualizado_en);
  datos.set("visita_fecha", "2000-01-01");
  await expect(
    reservarVisita(
      parametros.fecha,
      parametros.franja,
      { ok: false, error: null },
      datos,
    ),
  ).rejects.toThrow("REDIRECT");
  expect(datos.get("visita_fecha")).toBe(parametros.fecha);
  expect(datos.get("actualizado_en")).toBe(consulta.actualizado_en);
  expect(mocks.guardar).toHaveBeenCalledTimes(1);
  expect(mocks.redirigir).toHaveBeenCalledWith(
    expect.stringContaining("/admision/familia?semana="),
  );
});
it("conserva el error de turno ocupado sin confirmar ni reintentar", async () => {
  mocks.guardar.mockResolvedValue({ ok: false, error: "Ese turno ya está ocupado." });
  expect(
    await reservarVisita(
      parametros.fecha,
      parametros.franja,
      { ok: false, error: null },
      new FormData(),
    ),
  ).toEqual({ ok: false, error: "Ese turno ya está ocupado." });
  expect(mocks.redirigir).not.toHaveBeenCalled();
  expect(mocks.guardar).toHaveBeenCalledTimes(1);
});
