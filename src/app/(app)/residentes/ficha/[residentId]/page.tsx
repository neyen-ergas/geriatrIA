import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { obtenerFichaResidente } from "@/lib/ficha-residente-datos";
import { enlaceFichaResidente } from "@/lib/ficha-residente";
import { formatearFechaPago, formatearImporte } from "@/lib/pagos";
import {
  CONFIG_REGISTRO,
  SECCIONES_REGISTRO,
  rutaRegistros,
} from "@/lib/registros-residente";

export const metadata = { title: "Ficha del residente · geriatrIA" };
const enlace =
  "inline-flex items-center text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-900 hover:underline underline-offset-4";

export default async function FichaResidentePage({
  params,
  searchParams,
}: {
  params: Promise<{ residentId: string }>;
  searchParams: Promise<{
    estadias?: string | string[];
    contactos?: string | string[];
    contacto?: string;
  }>;
}): Promise<React.ReactElement> {
  const rol = await requerirSesion("operational.read");
  const { residentId } = await params;
  const paginas = await searchParams;
  const ficha = await obtenerFichaResidente(
    residentId,
    paginas.estadias,
    paginas.contactos,
  );
  if (!ficha) notFound();
  const { residente, ingresoActivoId, estadias, contactos } = ficha;
  const puedeGestionar = tienePermiso(rol, "operational.write");
  const ruta = (estadia: number, contacto: number) =>
    enlaceFichaResidente(residente.id, estadia, contacto);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/residentes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-800"
        >
          <span>←</span> Volver a Residentes
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-lg font-bold text-white shadow-sm ring-4 ring-emerald-50">
              {residente.first_name[0]}
              {residente.last_name[0]}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Ficha del residente
              </p>
              <h1 className="mt-0.5 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {residente.first_name} {residente.last_name}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    ingresoActivoId
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  }
                >
                  <span
                    className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${ingresoActivoId ? "bg-emerald-500" : "bg-slate-400"}`}
                  />
                  {ingresoActivoId ? "Con estadía activa" : "Sin estadía activa"}
                </Badge>
                {residente.dni && (
                  <span className="text-xs text-slate-500 font-medium">
                    DNI: {residente.dni}
                  </span>
                )}
              </div>
            </div>
          </div>

          {puedeGestionar && (
            <div className="flex flex-wrap items-center gap-2 sm:self-center">
              {ingresoActivoId ? (
                <>
                  <Link
                    href={`/residentes/${ingresoActivoId}/editar`}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  >
                    Editar ingreso activo
                  </Link>
                  <Link
                    href={`/residentes/${ingresoActivoId}/baja`}
                    className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                  >
                    Registrar baja
                  </Link>
                </>
              ) : (
                estadias.total > 0 && (
                  <Link
                    href={`/residentes/reingreso/${residente.id}`}
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                  >
                    Registrar reingreso
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Apartados clínicos y operativos
          </h2>
        </div>
        <nav
          aria-label="Apartados de la ficha"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SECCIONES_REGISTRO.map(seccion => (
            <Link
              key={seccion}
              href={rutaRegistros(residente.id, seccion)}
              className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/20 hover:shadow-md"
            >
              <span className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-emerald-800">
                {CONFIG_REGISTRO[seccion].titulo}
              </span>
              <span className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600">
                →
              </span>
            </Link>
          ))}
        </nav>
      </section>

      {/* Datos Personales */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Datos personales</h2>
          <span className="text-xs text-slate-400">Identificación general</span>
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Dato titulo="DNI" valor={residente.dni} />
          <Dato titulo="Nacimiento" valor={formatearFechaPago(residente.birth_date)} />
          <Dato titulo="Teléfono" valor={residente.phone} />
          <Dato titulo="Domicilio" valor={residente.address} />
          <div className="sm:col-span-2 lg:col-span-2">
            <Dato titulo="Observaciones" valor={residente.notes} />
          </div>
        </dl>
      </Card>

      {/* Familiares y Contactos */}
      <section aria-labelledby="familiares" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="familiares" className="text-base font-bold text-slate-900">
              Familiares y contactos
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Contactos actuales de la persona, compartidos entre sus estadías.
            </p>
          </div>
          {puedeGestionar && (
            <Link
              href={`/residentes/ficha/${residente.id}/familiares/nuevo`}
              className="inline-flex items-center gap-1.5 self-start rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              + Agregar contacto
            </Link>
          )}
        </div>

        {paginas.contacto === "1" && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-sm font-medium text-emerald-800"
          >
            Contacto guardado.
          </div>
        )}

        {!contactos.total ? (
          <Card className="p-8 text-center text-sm text-slate-500">
            No hay contactos registrados.
          </Card>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {contactos.filas.map(contacto => (
              <li key={contacto.id}>
                <Card className="flex h-full flex-col justify-between p-5 transition-shadow hover:shadow-md">
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="break-words font-bold text-slate-900">
                          {contacto.first_name} {contacto.last_name}
                        </h3>
                        <span className="text-xs font-medium text-emerald-700">
                          {contacto.relationship || "Familiar"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {contacto.is_emergency_contact && (
                          <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                            Emergencia
                          </Badge>
                        )}
                        {contacto.is_payment_responsible && (
                          <Badge className="border-sky-200 bg-sky-50 text-sky-700">
                            Resp. de pago
                          </Badge>
                        )}
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Dato titulo="Parentesco" valor={contacto.relationship} />
                      <Dato titulo="Teléfono" valor={contacto.phone} />
                      <Dato
                        titulo="Contacto de emergencia"
                        valor={contacto.is_emergency_contact ? "Sí" : "No"}
                      />
                      <Dato
                        titulo="Responsable de pago"
                        valor={contacto.is_payment_responsible ? "Sí" : "No"}
                      />
                      <div className="sm:col-span-2">
                        <Dato titulo="Observaciones" valor={contacto.notes} />
                      </div>
                    </dl>
                  </div>

                  {puedeGestionar && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <Link
                        href={`/residentes/ficha/${residente.id}/familiares/${contacto.id}/editar`}
                        className={enlace}
                      >
                        Editar contacto →
                      </Link>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
        <PaginacionListado
          pagina={contactos.pagina}
          total={contactos.total}
          etiqueta="contactos"
          anterior={`${ruta(estadias.pagina, contactos.pagina - 1)}#familiares`}
          siguiente={`${ruta(estadias.pagina, contactos.pagina + 1)}#familiares`}
        />
      </section>

      {/* Historial de Estadías */}
      <section aria-labelledby="estadias" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="estadias" className="text-base font-bold text-slate-900">
              Historial de estadías
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Registro histórico de admisiones, habitaciones asignadas y finanzas.
            </p>
          </div>
        </div>

        {!estadias.total ? (
          <Card className="p-8 text-center text-sm text-slate-500">
            No hay estadías registradas.
          </Card>
        ) : (
          <ol className="space-y-4">
            {estadias.filas.map(estadia => (
              <li key={estadia.id}>
                <Card className="p-6 transition-shadow hover:shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Ingreso del {formatearFechaPago(estadia.admitted_at)}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Habitación {estadia.room || "sin asignar"}
                      </p>
                    </div>
                    <Badge
                      className={
                        estadia.discharged_at
                          ? "border-slate-200 bg-slate-100 text-slate-600"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold"
                      }
                    >
                      {estadia.discharged_at ? "Finalizada" : "Activa"}
                    </Badge>
                  </div>

                  <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Dato titulo="Habitación" valor={estadia.room} />
                    <Dato
                      titulo="Cuota mensual acordada"
                      valor={formatearImporte(estadia.monthly_fee, estadia.currency)}
                    />
                    <Dato titulo="Día de vencimiento" valor={String(estadia.due_day)} />
                    <Dato
                      titulo="Observaciones administrativas"
                      valor={estadia.administrative_notes}
                    />
                    {estadia.discharged_at && (
                      <>
                        <Dato
                          titulo="Fecha de baja"
                          valor={formatearFechaPago(estadia.discharged_at)}
                        />
                        <Dato titulo="Motivo de baja" valor={estadia.discharge_reason} />
                      </>
                    )}
                  </dl>

                  <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
                    <Link href={`/contabilidad/${estadia.id}`} className={enlace}>
                      Ver cuotas y pagos de esta estadía →
                    </Link>
                    {puedeGestionar && (
                      <Link
                        href={`${rutaRegistros(residente.id, "pertenencias")}/nuevo?ingreso=${estadia.id}`}
                        className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                      >
                        + Agregar pertenencia a esta estadía
                      </Link>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        )}
        <PaginacionListado
          pagina={estadias.pagina}
          total={estadias.total}
          etiqueta="estadías"
          anterior={`${ruta(estadias.pagina - 1, contactos.pagina)}#estadias`}
          siguiente={`${ruta(estadias.pagina + 1, contactos.pagina)}#estadias`}
        />
      </section>
    </div>
  );
}

function Dato({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | null;
}): React.ReactElement {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50/60 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {titulo}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-slate-800">
        {valor || "Sin registrar"}
      </dd>
    </div>
  );
}
