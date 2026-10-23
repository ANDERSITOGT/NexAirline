import { api } from "./api";

export type ManualSeatStatus =
  | "DISPONIBLE"
  | "RESERVADO"
  | "OCUPADO"
  | "CONFIRMADO"
  | "CHECKED_IN"
  | "BLOQUEADO"
  | "RESERVADO_TEMPORAL";

export interface CheckInPayload {
  codigo_checkin: string;
}

export interface UpdateSeatStatusPayload {
  nuevo_estado: ManualSeatStatus;
  descripcion: string;
}

export interface CheckInResponse {
  mensaje?: string;
  asiento?: unknown;
}

export interface Cliente {
  id: number;
  nombre: string;
  apellido?: string;
  correo?: string;
  telefono?: string;
}

export interface MetodoPago {
  id: number;
  nombre: string;
  activo?: boolean;
}

export interface VentaMostradorPayload {
  vuelo_id: number;
  vuelo_asiento_id: number;
  cliente_id: number;
  pasajero: {
    nombre: string;
    apellido: string;
    tipo_documento: string;
    numero_documento: string;
  };
  pago: {
    metodo_pago_id: number;
    monto: number;
    referencia: string;
  };
}

export interface VentaMostradorResponse {
  numero_boleto?: string;
  codigo_checkin?: string;
  boleto?: {
    numero_boleto?: string;
    numero?: string;
    codigo_checkin?: string;
  };
  data?: {
    codigo_checkin?: string;
  };
  mensaje?: string;
}

export function processCheckIn(
  payload: CheckInPayload,
): Promise<CheckInResponse> {
  return api.post<CheckInResponse>("/checkin", payload);
}

export function updateDispatchSeatStatus(
  asientoId: number,
  payload: UpdateSeatStatusPayload,
): Promise<void> {
  return api.patch<void>(`/vuelo-asiento/${asientoId}/estado`, payload);
}

export function searchClientes(query: string): Promise<Cliente[]> {
  return api.get<Cliente[]>(`/cliente/buscar?q=${encodeURIComponent(query)}`);
}

export function createCliente(payload: {
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  contrasena: string;
}): Promise<Cliente> {
  return api.post<Cliente>("/cliente", payload);
}

export function reservarTemporal(asientoId: number): Promise<unknown> {
  return api.post<unknown>(`/vuelo-asiento/${asientoId}/reservar-temporal`, {});
}

export function liberarTemporal(asientoId: number): Promise<unknown> {
  return api.post<unknown>(`/vuelo-asiento/${asientoId}/liberar-temporal`, {});
}

export function crearVentaMostrador(
  payload: VentaMostradorPayload,
): Promise<VentaMostradorResponse> {
  return api.post<VentaMostradorResponse>("/ventas/mostrador", payload);
}
