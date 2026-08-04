import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la clave `service_role`, para las tablas que tienen RLS activada
 * sin políticas. Saltea RLS por completo, así que no distingue quién consulta:
 * quien lo use debe verificar antes la sesión con `requerirSesion()`.
 *
 * El `import "server-only"` de arriba hace fallar el build si este módulo entra
 * en un componente cliente, que es la forma de garantizar que la clave nunca
 * llegue al navegador.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. " +
        "Copiar .env.example como .env.local y completar los valores.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
