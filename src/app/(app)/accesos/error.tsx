"use client";

import { Button, Card } from "@/components/ui";

export default function ErrorAccesos({ reset }: { reset: () => void }) {
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold text-piedra-950">
        No se pudieron cargar los accesos
      </h1>
      <p className="my-4 text-piedra-600">
        Intentá nuevamente. Si el problema continúa, revisá tu conexión y tus permisos.
      </p>
      <Button type="button" onClick={reset}>
        Reintentar
      </Button>
    </Card>
  );
}
