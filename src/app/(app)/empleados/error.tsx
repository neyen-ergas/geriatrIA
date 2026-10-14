"use client";
import { Button, Card } from "@/components/ui";

export default function ErrorEmpleados(): React.ReactElement {
  return (
    <Card role="alert" className="border-oxido-200 bg-oxido-50 p-6">
      <h1 className="text-2xl font-bold text-piedra-950">No pudimos cargar Empleados</h1>
      <p className="mt-2 text-sm text-oxido-800">
        Volvé a cargar la página para consultar la información actual.
      </p>
      <Button className="mt-4" onClick={() => window.location.reload()}>
        Volver a cargar
      </Button>
    </Card>
  );
}
