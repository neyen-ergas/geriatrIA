// Argentina no observa horario de verano: offset fijo -03:00.
// (Simplificación aceptable para el demo; documentada como deuda técnica.)
const AR_OFFSET = "-03:00";

export function rangoHoyAR(): { desde: string; hasta: string; ymd: string } {
  const now = new Date();
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const desde = new Date(`${ymd}T00:00:00${AR_OFFSET}`);
  const hasta = new Date(desde.getTime() + 24 * 60 * 60 * 1000);
  return { desde: desde.toISOString(), hasta: hasta.toISOString(), ymd };
}

export function haceNDiasAR(n: number): string {
  const now = new Date();
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const hoy = new Date(`${ymd}T00:00:00${AR_OFFSET}`);
  return new Date(hoy.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
}
