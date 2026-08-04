import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea un cliente de Supabase para componentes que se ejecutan en el navegador.
 * No se comparte una clave administrativa: la seguridad de los datos se
 * aplicará mediante autenticación y políticas RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
