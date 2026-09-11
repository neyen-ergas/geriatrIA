"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { MAX_COMPROBANTE_BYTES, TIPOS_COMPROBANTE } from "@/lib/comprobantes";
import {
  MEDIOS_PAGO, vencimientoSugerido, type EstadoCargaPago,
} from "@/lib/cargar-pagos";

export function FormularioCarga({ modo, valoresIniciales, diaVencimiento = 10,
  volver, formAction, hoy, moneda,
}: {
  modo: "cuota" | "pago";
  valoresIniciales: Record<string, string>;
  diaVencimiento?: number;
  volver: string;
  hoy: string;
  moneda: string;
  formAction: (anterior: EstadoCargaPago, datos: FormData) => Promise<EstadoCargaPago>;
}): React.ReactElement {
  const [estado, action, pendiente] = useActionState(formAction, {
    errores: {}, mensaje: null, valores: valoresIniciales,
  } as EstadoCargaPago);
  const [periodo, setPeriodo] = useState(valoresIniciales.periodo ?? "");
  const [vencimiento, setVencimiento] = useState(valoresIniciales.vencimiento ?? "");
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const atributos = (campo: string) => ({
    id: campo, name: campo,
    "aria-invalid": Boolean(estado.errores[campo]),
    "aria-describedby": estado.errores[campo] ? `${campo}-error` : undefined,
  });
  const errorCampo = (campo: string) => estado.errores[campo] && (
    <p id={`${campo}-error`} className="mt-1 text-sm text-red-700">{estado.errores[campo]}</p>
  );
  return (
    <form action={action} className="mt-6 max-w-2xl space-y-4" noValidate>
      {estado.mensaje && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{estado.mensaje}</p>
      )}
      <Card className="p-6">
        <fieldset disabled={pendiente || estado.bloqueado} className="space-y-5">
          <legend className="sr-only">{modo === "cuota" ? "Datos de la cuota" : "Datos del pago"}</legend>
          {modo === "cuota" ? (
            <>
              <div>
                <Label htmlFor="periodo">Período *</Label>
                <Input {...atributos("periodo")} type="month" required value={periodo}
                  onChange={evento => {
                    setPeriodo(evento.target.value);
                    setVencimiento(vencimientoSugerido(evento.target.value, diaVencimiento));
                  }} />
                {errorCampo("periodo")}
              </div>
              <div>
                <Label htmlFor="vencimiento">Vencimiento *</Label>
                <Input {...atributos("vencimiento")} type="date" required
                  min={periodo ? `${periodo}-01` : undefined}
                  max={vencimientoSugerido(periodo, 31) || undefined}
                  value={vencimiento} onChange={evento => setVencimiento(evento.target.value)} />
                {errorCampo("vencimiento")}
              </div>
            </>
          ) : (
            <div>
              <Label htmlFor="fecha">Fecha del pago *</Label>
              <Input {...atributos("fecha")} type="date" max={hoy} required
                defaultValue={estado.valores.fecha} />
              {errorCampo("fecha")}
            </div>
          )}
          <div>
            <Label htmlFor="importe">Importe ({moneda}) *</Label>
            <Input {...atributos("importe")} inputMode="decimal" required
              defaultValue={estado.valores.importe} />
            <p className="mt-1 text-xs text-slate-500">
              {modo === "cuota" ? "Confirmá o ajustá el importe sugerido. " : "Podés registrar un pago total o parcial. "}
              Ejemplo: 150.000,50.
            </p>
            {errorCampo("importe")}
          </div>
          {modo === "pago" && (
            <>
              <div>
                <Label htmlFor="medio">Medio de pago *</Label>
                <select {...atributos("medio")} required defaultValue={estado.valores.medio}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                  <option value="">Elegí un medio</option>
                  {Object.entries(MEDIOS_PAGO).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>{etiqueta}</option>
                  ))}
                </select>
                {errorCampo("medio")}
              </div>
              <div>
                <Label htmlFor="referencia">Referencia de la operación (opcional)</Label>
                <Input {...atributos("referencia")} defaultValue={estado.valores.referencia} />
              </div>
              <div>
                <Label htmlFor="comprobante">Comprobante (opcional)</Label>
                <Input {...atributos("comprobante")} type="file" accept={TIPOS_COMPROBANTE}
                  onChange={evento => {
                    const archivo = evento.target.files?.[0];
                    setErrorArchivo(archivo && archivo.size > MAX_COMPROBANTE_BYTES
                      ? "El comprobante no puede superar los 3 MB." : null);
                  }} />
                <p className="mt-1 text-xs text-slate-500">JPG, PNG o PDF, hasta 3 MB. Se guarda de forma privada. Si el envío falla, seleccioná el archivo nuevamente.</p>
                {errorArchivo && <p role="alert" className="mt-1 text-sm text-red-700">{errorArchivo}</p>}
                {errorCampo("comprobante")}
              </div>
            </>
          )}
          <div>
            <Label htmlFor="notas">Observaciones {modo === "pago" ? "(obligatorias para otro medio)" : "(opcional)"}</Label>
            <Textarea {...atributos("notas")} defaultValue={estado.valores.notas} />
            {errorCampo("notas")}
          </div>
          <Button type="submit" disabled={Boolean(errorArchivo)}>
            {pendiente ? "Guardando…" : modo === "cuota" ? "Crear cuota" : "Registrar pago"}
          </Button>
        </fieldset>
      </Card>
      <Link href={volver} className="inline-block py-2 text-sm font-medium text-sky-700 hover:underline">
        Volver a la cuenta
      </Link>
    </form>
  );
}
