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
  } = await searchParams;
  const mostrarBajas = estado === "bajas";
  let residentesActivos: ResidenteActivo[] = [];
  let residentesDadosDeBaja: ResidenteDadoDeBaja[] = [];
  let errorCarga = false;
  let cantidad = 0;
  let pagina = 1;

  try {
    cantidad = await contarEstadias(mostrarBajas);
    pagina = paginaListado(paginaParam, cantidad);
    if (mostrarBajas) {
      residentesDadosDeBaja = await listarResidentesDadosDeBaja(pagina);
    } else {
      residentesActivos = await listarResidentesActivos(pagina);
    }
  } catch (error) {
    errorCarga = true;
    console.error(error);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Residentes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ingresos vigentes e historial de estadías finalizadas.
          </p>
        </div>
        <SoloGestion>
          <Link
            href="/residentes/nuevo"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo ingreso
          </Link>
        </SoloGestion>
      </div>

      {creado === "1" && (
        <MensajeExito
          titulo="Ingreso registrado"
          descripcion="El residente ya aparece en el listado de activos."
        />
      )}
      {actualizado === "1" && (
        <MensajeExito
          titulo="Cambios guardados"
          descripcion="La ficha del residente y su ingreso activo fueron actualizados."
        />
      )}
      {baja === "1" && (
        <MensajeExito
          titulo="Baja registrada"
          descripcion="El ingreso finalizado quedó guardado en el historial."
        />
      )}
      {reingreso === "1" && (
        <MensajeExito
          titulo="Reingreso registrado"
          descripcion="La nueva estadía ya aparece en el listado de residentes activos."
        />
      )}

      <nav
        aria-label="Estado de los residentes"
        className="mt-6 flex gap-2 border-b border-slate-200"
      >
        <Link
          href="/residentes"
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:rounded-t focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
            !mostrarBajas
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Activos
        </Link>
        <Link
          href="/residentes?estado=bajas"
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:rounded-t focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
            mostrarBajas
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Bajas
        </Link>
      </nav>

      <div className="mt-6 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-800">
          {mostrarBajas ? "Historial de bajas" : "Residentes activos"}
        </h2>
        {!errorCarga && (
          <Badge
            className={
              mostrarBajas
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }
          >
            {cantidad} {cantidad === 1 ? "registro" : "registros"}
          </Badge>
        )}
      </div>

      {errorCarga ? (
        <ErrorCarga />
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
          anterior={enlaceResidentes(pagina - 1, mostrarBajas)}
          siguiente={enlaceResidentes(pagina + 1, mostrarBajas)}
          etiqueta={mostrarBajas ? "estadías finalizadas" : "residentes"}
        />
      )}
    </div>
  );
}

function MensajeExito({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <Card className="mt-6 flex items-start gap-3.5 border-emerald-200/80 bg-emerald-50/80 p-4.5 shadow-2xs">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-emerald-900">{titulo}</h2>
        <p className="mt-0.5 text-xs text-emerald-700 leading-relaxed">{descripcion}</p>
      </div>
    </Card>
  );
}

function ErrorCarga() {
  return (
    <Card className="mt-4 flex items-start gap-3.5 border-red-200/80 bg-red-50/80 p-5 shadow-2xs">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
        <TriangleAlert className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-red-900">
          No pudimos cargar los residentes
        </h2>
        <p className="mt-0.5 text-xs text-red-700 leading-relaxed">
          Intentá nuevamente. Si el problema continúa, contactá al equipo para que lo
          revise.
        </p>
      </div>
    </Card>
  );
}

function EstadoVacioActivos() {
  return (
    <Card className="mt-4 flex min-h-56 flex-col items-center justify-center p-8 text-center shadow-2xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100/80 text-slate-500 shadow-2xs">
        <UsersRound className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-base font-bold text-slate-800">
        Todavía no hay residentes activos
      </h2>
      <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
        Cuando registremos un ingreso, la persona aparecerá en este listado.
      </p>
    </Card>
  );
}

function EstadoVacioBajas() {
  return (
    <Card className="mt-4 flex min-h-56 flex-col items-center justify-center p-8 text-center shadow-2xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100/80 text-slate-500 shadow-2xs">
        <History className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-base font-bold text-slate-800">
        Todavía no hay bajas registradas
      </h2>
      <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
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
        className="block divide-y divide-slate-100 md:hidden"
        aria-label="Listado de residentes activos"
      >
        {residentes.map(({ admissionId, admittedAt, room, resident }) => {
          const nombreCompleto = `${resident.first_name} ${resident.last_name}`;

          return (
            <li key={admissionId} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar nombre={nombreCompleto} colorClass="bg-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/residentes/ficha/${resident.id}`}
                      className="block truncate font-semibold text-sky-800 underline underline-offset-2 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                    >
                      {nombreCompleto}
                    </Link>
                    <div className="text-xs text-slate-500">DNI {resident.dni}</div>
                  </div>
                </div>
                <Habitacion room={room} />
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
                <div>
                  <span className="block text-slate-400">Nacimiento</span>
                  <span className="font-medium text-slate-700">
                    {formatearFecha(resident.birth_date)}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Ingreso</span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                    {formatearFecha(admittedAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 pt-2">
                <SoloGestion>
                  <Link
                    href={`/residentes/${admissionId}/editar`}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Link>
                </SoloGestion>
                <SoloGestion>
                  <Link
                    href={`/residentes/${admissionId}/baja`}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
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
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
          <tbody className="divide-y divide-slate-100">
            {residentes.map(({ admissionId, admittedAt, room, resident }) => {
              const nombreCompleto = `${resident.first_name} ${resident.last_name}`;

              return (
                <tr key={admissionId} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={nombreCompleto} colorClass="bg-emerald-600" />
                      <div>
                        <Link
                          href={`/residentes/ficha/${resident.id}`}
                          className="font-semibold text-sky-800 underline underline-offset-2 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                        >
                          {nombreCompleto}
                        </Link>
                        <div className="mt-0.5 text-xs text-slate-500">
                          DNI {resident.dni}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {formatearFecha(resident.birth_date)}
                  </td>
                  <td className="px-5 py-4">
                    <Habitacion room={room} />
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      {formatearFecha(admittedAt)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <SoloGestion>
                        <Link
                          href={`/residentes/${admissionId}/editar`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Link>
                      </SoloGestion>
                      <SoloGestion>
                        <Link
                          href={`/residentes/${admissionId}/baja`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
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
        className="block divide-y divide-slate-100 md:hidden"
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
                        className="block truncate font-semibold text-sky-800 underline underline-offset-2 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                      >
                        {nombreCompleto}
                      </Link>
                      <div className="text-xs text-slate-500">DNI {resident.dni}</div>
                    </div>
                  </div>
                  <Habitacion room={room} />
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
                  <div>
                    <span className="block text-slate-400">Ingreso</span>
                    <span className="font-medium text-slate-700">
                      {formatearFecha(admittedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Baja</span>
                    <span className="font-medium text-slate-700">
                      {formatearFecha(dischargedAt)}
                    </span>
                  </div>
                </div>

                {dischargeReason && (
                  <div className="text-xs text-slate-600">
                    <span className="block text-slate-400">Motivo:</span>
                    <p className="mt-0.5 whitespace-normal break-words">
                      {dischargeReason}
                    </p>
                  </div>
                )}

                {canBeReadmitted && (
                  <div className="border-t border-slate-100 pt-2">
                    <SoloGestion>
                      <Link
                        href={`/residentes/reingreso/${resident.id}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
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
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
          <tbody className="divide-y divide-slate-100">
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
                  <tr key={admissionId} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar nombre={nombreCompleto} />
                        <div>
                          <Link
                            href={`/residentes/ficha/${resident.id}`}
                            className="font-semibold text-sky-800 underline underline-offset-2 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                          >
                            {nombreCompleto}
                          </Link>
                          <div className="mt-0.5 text-xs text-slate-500">
                            DNI {resident.dni}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Habitacion room={room} />
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatearFecha(admittedAt)}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700">
                      {formatearFecha(dischargedAt)}
                    </td>
                    <td className="max-w-sm whitespace-normal px-5 py-4 text-slate-600">
                      {dischargeReason || "Sin motivo registrado"}
                    </td>
                    <td className="px-5 py-4">
                      {canBeReadmitted ? (
                        <SoloGestion>
                          <Link
                            href={`/residentes/reingreso/${resident.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Reingresar
                          </Link>
                        </SoloGestion>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
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
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }
    >
      <BedDouble className="h-3.5 w-3.5" />
      {room || "Sin asignar"}
    </Badge>
  );
}
