"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { crearConsultaManual, type ResultadoConsultaManual } from "./actions";

const inicial: ResultadoConsultaManual = {
  error: null,
  duplicadoId: null,
  telefonoDuplicado: null,
};
const campo =
  "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100";

export function FormularioConsultaManual(): React.ReactElement {
  const [estado, enviar, pendiente] = useActionState(crearConsultaManual, inicial);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [motivo, setMotivo] = useState("");
  const [origen, setOrigen] = useState("telefono");
  const [momento, setMomento] = useState("indistinto");
  const [proximoPaso, setProximoPaso] = useState("llamar");
  const duplicadoVigente =
    estado.duplicadoId && estado.telefonoDuplicado === telefono.replace(/\D/g, "");

  return (
    <form
      action={enviar}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      {estado.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {estado.error}
        </p>
      )}
      {duplicadoVigente && (
        <div
          role="alert"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <p className="font-bold">Ya hay una consulta abierta con este teléfono.</p>
          <p className="mt-1">
            Revisala antes de crear otra, para no dividir la historia de la familia.
          </p>
          <Link
            href={`/admision/${estado.duplicadoId}`}
            className="mt-2 inline-block font-bold underline"
          >
            Abrir la consulta existente
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-800">
          Nombre de quien consulta <span aria-hidden="true">*</span>
          <input
            name="nombre"
            value={nombre}
            onChange={evento => setNombre(evento.target.value)}
            required
            maxLength={80}
            autoComplete="name"
            placeholder="Ej.: Ana Pérez"
            className={campo}
          />
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Teléfono de contacto <span aria-hidden="true">*</span>
          <input
            name="telefono"
            type="tel"
            value={telefono}
            onChange={evento => setTelefono(evento.target.value)}
            required
            maxLength={30}
            autoComplete="tel"
            placeholder="Ej.: 11 5555 1234"
            className={campo}
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-slate-800">
        ¿Qué necesita la familia? <span aria-hidden="true">*</span>
        <textarea
          name="motivo"
          value={motivo}
          onChange={evento => setMotivo(evento.target.value)}
          required
          maxLength={1000}
          rows={3}
          placeholder="Una frase alcanza; se puede ampliar después."
          className={campo}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-800">
          Llegó por
          <select
            name="origen"
            value={origen}
            onChange={evento => setOrigen(evento.target.value)}
            className={campo}
          >
            <option value="telefono">Llamada telefónica</option>
            <option value="presencial">Visita presencial</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Mejor momento para llamar
          <select
            name="momento"
            value={momento}
            onChange={evento => setMomento(evento.target.value)}
            className={campo}
          >
            <option value="indistinto">Cualquier momento</option>
            <option value="manana">Mañana</option>
            <option value="tarde">Tarde</option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-semibold text-slate-800">
        Próximo paso
        <select
          name="proximo_paso"
          value={proximoPaso}
          onChange={evento => setProximoPaso(evento.target.value)}
          className={campo}
        >
          <option value="llamar">Llamar a la familia</option>
          <option value="visita">Agendar visita</option>
        </select>
      </label>
      <p className="text-xs text-slate-500">
        * Campos obligatorios. La consulta quedará en Admisión como nueva.
      </p>

      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
        {duplicadoVigente ? (
          <button
            type="submit"
            name="permitir_duplicado"
            value="si"
            disabled={pendiente}
            className="rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {pendiente ? "Guardando…" : "Es otra familia: crear igual"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={pendiente}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {pendiente ? "Guardando…" : "Registrar consulta"}
          </button>
        )}
        <Link
          href="/admision"
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
