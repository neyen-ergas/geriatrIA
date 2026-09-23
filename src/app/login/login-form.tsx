"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { login } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="w-full font-semibold shadow-xs"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Ingresando...
        </>
      ) : (
        "Ingresar a la plataforma"
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
            placeholder="••••••••••••"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setMostrarPassword(!mostrarPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
            aria-label={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
          >
            {mostrarPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200/80 bg-red-50/90 px-3.5 py-2.5 text-xs font-medium text-red-700"
        >
          {errorMessage}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
