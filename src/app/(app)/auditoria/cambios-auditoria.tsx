import Link from "next/link";
import { Card } from "@/components/ui";
import { enlaceAuditoria, esIdentificadorAuditoria, valoresAuditoria, type EventoAuditoria } from "@/lib/auditoria";
import { etiquetaCampoAuditoria, formatearValorAuditoria, RELACIONES_AUDITORIA } from "@/lib/auditoria-campos";

export function CambiosAuditoria({ evento }: { evento: EventoAuditoria }): React.ReactElement {
  const anterior = valoresAuditoria(evento.old_values);
  const nuevo = valoresAuditoria(evento.new_values);
  if (!evento.changed_fields.length) return <Card className="p-6 text-sm text-slate-600">Este evento conserva su fecha y autor. No se guardaron los valores anteriores y nuevos, por lo que no es posible reconstruirlos.</Card>;
  return <div className="space-y-3">{evento.changed_fields.map(campo => <Card key={campo} className="p-5">
    <h2 className="font-semibold">{etiquetaCampoAuditoria(campo)}</h2>
    <dl className="mt-3 grid gap-4 sm:grid-cols-2">
      <div><dt className="text-xs font-medium uppercase text-slate-500">Anterior</dt><dd className="mt-1 whitespace-pre-wrap break-all text-sm"><Valor campo={campo} valor={anterior[campo]} /></dd></div>
      <div><dt className="text-xs font-medium uppercase text-slate-500">Nuevo</dt><dd className="mt-1 whitespace-pre-wrap break-all text-sm"><Valor campo={campo} valor={nuevo[campo]} /></dd></div>
    </dl>
  </Card>)}</div>;
}

function Valor({ campo, valor }: { campo: string; valor: unknown }): React.ReactNode {
  const relacion = RELACIONES_AUDITORIA[campo];
  if (relacion && typeof valor === "string" && esIdentificadorAuditoria(valor)) {
    return <><span className="block text-xs text-slate-500">Referencia: {valor}</span><Link href={enlaceAuditoria({ tabla: relacion, registro: valor })} className="text-sky-800 underline">Ver historial del registro vinculado</Link></>;
  }
  return formatearValorAuditoria(campo, valor);
}
