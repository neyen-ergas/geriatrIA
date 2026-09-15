import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";

const require = createRequire(import.meta.url);
const manifiesto = JSON.parse(
  await readFile(".next/server/functions-config-manifest.json", "utf8"),
);
assert.equal(manifiesto.functions["/_middleware"]?.runtime, "nodejs");

const origen = "http://127.0.0.1:3100";
const servidor = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "start", "-p", "3100"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "prueba-sin-credenciales",
    },
  },
);

async function esperarLogin() {
  for (let intento = 0; intento < 40; intento++) {
    assert.equal(servidor.exitCode, null, "El servidor terminó antes de tiempo");
    try {
      return await fetch(`${origen}/login`, {
        redirect: "manual",
        signal: AbortSignal.timeout(2000),
      });
    } catch {
      await setTimeout(500);
    }
  }
  throw new Error("El servidor no respondió al iniciar");
}

try {
  const login = await esperarLogin();
  assert.equal(login.status, 200, "El login debe responder sin sesión");
  const contenido = await login.text();
  assert.match(contenido, /name="email"/);
  assert.match(contenido, /name="password"/);

  for (const ruta of ["/", "/residentes", "/auditoria"]) {
    const respuesta = await fetch(`${origen}${ruta}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(respuesta.status, 307, `${ruta} debe requerir sesión`);
    assert.equal(respuesta.headers.get("location"), "/login");
    await respuesta.body?.cancel();
  }
  process.stdout.write("Acceso de producción y rutas protegidas: OK\n");
} finally {
  servidor.kill();
}
