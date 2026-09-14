import Link from "next/link";
import { camposRegistro, type RegistroResidente, type SeccionRegistro, valoresRegistro } from "@/lib/registros-residente";
import { formatearFechaPago } from "@/lib/pagos";

export function DetalleRegistro({ seccion, registro }: {
  seccion: SeccionRegistro; registro: RegistroResidente;
}): React.ReactElement {
  const valores = valoresRegistro(registro);
  return <dl className="grid gap-4 sm:grid-cols-2">{camposRegistro(seccion).map(campo => {
    const valor = valores[campo.nombre];
    return <div key={campo.nombre} className="min-w-0">
      <dt className="text-sm text-slate-500">{campo.etiqueta}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm">
        {campo.tipo === "estadia" ? <Link className="text-sky-800 underline"
          href={`/contabilidad/${valor}`}>Ver cuenta de la estadía asociada</Link>
          : !valor ? "Sin registrar" : campo.opciones?.[valor]
            || (campo.tipo === "date" ? formatearFechaPago(valor) : valor)}
      </dd>
    </div>;
  })}</dl>;
}
