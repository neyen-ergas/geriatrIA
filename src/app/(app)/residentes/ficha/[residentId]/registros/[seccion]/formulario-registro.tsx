"use client";
import { useActionState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import {
  camposRegistro,
  type EstadoRegistro,
  type SeccionRegistro,
} from "@/lib/registros-residente";
import { TIPOS_COMPROBANTE } from "@/lib/comprobantes";
import { archivarRegistro, guardarRegistro } from "./actions";

export function FormularioRegistro({
  residenteId,
  seccion,
  registroId,
  version,
  iniciales,
  archivar = false,
}: {
  residenteId: string;
  seccion: SeccionRegistro;
  registroId: string;
  version: string | null;
  iniciales: Record<string, string>;
  archivar?: boolean;
}): React.ReactElement {
  const inicial: EstadoRegistro = { valores: iniciales, errores: {}, mensaje: null };
  const accion = archivar
    ? archivarRegistro.bind(null, residenteId, seccion, registroId, version ?? "")
    : guardarRegistro.bind(null, residenteId, seccion, registroId, version);
  const [estado, enviar, pendiente] = useActionState(accion, inicial);
  return (
    <Card className="mt-5 p-5">
      <form action={enviar}>
        <fieldset disabled={pendiente} className="space-y-4">
          <legend className="sr-only">Datos del registro</legend>
          {archivar ? (
            <div>
              <Label htmlFor="motivo">Motivo del archivo</Label>
              <textarea
                id="motivo"
                name="motivo"
                required
                rows={3}
                defaultValue={estado.valores.motivo}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm"
              />
            </div>
          ) : (
            <>
              {camposRegistro(seccion).map(campo =>
                campo.tipo === "estadia" ? (
                  <input
                    key={campo.nombre}
                    type="hidden"
                    name={campo.nombre}
                    value={iniciales[campo.nombre]}
                  />
                ) : (
                  <div key={campo.nombre}>
                    <Label htmlFor={campo.nombre}>
                      {campo.etiqueta}
                      {campo.opcional ? " (opcional)" : ""}
                    </Label>
                    {campo.tipo === "textarea" ? (
                      <textarea
                        id={campo.nombre}
                        name={campo.nombre}
                        required={!campo.opcional}
                        rows={4}
                        defaultValue={estado.valores[campo.nombre]}
                        aria-invalid={!!estado.errores[campo.nombre]}
                        aria-describedby={
                          estado.errores[campo.nombre]
                            ? `${campo.nombre}-error`
                            : undefined
                        }
                        className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                      />
                    ) : campo.opciones ? (
                      <select
                        id={campo.nombre}
                        name={campo.nombre}
                        required
                        defaultValue={estado.valores[campo.nombre] || ""}
                        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                      >
                        <option value="">Elegí una opción</option>
                        {Object.entries(campo.opciones).map(([valor, etiqueta]) => (
                          <option key={valor} value={valor}>
                            {etiqueta}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={campo.nombre}
                        name={campo.nombre}
                        type={campo.tipo || "text"}
                        required={!campo.opcional}
                        min={campo.tipo === "number" ? 1 : undefined}
                        max={campo.tipo === "number" ? 100000 : undefined}
                        step={campo.tipo === "number" ? 1 : undefined}
                        defaultValue={estado.valores[campo.nombre]}
                        aria-invalid={!!estado.errores[campo.nombre]}
                        aria-describedby={
                          estado.errores[campo.nombre]
                            ? `${campo.nombre}-error`
                            : undefined
                        }
                      />
                    )}
                    {estado.errores[campo.nombre] && (
                      <p
                        id={`${campo.nombre}-error`}
                        className="mt-1 text-sm text-red-700"
                      >
                        {estado.errores[campo.nombre]}
                      </p>
                    )}
                  </div>
                ),
              )}
              {seccion === "documentos" && !version && (
                <div>
                  <Label htmlFor="archivo">Archivo JPG, PNG o PDF (hasta 3 MB)</Label>
                  <Input
                    id="archivo"
                    name="archivo"
                    type="file"
                    accept={TIPOS_COMPROBANTE}
                    required
                  />
                  <p className="mt-1 text-sm text-slate-500">
                    Si ocurre un error, volvé a seleccionar el archivo.
                  </p>
                  {estado.errores.archivo && (
                    <p className="text-sm text-red-700">{estado.errores.archivo}</p>
                  )}
                </div>
              )}
            </>
          )}
        </fieldset>
        {estado.mensaje && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {estado.mensaje}
          </p>
        )}
        <Button type="submit" disabled={pendiente} className="mt-5">
          {pendiente ? "Guardando…" : archivar ? "Confirmar archivo" : "Guardar registro"}
        </Button>
      </form>
    </Card>
  );
}
