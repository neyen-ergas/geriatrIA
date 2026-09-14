import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { PaginacionListado } from "@/components/paginacion-listado";
import { requerirSesion } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { obtenerFichaResidente } from "@/lib/ficha-residente-datos";
import { enlaceFichaResidente } from "@/lib/ficha-residente";
import { formatearFechaPago, formatearImporte } from "@/lib/pagos";
import { CONFIG_REGISTRO, SECCIONES_REGISTRO, rutaRegistros } from "@/lib/registros-residente";

export const metadata = { title: "Ficha del residente · geriatrIA" };
const enlace = "text-sm font-medium text-sky-800 underline underline-offset-2";

export default async function FichaResidentePage({ params, searchParams }: {
  params: Promise<{ residentId: string }>;
  searchParams: Promise<{
    estadias?: string | string[]; contactos?: string | string[]; contacto?: string;
  }>;
}): Promise<React.ReactElement> {
  const rol = await requerirSesion("operational.read");
  const { residentId } = await params;
  const paginas = await searchParams;
  const ficha = await obtenerFichaResidente(
    residentId, paginas.estadias, paginas.contactos,
  );
  if (!ficha) notFound();
  const { residente, ingresoActivoId, estadias, contactos } = ficha;
  const puedeGestionar = tienePermiso(rol, "operational.write");
  const ruta = (estadia: number, contacto: number) =>
    enlaceFichaResidente(residente.id, estadia, contacto);

  return <div className="space-y-6">
    <Link href="/residentes" className={enlace}>← Volver a Residentes</Link>
    <header>
      <p className="text-sm text-slate-500">Ficha del residente</p>
      <h1 className="mt-1 break-words text-2xl font-bold">
        {residente.first_name} {residente.last_name}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <Badge>{ingresoActivoId ? "Con estadía activa" : "Sin estadía activa"}</Badge>
        {puedeGestionar && (ingresoActivoId ? <>
          <Link href={`/residentes/${ingresoActivoId}/editar`} className={enlace}>
            Editar ingreso activo
          </Link>
          <Link href={`/residentes/${ingresoActivoId}/baja`} className={enlace}>
            Registrar baja
          </Link>
        </> : estadias.total > 0 && <Link
          href={`/residentes/reingreso/${residente.id}`} className={enlace}
        >Registrar reingreso</Link>)}
      </div>
    </header>

    <nav aria-label="Apartados de la ficha" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SECCIONES_REGISTRO.map(seccion => <Link key={seccion}
        href={rutaRegistros(residente.id, seccion)}
        className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-sky-800 hover:bg-slate-50">
        {CONFIG_REGISTRO[seccion].titulo}
      </Link>)}
    </nav>
    <Card className="p-5">
      <h2 className="text-lg font-semibold">Datos personales</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <Dato titulo="DNI" valor={residente.dni} />
        <Dato titulo="Nacimiento" valor={formatearFechaPago(residente.birth_date)} />
        <Dato titulo="Teléfono" valor={residente.phone} />
        <Dato titulo="Domicilio" valor={residente.address} />
        <Dato titulo="Observaciones" valor={residente.notes} />
      </dl>
    </Card>

    <section aria-labelledby="familiares">
      <h2 id="familiares" className="text-lg font-semibold">Familiares y contactos</h2>
      {paginas.contacto === "1" && <p role="status"
        className="my-3 text-sm text-emerald-700">Contacto guardado.</p>}
      {puedeGestionar && <p className="mt-2"><Link
        href={`/residentes/ficha/${residente.id}/familiares/nuevo`} className={enlace}
      >Agregar contacto</Link></p>}
      <p className="mt-1 text-sm text-slate-500">
        Contactos actuales de la persona, compartidos entre sus estadías.
      </p>
      {!contactos.total ? <Card className="mt-4 p-5">
        No hay contactos registrados.
      </Card> : <ul className="mt-4 grid gap-4 lg:grid-cols-2">
        {contactos.filas.map(contacto => <li key={contacto.id}>
          <Card className="h-full p-5">
            <h3 className="break-words font-semibold">
              {contacto.first_name} {contacto.last_name}
            </h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <Dato titulo="Parentesco" valor={contacto.relationship} />
              <Dato titulo="Teléfono" valor={contacto.phone} />
              <Dato titulo="Contacto de emergencia"
                valor={contacto.is_emergency_contact ? "Sí" : "No"} />
              <Dato titulo="Responsable de pago"
                valor={contacto.is_payment_responsible ? "Sí" : "No"} />
              <Dato titulo="Observaciones" valor={contacto.notes} />
            </dl>
            {puedeGestionar && <p className="mt-4"><Link
              href={`/residentes/ficha/${residente.id}/familiares/${contacto.id}/editar`}
              className={enlace}>Editar contacto</Link></p>}
          </Card>
        </li>)}
      </ul>}
      <PaginacionListado pagina={contactos.pagina} total={contactos.total}
        etiqueta="contactos"
        anterior={`${ruta(estadias.pagina, contactos.pagina - 1)}#familiares`}
        siguiente={`${ruta(estadias.pagina, contactos.pagina + 1)}#familiares`} />
    </section>

    <section aria-labelledby="estadias">
      <h2 id="estadias" className="text-lg font-semibold">Historial de estadías</h2>
      {!estadias.total ? <Card className="mt-4 p-5">
        No hay estadías registradas.
      </Card> : <ol className="mt-4 space-y-4">
        {estadias.filas.map(estadia => <li key={estadia.id}>
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold">
                Ingreso del {formatearFechaPago(estadia.admitted_at)}
              </h3>
              <Badge>{estadia.discharged_at ? "Finalizada" : "Activa"}</Badge>
            </div>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Dato titulo="Habitación" valor={estadia.room} />
              <Dato titulo="Cuota mensual acordada"
                valor={formatearImporte(estadia.monthly_fee, estadia.currency)} />
              <Dato titulo="Día de vencimiento" valor={String(estadia.due_day)} />
              <Dato titulo="Observaciones administrativas"
                valor={estadia.administrative_notes} />
              {estadia.discharged_at && <>
                <Dato titulo="Fecha de baja"
                  valor={formatearFechaPago(estadia.discharged_at)} />
                <Dato titulo="Motivo de baja" valor={estadia.discharge_reason} />
              </>}
            </dl>
            <p className="mt-4"><Link
              href={`/contabilidad/${estadia.id}`} className={enlace}
            >Ver cuotas y pagos de esta estadía</Link></p>
            {puedeGestionar && <p className="mt-3"><Link
              href={`${rutaRegistros(residente.id, "pertenencias")}/nuevo?ingreso=${estadia.id}`}
              className={enlace}>Agregar pertenencia a esta estadía</Link></p>}
          </Card>
        </li>)}
      </ol>}
      <PaginacionListado pagina={estadias.pagina} total={estadias.total}
        etiqueta="estadías"
        anterior={`${ruta(estadias.pagina - 1, contactos.pagina)}#estadias`}
        siguiente={`${ruta(estadias.pagina + 1, contactos.pagina)}#estadias`} />
    </section>
  </div>;
}

function Dato({ titulo, valor }: {
  titulo: string; valor: string | null;
}): React.ReactElement {
  return <div className="min-w-0">
    <dt className="text-sm text-slate-500">{titulo}</dt>
    <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">
      {valor || "Sin registrar"}
    </dd>
  </div>;
}
