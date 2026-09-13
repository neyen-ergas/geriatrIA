"use client";
import { Button, Card } from "@/components/ui";

export default function ErrorEmpleados(): React.ReactElement {
  return <Card role="alert" className="border-red-200 bg-red-50 p-6">
    <h1 className="font-semibold text-red-900">No pudimos cargar Empleados</h1>
    <p className="mt-2 text-sm text-red-800">Volvé a cargar la página para consultar la información actual.</p>
    <Button className="mt-4" onClick={() => window.location.reload()}>Volver a cargar</Button>
  </Card>;
}
