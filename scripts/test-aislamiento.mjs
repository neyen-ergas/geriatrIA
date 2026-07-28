// Test de aislamiento entre organizaciones (requisito no negociable del plan).
//
// Verifica, usando login real contra Supabase Auth con el anon key (sin mocks):
//   1. Un usuario de la Organización A ve CERO filas de la Organización B
//      en cada tabla con datos clínicos (residente, administracion, etc.).
//   2. Lo mismo en el sentido inverso (B no ve A).
//   3. Aislamiento por ROL: un `cuidador` NO puede hacer UPDATE directo sobre
//      administracion_medicamento (solo puede registrar vía el RPC validado).
//
// Uso:  node scripts/test-aislamiento.mjs
// Sale con código 1 si alguna verificación falla.

import { createClient } from "@supabase/supabase-js";

const URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://xytnnrtrpkgrhtbdkqjt.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dG5ucnRycGtncmh0YmRrcWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTg1MzEsImV4cCI6MjEwMDc3NDUzMX0.P9fNYz5Oj6uEY9q7boA4X2TRQ8w9bJenVPkBlO2No8E";

let fallos = 0;
function check(nombre, cond, detalle = "") {
  const ok = !!cond;
  if (!ok) fallos++;
  console.log(`  ${ok ? "✅ PASS" : "❌ FAIL"}  ${nombre}${detalle ? "  — " + detalle : ""}`);
}

async function loginNuevoCliente(email, password) {
  const supabase = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(`No se pudo loguear ${email}: ${error.message}`);
  return { supabase, userId: data.user.id };
}

async function main() {
  console.log("── Test de aislamiento entre organizaciones ──\n");

  const A = await loginNuevoCliente("owner@aromos.demo", "Demo1234!");
  const B = await loginNuevoCliente("owner@sanmartin.demo", "Demo1234!");
  const cuidador = await loginNuevoCliente("cuidador@aromos.demo", "Demo1234!");

  // Org de cada usuario.
  const orgA = (
    await A.supabase.from("usuario_perfil").select("organizacion_id").eq("id", A.userId).single()
  ).data?.organizacion_id;
  const orgB = (
    await B.supabase.from("usuario_perfil").select("organizacion_id").eq("id", B.userId).single()
  ).data?.organizacion_id;

  console.log("Contexto:");
  check("A y B son organizaciones distintas", orgA && orgB && orgA !== orgB,
    `A=${orgA?.slice(0, 8)} B=${orgB?.slice(0, 8)}`);

  // Residentes de B (para comprobar que A no los ve).
  const resB = (await B.supabase.from("residente").select("id, organizacion_id")).data ?? [];
  const idsB = new Set(resB.map((r) => r.id));
  check("B ve sus propios residentes", resB.length > 0, `${resB.length} residentes`);
  check("B solo ve residentes de su organización",
    resB.every((r) => r.organizacion_id === orgB));

  console.log("\nAislamiento A → B:");
  const resA = (await A.supabase.from("residente").select("id, organizacion_id")).data ?? [];
  check("A ve sus propios residentes", resA.length > 0, `${resA.length} residentes`);
  check("A NO ve ningún residente de B (0 filas)",
    resA.every((r) => !idsB.has(r.id) && r.organizacion_id === orgA));

  // Intento explícito de leer un residente de B por su id, logueado como A.
  const fuga = (
    await A.supabase.from("residente").select("id").eq("id", resB[0]?.id ?? "").maybeSingle()
  ).data;
  check("A pidiendo un residente de B por id → 0 filas", fuga === null);

  // Tablas clínicas: ninguna fila con organizacion_id de B.
  for (const tabla of ["administracion_medicamento", "prescripcion", "medicamento", "contacto_residente", "habitacion"]) {
    const filas = (await A.supabase.from(tabla).select("organizacion_id")).data ?? [];
    check(`A: tabla ${tabla} sin filas de B`,
      filas.every((f) => f.organizacion_id === orgA),
      `${filas.length} filas visibles, todas de A`);
  }

  console.log("\nAislamiento B → A:");
  const idsA = new Set(resA.map((r) => r.id));
  const resBverA = (await B.supabase.from("residente").select("id")).data ?? [];
  check("B NO ve ningún residente de A",
    resBverA.every((r) => !idsA.has(r.id)));

  console.log("\nAislamiento por ROL (cuidador):");
  // El cuidador ve las tomas de su organización...
  const pend = (
    await cuidador.supabase
      .from("administracion_medicamento")
      .select("id, estado")
      .eq("estado", "pendiente")
      .limit(1)
  ).data ?? [];
  check("cuidador ve tomas de su organización", pend.length > 0);

  // ...pero un UPDATE directo debe afectar 0 filas (RLS lo bloquea).
  if (pend.length > 0) {
    const { data: upd } = await cuidador.supabase
      .from("administracion_medicamento")
      .update({ observacion: "intento directo (no debería entrar)" })
      .eq("id", pend[0].id)
      .select();
    check("cuidador NO puede hacer UPDATE directo (0 filas afectadas)",
      Array.isArray(upd) && upd.length === 0);
  }

  console.log("");
  if (fallos === 0) {
    console.log("✅ TODO OK: aislamiento entre organizaciones y por rol verificado.");
    process.exit(0);
  } else {
    console.log(`❌ ${fallos} verificación(es) fallaron.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Error inesperado:", e);
  process.exit(1);
});
