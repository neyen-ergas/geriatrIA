"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("Email o contraseña incorrectos.");
      setCargando(false);
      return;
    }
    router.push("/turno");
    router.refresh();
  }

  function usarDemo(rol: "owner" | "cuidador") {
    setEmail(rol === "owner" ? "owner@aromos.demo" : "cuidador@aromos.demo");
    setPassword("Demo1234!");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            geriatr<span className="text-emerald-600">IA</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Registro de medicación sin papel
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={cargando}>
            {cargando ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
            Usuarios demo
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => usarDemo("owner")}
            >
              Owner
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => usarDemo("cuidador")}
            >
              Cuidador
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Contraseña: Demo1234!
          </p>
        </div>
      </Card>
    </main>
  );
}
