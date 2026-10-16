import { api } from "./api";

export interface Seat {
  id: number;
  avionId: number;
  tipoAsientoId: number;
  numero: string;
  fila: number;
  letra: string;
  activo: boolean;
}

export interface CreateSeatDTO {
  avionId: number;
  tipoAsientoId: number;
  numero: string;
  fila: number;
  letra: string;
}

export interface UpdateSeatDTO extends CreateSeatDTO {
  activo: boolean;
}

export async function getSeats(avionId?: number): Promise<Seat[]> {
  const seats = await api.get<Seat[]>("/asiento" + (avionId ? `?avionId=${avionId}` : ""));
  return seats ?? [];
}

export function createSeat(data: CreateSeatDTO): Promise<Seat> {
  return api.post<Seat>("/asiento", data);
}

export function updateSeat(id: number, data: UpdateSeatDTO): Promise<Seat> {
  return api.put<Seat>("/asiento/" + id, data);
}