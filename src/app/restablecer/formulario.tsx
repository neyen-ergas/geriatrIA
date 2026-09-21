"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { actualizarContrasena } from "./actions";

export function FormularioContrasena(): React.ReactElement {
  const [estado, accion, pendiente] = useActionState(actualizarContrasena, {});
  if (estado.actualizada) {
    return (
      <div className="mt-5">
        <p role="status" className="text-sm text-emerald-700">
          Tu contraseña fue actualizada. Guardala para próximos ingresos.
        </p>
        <Link href="/" className="mt-4 block text-sm underline">
          Entrar a geriatrIA
        </Link>
      </div>
    );
  }
  return (
    <form action={accion} className="mt-5 space-y-4">
      <div>
        <Label htmlFor="contrasena">Contraseña nueva</Label>
        <Input
          id="contrasena"
          name="contrasena"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          disabled={pendiente}
        />
        <p className="mt-1 text-xs text-slate-500">Al menos 12 caracteres.</p>
      </div>
      <div>
        <Label htmlFor="confirmacion">Repetí la contraseña</Label>
        <Input
          id="confirmacion"
          name="confirmacion"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          disabled={pendiente}
        />
      </div>
      {estado.error && (
        <p role="alert" className="text-sm text-red-700">
          {estado.error}
        </p>
      )}
      <Button type="submit" disabled={pendiente} className="w-full">
        {pendiente ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}
