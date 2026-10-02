"use client";

import { useEffect, useState } from "react";

function leerFecha(valor: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const [anio, mes, dia] = valor.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia, 12));
  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  )
    return null;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(fecha);
}

/** Aclara el valor real de un input date, cuyo orden visual depende del navegador. */
export function FechaLegible({ id }: { id: string }) {
  const [fecha, setFecha] = useState<string | null>(null);
  useEffect(() => {
    const campo = document.getElementById(id);
    if (!(campo instanceof HTMLInputElement)) return;
    const actualizar = () => setFecha(leerFecha(campo.value));
    actualizar();
    campo.addEventListener("input", actualizar);
    campo.addEventListener("change", actualizar);
    return () => {
      campo.removeEventListener("input", actualizar);
      campo.removeEventListener("change", actualizar);
    };
  }, [id]);
  return (
    <p className="mt-1 text-xs font-medium text-slate-600" aria-live="polite">
      {fecha
        ? `Fecha elegida: ${fecha}`
        : "Al elegirla, confirmá aquí el día y el mes (DD/MM/AAAA)."}
    </p>
  );
}
