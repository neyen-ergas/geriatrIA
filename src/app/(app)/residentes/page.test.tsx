import { renderConPermisos as renderToStaticMarkup } from "@/test/render-con-permisos";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResidentesPage from "./page";

const mocks = vi.hoisted(() => ({
  sesion: vi.fn(),
  contarEstadias: vi.fn(),
  listarResidentesActivos: vi.fn(),
  listarResidentesDadosDeBaja: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requerirSesion: mocks.sesion }));
vi.mock("@/lib/residentes-datos", () => ({
  contarEstadias: mocks.contarEstadias,
  listarResidentesActivos: mocks.listarResidentesActivos,
  listarResidentesDadosDeBaja: mocks.listarResidentesDadosDeBaja,
}));

describe("ResidentesPage - accesibilidad y adaptabilidad móvil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza activos en formato tarjeta para móviles y tabla para escritorio", async () => {
    mocks.contarEstadias.mockResolvedValue(1);
    mocks.listarResidentesActivos.mockResolvedValue([
      {
        admissionId: "adm-1",
        admittedAt: "2026-01-15",
        room: "Habitación 101",
        resident: {
          id: "res-1",
          first_name: "María",
          last_name: "González",
          dni: "12345678",
          birth_date: "1945-05-20",
        },
      },
    ]);

    const page = await ResidentesPage({
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(page);

    // Verificación de vista móvil y escritorio
    expect(html).toContain('aria-label="Listado de residentes activos"');
    expect(html).toContain("md:hidden");
    expect(html).toContain("hidden overflow-x-auto md:block");

    // Datos del residente
    expect(html).toContain("María González");
    expect(html).toContain("DNI 12345678");
    expect(html).toContain("Habitación 101");

    // Accesibilidad táctil y visual
    expect(html).toContain("min-h-[44px]");
    expect(html).toContain("focus-visible:ring-2");
  });

  it("renderiza historial de bajas con vista móvil y de escritorio", async () => {
    mocks.contarEstadias.mockResolvedValue(1);
    mocks.listarResidentesDadosDeBaja.mockResolvedValue([
      {
        admissionId: "adm-2",
        admittedAt: "2025-01-10",
        dischargedAt: "2026-02-20",
        dischargeReason: "Traslado familiar",
        canBeReadmitted: true,
        room: "Habitación 102",
        resident: {
          id: "res-2",
          first_name: "Juan",
          last_name: "Pérez",
          dni: "87654321",
          birth_date: "1940-03-12",
        },
      },
    ]);

    const page = await ResidentesPage({
      searchParams: Promise.resolve({ estado: "bajas" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('aria-label="Historial de bajas de residentes"');
    expect(html).toContain("md:hidden");
    expect(html).toContain("hidden overflow-x-auto md:block");
    expect(html).toContain("Juan Pérez");
    expect(html).toContain("Traslado familiar");
    expect(html).toContain("Reingresar");
    expect(html).toContain("min-h-[44px]");
    expect(html).toContain("focus-visible:ring-2");
  });
});
