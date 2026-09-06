/** Conserva el identificador como texto y elimina puntos y espacios. */
export function normalizarDni(valor: string): string {
  return valor.replace(/[.\s]/g, "");
}
