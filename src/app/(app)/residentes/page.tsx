import type { Metadata } from "next";
import Link from "next/link";
import {
  BedDouble,
  CalendarDays,
  CheckCircle2,
  History,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import { requerirSesion } from "@/lib/auth";
import { SoloGestion } from "@/components/permisos";
import { Avatar, Badge, Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { paginaListado } from "@/lib/paginacion";
import { enlaceResidentes } from "@/lib/paginacion-residentes";
import { busquedaPersonas } from "@/lib/busqueda-personas";
import {
  contarEstadias,
  listarResidentesActivos,
  listarResidentesDadosDeBaja,
  type ResidenteActivo,
  type ResidenteDadoDeBaja,
} from "@/lib/residentes-datos";

export const metadata: Metadata = {
  title: "Residentes · geriatrIA",
};

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function formatearFecha(fecha: string): string {
  return formatoFecha.format(new Date(`${fecha}T00:00:00Z`));
}

export default async function ResidentesPage({
  searchParams,
}: {
  searchParams: Promise<{
    actualizado?: string;
    baja?: string;
    creado?: string;
    estado?: string;
    reingreso?: string;
    pagina?: string | string[];
    buscar?: string | string[];
  }>;
}) {
  await requerirSesion("operational.read");
  const {
    actualizado,
    baja,
    creado,
    estado,
    reingreso,
    pagina: paginaParam,
    buscar,
  } = await searchParams;
  const mostrarBajas = estado === "bajas";
  const busqueda = busquedaPersonas(buscar);
  let residentesActivos: ResidenteActivo[] = [];
  let residentesDadosDeBaja: ResidenteDadoDeBaja[] = [];
  let errorCarga = false;
  let cantidad = 0;
  let pagina = 1;

  try {
    cantidad = await contarEstadias(mostrarBajas, busqueda);
    pagina = paginaListado(paginaParam, cantidad);
    if (mostrarBajas) {
      residentesDadosDeBaja = await listarResidentesDadosDeBaja(pagina, busqueda);
    } else {
      residentesActivos = await listarResidentesActivos(pagina, busqueda);
    }
  } catch (error) {
    errorCarga = true;
    console.error(error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-piedra-950">Residentes</h1>
          <p className="mt-1 text-base text-piedra-700">
            Ingresos vigentes e historial de estadías finalizadas.
          </p>
        </div>
        <SoloGestion>
          <Link
            href="/residentes/nuevo"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-casona-700 px-4 text-sm font-bold text-white transition-colors hover:bg-casona-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-piedra-900 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4 text-casona-400" />
            Nuevo ingreso
          </Link>
        </SoloGestion>
      </div>

      {creado && (
        <MensajeExito
          titulo="Ingreso registrado correctamente"
          descripcion="La persona ya cuenta con su estadía activa y ficha clínica disponible."
        />
      )}
      {actualizado && (
        <MensajeExito
          titulo="Estadía actualizada"
          descripcion="Los cambios en las condiciones del ingreso quedaron guardados."
        />
      )}
      {baja && (
        <MensajeExito
          titulo="Baja registrada"
          descripcion="La estadía finalizó. El historial permanece disponible para consulta."
        />
      )}
      {reingreso && (
        <MensajeExito
          titulo="Reingreso confirmado"
          descripcion="La persona vuelve a figurar con estadía activa."
        />
      )}

      {/* Navegación segmentada tipo control de píldora */}
      <div>
        <nav
          aria-label="Estado de los residentes"
          className="inline-flex rounded-md bg-piedra-200/70 p-1 text-sm font-semibold shadow-inner"
        >
          <Link
            href={enlaceResidentes(1, false, busqueda)}
            aria-current={!mostrarBajas ? "page" : undefined}
            className={`rounded-md px-4 py-2 transition-colors ${
              !mostrarBajas
                ? "bg-white text-piedra-900 font-bold"
                : "text-piedra-600 hover:text-piedra-900"
            }`}
          >
            Activos
          </Link>
          <Link
            href={enlaceResidentes(1, true, busqueda)}
            aria-current={mostrarBajas ? "page" : undefined}
            className={`rounded-md px-4 py-2 transition-colors ${
              mostrarBajas
                ? "bg-white text-piedra-900 font-bold"
                : "text-piedra-600 hover:text-piedra-900"
            }`}
          >
            Bajas
          </Link>
        </nav>
      </div>

      <form
        action="/residentes"
        className="flex flex-wrap items-end gap-2 rounded-md border border-piedra-200 bg-white p-3"
      >
        {mostrarBajas && <input type="hidden" name="estado" value="bajas" />}
        <label className="flex-1 text-sm font-semibold text-piedra-700">
          Buscar residente por nombre, apellido o DNI
          <input
            name="buscar"
            maxLength={80}
            defaultValue={busqueda}
            placeholder="Ej.: Lucero o 7803903"
            className="mt-1 block h-10 w-full min-w-0 rounded-md border border-piedra-300 px-3 text-sm"
          />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-casona-700 px-4 text-sm font-semibold text-white"
        >
          Buscar
        </button>
        {busqueda && (
          <Link
            href={enlaceResidentes(1, mostrarBajas)}
            className="px-2 py-2 text-sm font-semibold text-casona-800 underline"
          >
            Limpiar
          </Link>
        )}
      </form>

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-piedra-800">
          {mostrarBajas ? "Historial de bajas" : "Residentes activos"}
        </h2>
        {!errorCarga && (
          <Badge
            className={
              mostrarBajas
                ? "border-piedra-200 bg-piedra-50 text-piedra-600"
                : "border-casona-200 bg-casona-50 text-casona-700"
            }
          >
            {cantidad} {cantidad === 1 ? "registro" : "registros"}
          </Badge>
        )}
      </div>

      {errorCarga ? (
        <ErrorCarga />
      ) : busqueda && cantidad === 0 ? (
        <Card className="p-8 text-center text-sm text-piedra-600">
          No encontramos residentes para “{busqueda}”. Probá con otro nombre o DNI.
        </Card>
      ) : mostrarBajas ? (
        residentesDadosDeBaja.length === 0 ? (
          <EstadoVacioBajas />
        ) : (
          <TablaBajas residentes={residentesDadosDeBaja} />
        )
      ) : residentesActivos.length === 0 ? (
        <EstadoVacioActivos />
      ) : (
        <TablaActivos residentes={residentesActivos} />
      )}
      {!errorCarga && (
        <PaginacionListado
          pagina={pagina}
          total={cantidad}
          anterior={enlaceResidentes(pagina - 1, mostrarBajas, busqueda)}
          siguiente={enlaceResidentes(pagina + 1, mostrarBajas, busqueda)}
          etiqueta={mostrarBajas ? "estadías finalizadas" : "residentes"}
        />
      )}
    </div>
  );
}

function MensajeExito({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <Card className="mt-6 flex items-start gap-3.5 border-casona-200/80 bg-casona-50/80 p-4.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-casona-100 text-casona-700">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-casona-900">{titulo}</h2>
        <p className="mt-0.5 text-sm text-casona-700 leading-relaxed">{descripcion}</p>
      </div>
    </Card>
  );
}

function ErrorCarga() {
  return (
    <Card className="mt-4 flex items-start gap-3.5 border-oxido-200/80 bg-oxido-50/80 p-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-oxido-100 text-oxido-600">
        <TriangleAlert className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-oxido-900">
          No pudimos cargar los residentes
        </h2>
        <p className="mt-0.5 text-sm text-oxido-700 leading-relaxed">
          Intentá nuevamente. Si el problema continúa, contactá al equipo para que lo
          revise.
        </p>
      </div>
    </Card>
  );
}

function EstadoVacioActivos() {
  return (
    <Card className="mt-4 flex min-h-56 flex-col items-center justify-center p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-piedra-100/80 text-piedra-500">
        <UsersRound className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-base font-bold text-piedra-800">
        Todavía no hay residentes activos
      </h2>
      <p className="mt-1 max-w-sm text-sm text-piedra-500 leading-relaxed">
        Cuando registremos un ingreso, la persona aparecerá en este listado.
      </p>
    </Card>
  );
}

function EstadoVacioBajas() {
  return (
    <Card className="mt-4 flex min-h-56 flex-col items-center justify-center p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-piedra-100/80 text-piedra-500">
        <History className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-base font-bold text-piedra-800">
        Todavía no hay bajas registradas
      </h2>
      <p className="mt-1 max-w-sm text-sm text-piedra-500 leading-relaxed">
        Los ingresos finalizados aparecerán acá sin perder su historial.
      </p>
    </Card>
  );
}

function TablaActivos({ residentes }: { residentes: ResidenteActivo[] }) {
  return (
    <Card className="mt-4 overflow-hidden">
      {/* Vista móvil tipo tarjeta para pantallas chicas (< md) */}
      <ul
        className="block divide-y divide-piedra-100 md:hidden"
        aria-label="Listado de residentes activos"
      >
        {residentes.map(({ admissionId, admittedAt, room, resident }) => {
          const nombreCompleto = `${resident.first_name} ${resident.last_name}`;

          return (
            <li key={admissionId} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar nombre={nombreCompleto} colorClass="bg-casona-600" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/residentes/ficha/${resident.id}`}
                      className="block truncate font-semibold text-cobalto-800 underline underline-offset-2 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-piedra-900"
                    >
                      {nombreCompleto}
                    </Link>
                    <div className="text-sm text-piedra-500">DNI {resident.dni}</div>
                  </div>
                </div>
                <Habitacion room={room} />
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-md bg-piedra-50 p-2.5 text-sm text-piedra-600">
                <div>
                  <span className="block text-piedra-500">Nacimiento</span>
                  <span className="font-medium text-piedra-700">
                    {formatearFecha(resident.birth_date)}
                  </span>
                </div>
                <div>
                  <span className="block text-piedra-500">Ingreso</span>
                  <span className="inline-flex items-center gap-1 font-medium text-piedra-700">
                    <CalendarDays className="h-3.5 w-3.5 text-piedra-500" />
                    {formatearFecha(admittedAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-piedra-100 pt-2">
                <SoloGestion>
                  <Link
                    href={`/residentes/${admissionId}/editar`}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-piedra-600 transition-colors hover:bg-piedra-100 hover:text-piedra-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-piedra-900"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Link>
                </SoloGestion>
                <SoloGestion>
                  <Link
                    href={`/residentes/${admissionId}/baja`}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-oxido-600 transition-colors hover:bg-oxido-50 hover:text-oxido-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxido-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Dar de baja
                  </Link>
                </SoloGestion>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Vista de tabla tradicional para pantallas medianas y grandes (>= md) */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[940px] text-left text-sm">
          <caption className="sr-only">Listado de residentes activos</caption>
          <thead className="border-b border-piedra-200 bg-piedra-50 text-sm text-piedra-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">
                Residente
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Nacimiento
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Habitación
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Ingreso
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-piedra-100">
            {residentes.map(({ admissionId, admittedAt, room, resident }) => {
              const nombreCompleto = `${resident.first_name} ${resident.last_name}`;

              return (
                <tr key={admissionId} className="hover:bg-piedra-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={nombreCompleto} colorClass="bg-casona-600" />
                      <div>
                        <Link
                          href={`/residentes/ficha/${resident.id}`}
                          className="font-semibold text-cobalto-800 underline underline-offset-2 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-piedra-900"
                        >
                          {nombreCompleto}
                        </Link>
                        <div className="mt-0.5 text-sm text-piedra-500">
                          DNI {resident.dni}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-piedra-600">
                    {formatearFecha(resident.birth_date)}
                  </td>
                  <td className="px-5 py-4">
                    <Habitacion room={room} />
                  </td>
                  <td className="px-5 py-4 text-piedra-600">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-piedra-500" />
                      {formatearFecha(admittedAt)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <SoloGestion>
                        <Link
                          href={`/residentes/${admissionId}/editar`}
                          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-piedra-600 transition-colors hover:bg-piedra-100 hover:text-piedra-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-piedra-900"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Link>
                      </SoloGestion>
                      <SoloGestion>
                        <Link
                          href={`/residentes/${admissionId}/baja`}
                          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-oxido-600 transition-colors hover:bg-oxido-50 hover:text-oxido-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxido-600"
                        >
                          <LogOut className="h-4 w-4" />
                          Dar de baja
                        </Link>
                      </SoloGestion>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TablaBajas({ residentes }: { residentes: ResidenteDadoDeBaja[] }) {
  return (
    <Card className="mt-4 overflow-hidden">
      {/* Vista móvil tipo tarjeta para pantallas chicas (< md) */}
      <ul
        className="block divide-y divide-piedra-100 md:hidden"
        aria-label="Historial de bajas de residentes"
      >
        {residentes.map(
          ({
            admissionId,
            admittedAt,
            canBeReadmitted,
            dischargedAt,
            dischargeReason,
            room,
            resident,
          }) => {
            const nombreCompleto = `${resident.first_name} ${resident.last_name}`;

            return (
              <li key={admissionId} className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar nombre={nombreCompleto} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/residentes/ficha/${resident.id}`}
                        className="block truncate font-semibold text-cobalto-800 underline underline-offset-2 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-piedra-900"
                      >
                        {nombreCompleto}
                      </Link>
                      <div className="text-sm text-piedra-500">DNI {resident.dni}</div>
                    </div>
                  </div>
                  <Habitacion room={room} />
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-md bg-piedra-50 p-2.5 text-sm text-piedra-600">
                  <div>
                    <span className="block text-piedra-500">Ingreso</span>
                    <span className="font-medium text-piedra-700">
                      {formatearFecha(admittedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-piedra-500">Baja</span>
                    <span className="font-medium text-piedra-700">
                      {formatearFecha(dischargedAt)}
                    </span>
                  </div>
                </div>

                {dischargeReason && (
                  <div className="text-sm text-piedra-600">
                    <span className="block text-piedra-500">Motivo:</span>
                    <p className="mt-0.5 whitespace-normal break-words">
                      {dischargeReason}
                    </p>
                  </div>
                )}

                {canBeReadmitted && (
                  <div className="border-t border-piedra-100 pt-2">
                    <SoloGestion>
                      <Link
                        href={`/residentes/reingreso/${resident.id}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-casona-700 transition-colors hover:bg-casona-50 hover:text-casona-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-casona-700"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reingresar
                      </Link>
                    </SoloGestion>
                  </div>
                )}
              </li>
            );
          },
        )}
      </ul>

      {/* Vista de tabla tradicional para pantallas medianas y grandes (>= md) */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <caption className="sr-only">Historial de bajas de residentes</caption>
          <thead className="border-b border-piedra-200 bg-piedra-50 text-sm text-piedra-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">
                Residente
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Habitación
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Ingreso
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Baja
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Motivo
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-piedra-100">
            {residentes.map(
              ({
                admissionId,
                admittedAt,
                canBeReadmitted,
                dischargedAt,
                dischargeReason,
                room,
                resident,
              }) => {
                const nombreCompleto = `${resident.first_name} ${resident.last_name}`;

                return (
                  <tr key={admissionId} className="hover:bg-piedra-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar nombre={nombreCompleto} />
                        <div>
                          <Link
                            href={`/residentes/ficha/${resident.id}`}
                            className="font-semibold text-cobalto-800 underline underline-offset-2 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-piedra-900"
                          >
                            {nombreCompleto}
                          </Link>
                          <div className="mt-0.5 text-sm text-piedra-500">
                            DNI {resident.dni}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Habitacion room={room} />
                    </td>
                    <td className="px-5 py-4 text-piedra-600">
                      {formatearFecha(admittedAt)}
                    </td>
                    <td className="px-5 py-4 font-medium text-piedra-700">
                      {formatearFecha(dischargedAt)}
                    </td>
                    <td className="max-w-sm whitespace-normal px-5 py-4 text-piedra-600">
                      {dischargeReason || "Sin motivo registrado"}
                    </td>
                    <td className="px-5 py-4">
                      {canBeReadmitted ? (
                        <SoloGestion>
                          <Link
                            href={`/residentes/reingreso/${resident.id}`}
                            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-casona-700 transition-colors hover:bg-casona-50 hover:text-casona-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-casona-700"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Reingresar
                          </Link>
                        </SoloGestion>
                      ) : (
                        <span className="text-sm text-piedra-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Habitacion({ room }: { room: string | null }) {
  return (
    <Badge
      className={
        room
          ? "border-cobalto-200 bg-cobalto-50 text-cobalto-700"
          : "border-ocre-200 bg-ocre-50 text-ocre-700"
      }
    >
      <BedDouble className="h-3.5 w-3.5" />
      {room || "Sin asignar"}
    </Badge>
  );
}
