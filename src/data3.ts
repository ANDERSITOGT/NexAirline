import { reservas, totalOf } from "./data2";

export interface Aerolinea { id: number; nombre: string; iata: string; icao: string; pais: string; activo: boolean }
export const aerolineas: Aerolinea[] = [
  { id: 1, nombre: "airlNex", iata: "AX", icao: "ANX", pais: "Guatemala", activo: true },
  { id: 2, nombre: "AirBridge Regional", iata: "AB", icao: "ABR", pais: "Panamá", activo: true },
  { id: 3, nombre: "Pacífico Charter", iata: "PC", icao: "PCH", pais: "Costa Rica", activo: false },
];

export interface TipoAsiento { id: number; nombre: string; descripcion: string }
export const tiposAsiento: TipoAsiento[] = [
  { id: 1, nombre: "Premium", descripcion: "Asiento ampliado con embarque prioritario" },
  { id: 2, nombre: "Económico", descripcion: "Configuración estándar de cabina" },
  { id: 3, nombre: "Salida de emergencia", descripcion: "Mayor espacio para piernas; requiere pasajero apto" },
];

export type MantTipo = "PREVENTIVO" | "CORRECTIVO" | "INSPECCION";
export type MantEstado = "PROGRAMADO" | "EN_CURSO" | "COMPLETADO";
export interface Mantenimiento { id: number; avion: number; tipo: MantTipo; descripcion: string; inicio: string; fin: string; estado: MantEstado; responsable: number }
export const mantenimientos: Mantenimiento[] = [
  { id: 1, avion: 4, tipo: "CORRECTIVO", descripcion: "Reemplazo de actuador de flap izquierdo", inicio: "2026-10-13", fin: "2026-10-17", estado: "EN_CURSO", responsable: 2 },
  { id: 2, avion: 8, tipo: "PREVENTIVO", descripcion: "Check C · 6,000 horas de vuelo", inicio: "2026-10-10", fin: "2026-10-16", estado: "EN_CURSO", responsable: 2 },
  { id: 3, avion: 1, tipo: "INSPECCION", descripcion: "Inspección boroscópica de motor", inicio: "2026-10-22", fin: "2026-10-23", estado: "PROGRAMADO", responsable: 2 },
  { id: 4, avion: 6, tipo: "PREVENTIVO", descripcion: "Revisión de trenes de aterrizaje", inicio: "2026-11-02", fin: "2026-11-04", estado: "PROGRAMADO", responsable: 2 },
  { id: 5, avion: 3, tipo: "PREVENTIVO", descripcion: "Check A · 500 horas de vuelo", inicio: "2026-10-05", fin: "2026-10-06", estado: "COMPLETADO", responsable: 2 },
];

export interface MetodoPago { id: number; nombre: string; activo: boolean }
export const metodosPago: MetodoPago[] = [
  { id: 1, nombre: "Tarjeta de crédito", activo: true },
  { id: 2, nombre: "Tarjeta de débito", activo: true },
  { id: 3, nombre: "Transferencia", activo: true },
  { id: 4, nombre: "PayPal", activo: true },
  { id: 5, nombre: "Efectivo en mostrador", activo: false },
];

export interface Pago {
  id: number; reserva: number; metodo: number; monto: number; estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  referencia: string | null; fecha: string | null; creadoPor: number; eliminadoPor: number | null;
}
export const pagosSeed: Pago[] = reservas
  .filter((r) => r.pago)
  .map((r, i) => ({
    id: 7001 + i,
    reserva: r.id,
    metodo: metodosPago.find((m) => m.nombre === r.metodo)?.id ?? 1,
    monto: totalOf(r),
    estado: r.pago!,
    referencia: r.pago === "APROBADO" ? `ANX-${r.id}-${(r.id * 7) % 9000 + 1000}` : null,
    fecha: r.pago === "APROBADO" ? r.creada.replace(/:(\d\d)$/, (_, m) => `:${String((+m + 3) % 60).padStart(2, "0")}`) : null,
    creadoPor: i % 2 ? 6 : 3,
    eliminadoPor: null,
  }));

export interface Reasignacion { id: number; original: number; nuevo: number; fecha: string; motivo: string; usuario: number; pasajeros: number }
export const reasignacionesSeed: Reasignacion[] = [
  { id: 1, original: 10, nuevo: 2, fecha: "2026-10-14T20:55", motivo: "Cancelación por condiciones meteorológicas", usuario: 2, pasajeros: 112 },
  { id: 2, original: 9, nuevo: 1, fecha: "2026-10-15T07:20", motivo: "Cambio de aeronave por mantenimiento", usuario: 2, pasajeros: 64 },
  { id: 3, original: 3, nuevo: 11, fecha: "2026-10-15T09:05", motivo: "Consolidación por baja ocupación", usuario: 1, pasajeros: 38 },
];

export interface Bitacora { id: number; vuelo: string; asiento: string; anterior: string | null; nuevo: string; usuario: number | null; fecha: string; descripcion: string }
export const bitacora: Bitacora[] = [
  { id: 5012, vuelo: "AX 204", asiento: "12A", anterior: "CONFIRMADO", nuevo: "CHECKED_IN", usuario: null, fecha: "2026-10-15 12:41", descripcion: "Check-in web completado" },
  { id: 5011, vuelo: "AX 311", asiento: "3C", anterior: "DISPONIBLE", nuevo: "RESERVADO_TEMPORAL", usuario: null, fecha: "2026-10-15 09:40", descripcion: "Reserva #20480 · expira en 30 min" },
  { id: 5010, vuelo: "AX 204", asiento: "14C", anterior: "DISPONIBLE", nuevo: "BLOQUEADO", usuario: 2, fecha: "2026-10-15 09:12", descripcion: "Bloqueo operativo: reposabrazos dañado" },
  { id: 5009, vuelo: "AX 204", asiento: "14D", anterior: "DISPONIBLE", nuevo: "BLOQUEADO", usuario: 2, fecha: "2026-10-15 09:12", descripcion: "Bloqueo operativo: reposabrazos dañado" },
  { id: 5008, vuelo: "AX 623", asiento: "6A", anterior: "DISPONIBLE", nuevo: "RESERVADO_TEMPORAL", usuario: null, fecha: "2026-10-15 11:58", descripcion: "Reserva #20475" },
  { id: 5007, vuelo: "AX 072", asiento: "8D", anterior: "RESERVADO_TEMPORAL", nuevo: "DISPONIBLE", usuario: null, fecha: "2026-10-14 19:00", descripcion: "Reserva #20478 expirada, asiento liberado" },
  { id: 5006, vuelo: "AX 118", asiento: "21D", anterior: "CONFIRMADO", nuevo: "DISPONIBLE", usuario: 3, fecha: "2026-10-14 22:10", descripcion: "Boleto cancelado a solicitud del pasajero" },
  { id: 5005, vuelo: "AX 540", asiento: "2A", anterior: "CONFIRMADO", nuevo: "CHECKED_IN", usuario: null, fecha: "2026-10-15 06:20", descripcion: "Check-in en mostrador" },
  { id: 5004, vuelo: "AX 266", asiento: "1A", anterior: "DISPONIBLE", nuevo: "BLOQUEADO", usuario: 1, fecha: "2026-10-14 16:45", descripcion: "Reservado para tripulación en traslado" },
  { id: 5003, vuelo: "AX 266", asiento: "1B", anterior: "DISPONIBLE", nuevo: "BLOQUEADO", usuario: 1, fecha: "2026-10-14 16:45", descripcion: "Reservado para tripulación en traslado" },
  { id: 5002, vuelo: "AX 331", asiento: "15C", anterior: "CONFIRMADO", nuevo: "DISPONIBLE", usuario: 2, fecha: "2026-10-14 20:56", descripcion: "Vuelo cancelado: asiento liberado por reasignación" },
  { id: 5001, vuelo: "AX 128", asiento: "5F", anterior: null, nuevo: "DISPONIBLE", usuario: 2, fecha: "2026-10-12 10:00", descripcion: "Inventario generado al programar el vuelo" },
];

export const seatTypeTotals = (planeList: { capacidad: number }[]) => {
  const prem = planeList.length * 18;
  const emer = planeList.length * 12;
  const total = planeList.reduce((a, p) => a + p.capacidad, 0);
  return [prem, total - prem - emer, emer];
};
