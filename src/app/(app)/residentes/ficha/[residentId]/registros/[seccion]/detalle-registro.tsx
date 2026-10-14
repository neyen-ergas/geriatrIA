import Link from "next/link";
import {
  camposRegistro,
  type RegistroResidente,
  type SeccionRegistro,
  valoresRegistro,
} from "@/lib/registros-residente";
import { formatearFechaPago } from "@/lib/pagos";

export function DetalleRegistro({
  seccion,
  registro,
}: {
  seccion: SeccionRegistro;
  registro: RegistroResidente;
}): React.ReactElement {
  const valores = valoresRegistro(registro);
  return (
    <dl className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
      {camposRegistro(seccion).map(campo => {
        const valor = valores[campo.nombre];
        return (
          <div key={campo.nombre} className="min-w-0">
            <dt className="text-sm font-bold text-piedra-500">{campo.etiqueta}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-piedra-800">
              {campo.tipo === "estadia" ? (
                <Link
                  className="inline-flex items-center text-sm font-semibold text-casona-700 hover:text-casona-900 hover:underline"
                  href={`/contabilidad/${valor}`}
                >
                  Ver cuenta de la estadía asociada →
                </Link>
              ) : !valor ? (
                <span className="text-piedra-500 font-normal">Sin registrar</span>
              ) : (
                campo.opciones?.[valor] ||
                (campo.tipo === "date" ? formatearFechaPago(valor) : valor)
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
