import { Card } from "@/components/ui";

export default function InicioLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-80 rounded bg-slate-100" />
        
        {/* Quick action buttons skeleton */}
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="h-9 w-36 rounded-lg bg-slate-200" />
          <div className="h-9 w-36 rounded-lg bg-slate-200" />
          <div className="h-9 w-44 rounded-lg bg-slate-200" />
        </div>
      </div>

      {/* KPI Ribbon skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="h-4 w-20 rounded bg-slate-100" />
            <div className="mt-2 h-7 w-12 rounded bg-slate-200" />
          </Card>
        ))}
      </div>

      {/* Grid of operational cards skeleton */}
      <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="h-5 w-36 rounded bg-slate-200" />
                <div className="h-3 w-48 rounded bg-slate-100" />
              </div>
              <div className="h-8 w-10 rounded-lg bg-slate-100" />
            </div>
            <div className="mt-5 space-y-3">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-3/4 rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
