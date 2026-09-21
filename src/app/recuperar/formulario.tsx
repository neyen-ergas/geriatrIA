"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Input, Label } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { errorRecuperacion } from "@/lib/recuperacion-contrasena";

export function FormularioRecuperacion(): React.ReactElement {
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (espera === 0) return;
    const temporizador = setTimeout(() => setEspera(espera - 1), 1000);
    return () => clearTimeout(temporizador);
  }, [espera]);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando || espera > 0) return;
    const correo = new FormData(event.currentTarget).get("email");
    if (typeof correo !== "string" || !correo.trim()) return;
    setEnviando(true);
    setError("");
    setMensaje("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
        redirectTo: `${window.location.origin}/auth/recuperar`,
      });
      if (error) {
        setError(errorRecuperacion(error));
      } else {
        setMensaje(
          "Si el correo tiene una cuenta, recibirás un enlace. Revisá también la carpeta de spam. Usá el último correo recibido.",
        );
      }
    } catch {
      setError("No se pudo conectar. Intentá nuevamente más tarde.");
    } finally {
      setEnviando(false);
      setEspera(60);
    }
  }

  return (
    <form onSubmit={enviar} className="mt-5 space-y-4">
      <div>
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          disabled={enviando || espera > 0}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {mensaje && (
        <p role="status" className="text-sm text-emerald-700">
          {mensaje}
        </p>
      )}
      <Button type="submit" disabled={enviando || espera > 0} className="w-full">
        {enviando
          ? "Enviando…"
          : espera > 0
            ? `Esperá ${espera} segundos`
            : "Enviar enlace"}
      </Button>
    </form>
  );
}
