"use client";

import { Button, Card } from "@/components/ui";

export default function ErrorContabilidad(): React.ReactElement {
  return (
    <Card className="p-6" role="alert">
      <h2 className="font-semibold text-slate-900">No pudimos cargar Contabilidad</h2>
      <p className="mt-2 text-sm text-slate-600">
        Volvé a cargar para consultar los datos actualizados de la cuenta.
      </p>
      <Button className="mt-4" onClick={() => window.location.reload()}>
        Volver a cargar
      </Button>
    </Card>
  );
}
