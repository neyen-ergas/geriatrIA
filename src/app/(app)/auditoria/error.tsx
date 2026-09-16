"use client";
import { Button, Card } from "@/components/ui";

export default function ErrorAuditoria({
  reset,
}: {
  reset: () => void;
}): React.ReactElement {
  return (
    <Card role="alert" className="p-6">
      <h1 className="text-lg font-semibold">No se pudo cargar la auditoría</h1>
      <p className="my-3 text-sm text-slate-600">
        Reintentá para consultar el historial. Los errores de carga no significan que no
        haya cambios registrados.
      </p>
      <Button type="button" onClick={reset}>
        Reintentar
      </Button>
    </Card>
  );
}
