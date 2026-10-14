"use client";

import { TriangleAlert } from "lucide-react";
import { Button, Card } from "@/components/ui";

/**
 * Cubre las secciones que no tienen su propio `error.tsx`. No muestra el
 * mensaje ni el `digest`: pueden traer datos internos de la base.
 */
export default function ErrorSeccion(_props: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <Card role="alert" className="border-oxido-200 bg-oxido-50 p-6">
      <div className="flex items-start gap-3">
        <TriangleAlert aria-hidden="true" className="h-5 w-5 shrink-0 text-oxido-600" />
        <div>
          <h1 className="text-2xl font-bold text-piedra-950">
            No pudimos cargar esta sección
          </h1>
          <p className="mt-2 text-sm text-oxido-800">
            Volvé a cargar la página. Si el problema continúa, intentá más tarde o
            contactá al responsable.
          </p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Volver a cargar
          </Button>
        </div>
      </div>
    </Card>
  );
}
