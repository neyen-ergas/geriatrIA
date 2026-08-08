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
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import { Avatar, Badge, Card } from "@/components/ui";
import {
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
  }>;
}) {
  const { actualizado, baja, creado, estado } = await searchParams;
  const mostrarBajas = estado === "bajas";
  let residentesActivos: ResidenteActivo[] = [];
  let residentesDadosDeBaja: ResidenteDadoDeBaja[] = [];
  let errorCarga = false;

  try {
    if (mostrarBajas) {
      residentesDadosDeBaja = await listarResidentesDadosDeBaja();
    } else {
      residentesActivos = await listarResidentesActivos();
    }
  } catch (error) {
    errorCarga = true;
    console.error(error);
  }

  const cantidad = mostrarBajas
    ? residentesDadosDeBaja.length
    : residentesActivos.length;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Residentes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ingresos vigentes e historial de estadías finalizadas.
          </p>
        </div>
        <Link
          href="/residentes/nuevo"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Nuevo ingreso
        </Link>
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

      <nav
        aria-label="Estado de los residentes"
        className="mt-6 flex gap-2 border-b border-slate-200"
      >
        <Link
          href="/residentes"
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            !mostrarBajas
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Activos
        </Link>
        <Link
          href="/residentes?estado=bajas"
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
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
    </div>
  );
}

function MensajeExito({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: string;
}) {
  return (
    <Card className="mt-6 flex items-start gap-3 border-emerald-200 bg-emerald-50 p-4">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      <div>
        <h2 className="text-sm font-semibold text-emerald-900">{titulo}</h2>
        <p className="mt-1 text-sm text-emerald-700">{descripcion}</p>
      </div>
    </Card>
  );
}

function ErrorCarga() {
  return (
    <Card className="mt-4 flex items-start gap-3 border-red-200 bg-red-50 p-5">
      <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <div>
        <h2 className="text-sm font-semibold text-red-900">
          No pudimos cargar los residentes
        </h2>
        <p className="mt-1 text-sm text-red-700">
          Intentá nuevamente. Si el problema continúa, contactá al equipo para
          que lo revise.
        </p>
      </div>
    </Card>
  );
}

function EstadoVacioActivos() {
  return (
    <Card className="mt-4 flex min-h-52 flex-col items-center justify-center p-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
        <UsersRound className="h-5 w-5 text-slate-500" />
      </div>
      <h2 className="mt-4 text-sm font-semibold text-slate-800">
        Todavía no hay residentes activos
      </h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Cuando registremos un ingreso, la persona aparecerá en este listado.
      </p>
    </Card>
  );
}

function EstadoVacioBajas() {
  return (
    <Card className="mt-4 flex min-h-52 flex-col items-center justify-center p-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
        <History className="h-5 w-5 text-slate-500" />
      </div>
      <h2 className="mt-4 text-sm font-semibold text-slate-800">
        Todavía no hay bajas registradas
      </h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Los ingresos finalizados aparecerán acá sin perder su historial.
      </p>
    </Card>
  );
}

function TablaActivos({ residentes }: { residentes: ResidenteActivo[] }) {
  return (
    <Card className="mt-4 overflow-hidden">
      <div className="overflow-x-auto">
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
                      <Avatar
                        nombre={nombreCompleto}
                        colorClass="bg-emerald-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">
                          {nombreCompleto}
                        </div>
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
                      <Link
                        href={`/residentes/${admissionId}/editar`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Link>
                      <Link
                        href={`/residentes/${admissionId}/baja`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                      >
                        <LogOut className="h-4 w-4" />
                        Dar de baja
                      </Link>
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {residentes.map(
              ({
                admissionId,
                admittedAt,
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
                          <div className="font-semibold text-slate-900">
                            {nombreCompleto}
                          </div>
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
