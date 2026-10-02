export type OrigenConsultaManual = "telefono" | "presencial";
export type MomentoConsultaManual = "manana" | "tarde" | "indistinto";
export type ProximoPasoConsulta = "llamar" | "visita";

export type DatosConsultaManual = {
  nombre: string;
  telefono: string;
  motivo: string;
  origen: OrigenConsultaManual;
  momento: MomentoConsultaManual;
  proximoPaso: ProximoPasoConsulta;
  permitirDuplicado: boolean;
};

export function validarConsultaManual(
  formulario: FormData,
): { ok: true; datos: DatosConsultaManual } | { ok: false; error: string } {
  const texto = (clave: string) => {
    const valor = formulario.get(clave);
    return typeof valor === "string" ? valor.trim() : "";
  };
  const nombre = texto("nombre");
  const telefono = texto("telefono");
  const motivo = texto("motivo");
  const origen = texto("origen");
  const momento = texto("momento");
  const proximoPaso = texto("proximo_paso");

  if (nombre.length < 2 || nombre.length > 80)
    return { ok: false, error: "Escribí el nombre de la familia (2 a 80 caracteres)." };
  if (
    telefono.length < 6 ||
    telefono.length > 30 ||
    telefono.replace(/\D/g, "").length < 6
  )
    return { ok: false, error: "Ingresá un teléfono válido, con al menos 6 números." };
  if (motivo.length < 2 || motivo.length > 1000)
    return { ok: false, error: "Contanos brevemente el motivo de la consulta." };
  if (origen !== "telefono" && origen !== "presencial")
    return { ok: false, error: "Elegí cómo llegó la consulta." };
  if (momento !== "manana" && momento !== "tarde" && momento !== "indistinto")
    return { ok: false, error: "Elegí cuándo se puede llamar." };
  if (proximoPaso !== "llamar" && proximoPaso !== "visita")
    return { ok: false, error: "Elegí el próximo paso." };

  return {
    ok: true,
    datos: {
      nombre,
      telefono,
      motivo,
      origen,
      momento,
      proximoPaso,
      permitirDuplicado: texto("permitir_duplicado") === "si",
    },
  };
}
