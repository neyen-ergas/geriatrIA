"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { login } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full font-semibold">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Ingresando…
        </>
      ) : (
        "Ingresar"
      )}
    </Button>
  );
}

export function LoginForm({ errorMessage }: { errorMessage?: string }) {
  const [mostrarPassword, setMostrarPassword] = useState(false);

  return (
    <form action={login} className="space-y-4">
      <div>
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="usuario@residencia.com"
          autoFocus
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={mostrarPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="pr-28"
          />
          <button
            type="button"
            onClick={() => setMostrarPassword(!mostrarPassword)}
            className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center gap-1.5 rounded-r-md px-3 text-sm font-semibold text-piedra-700 hover:bg-piedra-100 hover:text-piedra-950"
            aria-pressed={mostrarPassword}
          >
            {mostrarPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
            {mostrarPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-md border border-oxido-300 bg-oxido-50 px-3.5 py-2.5 text-base text-oxido-900"
        >
          {errorMessage}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
