import { api } from "./api";

export interface Gate {
  id: number;
  sedeId: number;
  numero: string;
  descripcion?: string;
  activo: boolean;
}

export interface CreateGateDTO {
  sedeId: number;
  numero: string;
  descripcion?: string;
}

export interface UpdateGateDTO {
  sedeId: number;
  numero: string;
  descripcion?: string;
  activo: boolean;
}

export async function getGates(): Promise<Gate[]> {
  const gates = await api.get<Gate[]>("/puerta-embarque");
  return gates ?? [];
}

export function createGate(data: CreateGateDTO): Promise<Gate> {
  return api.post<Gate>("/puerta-embarque", data);
}

export function updateGate(id: number, data: UpdateGateDTO): Promise<Gate> {
  return api.put<Gate>(`/puerta-embarque/${id}`, data);
}