export type DateInput = string | Date | null | undefined;

function parseDate(value: DateInput): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const normalized = value
    .trim()
    .replace(" ", "T")
    .replace(/\.(\d{3})\d+Z$/, ".$1Z");
  if (!normalized) return null;

  // Legacy operational data has no offset and is stored in Guatemala time.
  const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const date = new Date(hasOffset ? normalized : `${normalized}-06:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatter(
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("es-MX", { ...options, timeZone });
}

export function formatDateTime(value: DateInput, timeZone: string): string {
  const date = parseDate(value);
  if (!date) return "—";

  return formatter(timeZone, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date).replace(",", "");
}

export function formatDate(value: DateInput, timeZone: string): string {
  const date = parseDate(value);
  if (!date) return "—";

  return formatter(timeZone, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatTime(value: DateInput, timeZone: string): string {
  const date = parseDate(value);
  if (!date) return "—";

  return formatter(timeZone, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatearFechaGlobal(value: DateInput, timeZone: string): string {
  return formatDateTime(value, timeZone);
}
