import { api } from "./api";

export interface SeatType { id: number; nombre: string; descripcion?: string }
export interface CreateSeatTypeDTO { nombre: string; descripcion?: string }
export interface UpdateSeatTypeDTO { nombre: string; descripcion?: string }

export async function getSeatTypes(): Promise<SeatType[]> { return (await api.get<SeatType[]>("/tipo-asiento")) ?? []; }
export function createSeatType(data: CreateSeatTypeDTO): Promise<SeatType> { return api.post<SeatType>("/tipo-asiento", data); }
export function updateSeatType(id: number, data: UpdateSeatTypeDTO): Promise<SeatType> { return api.put<SeatType>(`/tipo-asiento/${id}`, data); }