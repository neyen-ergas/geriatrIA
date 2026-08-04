import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crea un cliente nuevo para cada ejecución en el servidor.
 * Las cookies permitirán incorporar Supabase Auth en la próxima etapa.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Los Server Components no pueden modificar cookies. La futura
            // capa de autenticación se ocupará de refrescarlas en la respuesta.
          }
        },
      },
    },
  );
}
