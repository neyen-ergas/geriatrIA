import Link from "next/link";
import { SearchX } from "lucide-react";
import { Card } from "@/components/ui";

export default function NoEncontrado(): React.ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 ring-1 ring-slate-900/10">
          <SearchX aria-hidden="true" className="h-7 w-7" />
        </div>
        <Card className="rounded-3xl p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">No encontramos esta página</h1>
          <p className="my-3 text-sm leading-relaxed text-slate-500">
            El enlace puede estar incompleto o el registro ya no está disponible.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Volver al inicio
          </Link>
        </Card>
      </div>
    </main>
  );
}
