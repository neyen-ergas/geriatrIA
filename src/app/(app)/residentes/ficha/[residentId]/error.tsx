"use client";

import { Button, Card } from "@/components/ui";

export default function ErrorFicha({ reset }: { reset: () => void }): React.ReactElement {
  return (
    <Card role="alert" className="p-6">
      <h1 className="text-lg font-semibold">No se pudo cargar la ficha</h1>
      <p className="my-3 text-sm text-slate-600">
        Reintentá para consultar los datos, contactos y estadías del residente.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </Card>
  );
}
