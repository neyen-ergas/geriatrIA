"use client";

import * as React from "react";
import { TriangleAlert } from "lucide-react";
import { Button, Card } from "@/components/ui";

export default function ErrorAdmision(_props: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <Card role="alert" className="border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <TriangleAlert aria-hidden="true" className="h-5 w-5 shrink-0 text-red-600" />
        <div>
          <h1 className="text-lg font-semibold text-red-900">
            No pudimos cargar Admisión
          </h1>
          <p className="mt-2 text-sm text-red-800">
            Volvé a cargar la página. Si el problema continúa, intentá más tarde
            o contactá al responsable.
          </p>
          <Button
            className="mt-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => window.location.reload()}
          >
            Volver a cargar
          </Button>
        </div>
      </div>
    </Card>
  );
}
