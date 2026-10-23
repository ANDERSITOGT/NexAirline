export function formatearFechaGlobal(
  fechaISO: string,
  timeZone: string,
): string {
  const date = new Date(fechaISO);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(date);
}
