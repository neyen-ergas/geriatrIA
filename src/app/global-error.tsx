"use client";

import "./globals.css";

/**
 * Reemplaza al layout raíz cuando falla el propio layout, por ejemplo si no
 * se puede verificar la sesión. Por eso arma su propio `<html>` y `<body>`.
 */
export default function ErrorGlobal(_props: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <html lang="es-AR">
      <body className="antialiased font-sans">
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
          <div
            role="alert"
            className="w-full max-w-md rounded-md border border-piedra-200/80 bg-white p-8 text-center"
          >
            <h1 className="text-2xl font-bold text-piedra-950">
              No pudimos cargar geriatrIA
            </h1>
            <p className="my-3 text-sm leading-relaxed text-piedra-500">
              Volvé a cargar la página. Si el problema continúa, intentá más tarde o
              contactá al responsable.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-casona-700 px-4 text-sm font-medium text-white hover:bg-casona-800"
            >
              Volver a cargar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
