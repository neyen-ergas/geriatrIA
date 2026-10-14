import { Card } from "@/components/ui";

export default function InicioLoading() {
  return (
    <div className="animate-pulse space-y-7">
      {/* Header skeleton */}
      <div className="rounded-md border border-piedra-200/80 bg-white p-6 sm:p-7">
        <div className="h-5 w-28 rounded-full bg-piedra-200/80" />
        <div className="mt-3 h-8 w-64 rounded-md bg-piedra-200/80" />
        <div className="mt-2 h-4 w-80 rounded-md bg-piedra-100" />

        {/* Quick action buttons skeleton */}
        <div className="mt-5 flex flex-wrap gap-2.5">
          <div className="h-9 w-36 rounded-md bg-piedra-200/80" />
          <div className="h-9 w-36 rounded-md bg-piedra-100" />
          <div className="h-9 w-44 rounded-md bg-piedra-100" />
        </div>

        {/* KPI Ribbon skeleton */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-piedra-100 pt-5 sm:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-md border border-piedra-100 bg-piedra-50/60 p-3.5"
            >
              <div className="h-9 w-9 rounded-md bg-piedra-200/70" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-16 rounded bg-piedra-100" />
                <div className="h-5 w-8 rounded bg-piedra-200/80" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid of operational cards skeleton */}
      <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-5 w-36 rounded-md bg-piedra-200/80" />
                <div className="h-3 w-48 rounded bg-piedra-100" />
              </div>
              <div className="h-6 w-8 rounded-full bg-piedra-100" />
            </div>
            <div className="mt-6 space-y-3">
              <div className="h-4 w-full rounded-md bg-piedra-100" />
              <div className="h-4 w-3/4 rounded-md bg-piedra-100" />
              <div className="h-4 w-5/6 rounded-md bg-piedra-100" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
