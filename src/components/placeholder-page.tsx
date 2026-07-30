import { Card } from "@/components/ui";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <Card className="mt-6 flex h-64 items-center justify-center p-6 text-sm text-slate-400">
        Todavía no hay nada acá.
      </Card>
    </div>
  );
}
