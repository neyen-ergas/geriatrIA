import { MarcaGeriatria } from "@/components/baldosa";

/**
 * Marco de las pantallas fuera de la sesión: el riel verde de la app se abre a
 * la izquierda y el formulario queda solo, sobre el piso de piedra.
 */
export function PantallaAcceso({
  titulo,
  bajada,
  children,
  pie,
}: {
  titulo: React.ReactNode;
  bajada?: React.ReactNode;
  children: React.ReactNode;
  pie?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex min-h-dvh flex-col bg-piedra-100 lg:flex-row">
      <aside className="flex shrink-0 flex-col justify-between bg-casona-900 px-6 py-5 text-white lg:w-[26rem] lg:px-10 lg:py-10">
        <MarcaGeriatria />
        <p className="mt-10 hidden max-w-xs text-2xl leading-snug font-bold text-casona-50 lg:block">
          El día de la residencia, de la consulta de una familia a cada cuota.
        </p>
        <p className="mt-6 hidden text-sm text-casona-200 lg:block">
          Uso exclusivo del equipo de la residencia.
        </p>
      </aside>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-16">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-piedra-950">{titulo}</h1>
          {bajada && <p className="mt-2 text-base text-piedra-700">{bajada}</p>}
          <div className="mt-6 rounded-md border border-piedra-200 bg-white p-6 sm:p-7">
            {children}
          </div>
          {pie && <div className="mt-5 text-base text-piedra-700">{pie}</div>}
        </div>
      </main>
    </div>
  );
}
