import { api } from "./api";

export type DashboardFlightStatus = "PROGRAMADO" | "ABORDANDO" | "EN_VUELO" | "FINALIZADO" | "CANCELADO";

export interface DashboardFlight {
  id: number | null;
  numero_vuelo: string | null;
  fecha_salida: string | null;
  estado: DashboardFlightStatus;
  origen_iata: string | null;
  destino_iata: string | null;
  matricula: string | null;
  puerta: string | null;
}

export interface DashboardSummary {
  vuelos_activos: number;
  vuelos_abordando: number;
  vuelos_en_ruta: number;
  pasajeros_hoy: number;
  reservas_hoy: number;
  aviones_mantenimiento: number;
  total_aviones: number;
  mantenimiento_alertas: number;
  recaudacion_aprobada: number;
  proximas_salidas: DashboardFlight[];
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const numberOrZero = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const stringOrNull = (value: unknown) => typeof value === "string" && value.trim() ? value : null;

function normalizeFlight(value: unknown): DashboardFlight | null {
  const flight = asRecord(value);
  if (typeof value !== "object" || value === null) return null;
  const route = asRecord(flight.ruta);
  const origin = asRecord(flight.aeropuerto_origen);
  const destination = asRecord(flight.aeropuerto_destino);
  const routeOrigin = asRecord(route.aeropuerto_origen);
  const routeDestination = asRecord(route.aeropuerto_destino);
  const plane = asRecord(flight.avion);
  const gate = asRecord(flight.puerta_embarque);
  const status = flight.estado;

  return {
    id: typeof flight.id === "number" ? flight.id : null,
    numero_vuelo: stringOrNull(flight.numero_vuelo ?? flight.numeroVuelo),
    fecha_salida: stringOrNull(flight.fecha_salida ?? flight.fechaSalida),
    estado: status === "ABORDANDO" || status === "EN_VUELO" || status === "FINALIZADO" || status === "CANCELADO"
      ? status
      : "PROGRAMADO",
    origen_iata: stringOrNull(flight.origen_iata ?? origin.codigo_iata ?? routeOrigin.codigo_iata),
    destino_iata: stringOrNull(flight.destino_iata ?? destination.codigo_iata ?? routeDestination.codigo_iata),
    matricula: stringOrNull(flight.matricula ?? plane.matricula),
    puerta: stringOrNull(flight.puerta ?? gate.numero),
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<unknown>("/dashboard/resumen");
  const data = asRecord(asRecord(response).data ?? response);
  const rawFlights = data.proximas_salidas ?? data.vuelos_proximos;

  return {
    vuelos_activos: numberOrZero(data.vuelos_activos),
    vuelos_abordando: numberOrZero(data.vuelos_abordando),
    vuelos_en_ruta: numberOrZero(data.vuelos_en_ruta),
    pasajeros_hoy: numberOrZero(data.pasajeros_hoy),
    reservas_hoy: numberOrZero(data.reservas_hoy),
    aviones_mantenimiento: numberOrZero(data.aviones_mantenimiento ?? data.aeronaves_mantenimiento),
    total_aviones: numberOrZero(data.total_aviones ?? data.aeronaves_totales),
    mantenimiento_alertas: numberOrZero(data.mantenimiento_alertas),
    recaudacion_aprobada: numberOrZero(data.recaudacion_aprobada),
    proximas_salidas: Array.isArray(rawFlights)
      ? rawFlights.map(normalizeFlight).filter((flight): flight is DashboardFlight => flight !== null)
      : [],
  };
}
