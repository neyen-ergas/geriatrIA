import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { hoyEnArgentina, type ValoresPrimerIngreso } from "@/lib/primer-ingreso";
import { obtenerIngresoActivoParaEditar } from "@/lib/residentes-datos";
import { FormularioPrimerIngreso } from "../../nuevo/formulario-primer-ingreso";
import { actualizarPrimerIngreso } from "./actions";

export const metadata: Metadata = {
  title: "Editar residente · geriatrIA",
};

export default async function EditarResidentePage({
  params,
}: {
  params: Promise<{ admissionId: string }>;
}) {
  const { admissionId } = await params;
  const datos = await obtenerIngresoActivoParaEditar(admissionId);

  if (!datos) notFound();

  const { admission, contact, resident } = datos;
  const formAction = actualizarPrimerIngreso.bind(null, {
    admissionId: admission.id,
    contactId: contact.id,
    residentId: resident.id,
  });
  const valoresIniciales: ValoresPrimerIngreso = {
    resident_first_name: resident.first_name,
    resident_last_name: resident.last_name,
    resident_dni: resident.dni,
    resident_birth_date: resident.birth_date,
    resident_phone: resident.phone ?? "",
    resident_address: resident.address ?? "",
    resident_notes: resident.notes ?? "",
    contact_first_name: contact.first_name,
    contact_last_name: contact.last_name,
    contact_relationship: contact.relationship,
    contact_phone: contact.phone,
    contact_is_emergency_contact: contact.is_emergency_contact,
    contact_is_payment_responsible: contact.is_payment_responsible,
    contact_notes: contact.notes ?? "",
    admitted_at: admission.admitted_at,
    room: admission.room ?? "",
    monthly_fee: String(admission.monthly_fee),
    due_day: String(admission.due_day),
    administrative_notes: admission.administrative_notes ?? "",
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/residentes"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a residentes
      </Link>

      <h1 className="mt-5 text-2xl font-bold text-slate-900">
        Editar residente
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Actualizá la ficha de {resident.first_name} {resident.last_name}. Los
        cambios se guardarán juntos para mantener la información consistente.
      </p>

      <FormularioPrimerIngreso
        hoy={hoyEnArgentina()}
        formAction={formAction}
        modo="editar"
        valoresIniciales={valoresIniciales}
      />
    </div>
  );
}
