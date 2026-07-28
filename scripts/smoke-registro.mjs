// Smoke test del flujo crítico: login como cuidador → ver tomas del turno →
// registrar una toma vía el RPC registrar_toma → confirmar que cambió de estado.
// Es exactamente el camino de escritura que usa la pantalla "Tomas de mi turno".
import { createClient } from "@supabase/supabase-js";

const URL = "https://xytnnrtrpkgrhtbdkqjt.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dG5ucnRycGtncmh0YmRrcWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTg1MzEsImV4cCI6MjEwMDc3NDUzMX0.P9fNYz5Oj6uEY9q7boA4X2TRQ8w9bJenVPkBlO2No8E";

const s = createClient(URL, ANON, { auth: { persistSession: false } });
const { error: le } = await s.auth.signInWithPassword({
  email: "cuidador@aromos.demo",
  password: "Demo1234!",
});
if (le) throw new Error("login: " + le.message);

const { data: pend } = await s
  .from("administracion_medicamento")
  .select("id, estado")
  .eq("estado", "pendiente")
  .limit(1);
if (!pend?.length) throw new Error("No hay toma pendiente para registrar");
const tomaId = pend[0].id;
console.log("Toma pendiente:", tomaId.slice(0, 8), "estado:", pend[0].estado);

const { data: reg, error: re } = await s.rpc("registrar_toma", {
  p_toma_id: tomaId,
  p_estado: "administrada",
  p_motivo: null,
  p_observacion: null,
});
if (re) throw new Error("registrar_toma: " + re.message);
console.log("Registrada vía RPC. Nuevo estado:", reg.estado, "por:", reg.registrada_por?.slice(0, 8));

if (reg.estado !== "administrada") {
  console.log("❌ FAIL: el estado no cambió a administrada");
  process.exit(1);
}
console.log("✅ PASS: la toma pasó de pendiente a administrada.");
