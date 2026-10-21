import { api } from "./api";

export type ReservationStatus =
  | "PENDIENTE"
  | "CONFIRMADA"
  | "EXPIRADA"
  | "CANCELADA"
  | string;

export interface ReservationClient {
  id?: number;
  nombre: string;
  correo?: string | null;
}

export interface ReservationFlight {
  id?: number;
  numero_vuelo?: string | null;
  numero?: string | null;
  ruta?: string | null;
  origen?: string | null;
  destino?: string | null;
}

export interface ReservationSeat {
  id?: number;
  numero?: string | null;
  nombre?: string | null;
}

export interface Boleto {
  numero_boleto?: string | null;
  numero?: string | null;
  codigo_checkin?: string | null;
  estado?: string | null;
  checked_in?: boolean;
}

export interface VueloAsiento {
  id?: number;
  asiento?: ReservationSeat | null;
  vuelo?: ReservationFlight | null;
}

export interface ReservationDetail {
  id: number;
  nombre_pasajero: string;
  apellido_pasajero?: string | null;
  tipo_documento?: string | null;
  numero_documento?: string | null;
  numeroDocumento?: string | null;
  numero_vuelo?: string;
  numeroVuelo?: string;
  ruta?: string;
  vuelo_asiento?: VueloAsiento | null;
  vueloAsiento?: VueloAsiento | null;
  boletos?: Boleto[] | null;
  precio: number;
}

export interface Reservation {
  id: number;
  cliente: ReservationClient;
  estado: ReservationStatus;
  fecha_creacion?: string | null;
  fecha_expiracion?: string | null;
  creada?: string | null;
  expira?: string | null;
  itinerario_id?: number | null;
  metodo_pago?: string | null;
  pago?: string | null;
  detalles?: ReservationDetail[] | null;
}

export interface UpdatePassengerData {
  nombre_pasajero: string;
  apellido_pasajero: string;
  tipo_documento: string;
  numero_documento: string;
}

export async function getReservations(): Promise<Reservation[]> {
  return (await api.get<Reservation[]>("/reserva")) ?? [];
}

export function cancelReservation(id: number): Promise<void> {
  return api.put<void>(`/reserva/${id}/cancelar`, {});
}

export function updatePassenger(
  detalleId: number,
  data: UpdatePassengerData,
): Promise<ReservationDetail> {
  return api.put<ReservationDetail>(`/reserva-detalle/${detalleId}`, data);
}
