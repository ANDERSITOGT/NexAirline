import { api } from "./api";

export interface Terminal {
  id: number;
  aeropuertoId: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface CreateTerminalDTO {
  aeropuertoId: number;
  nombre: string;
  descripcion?: string;
}

export interface UpdateTerminalDTO {
  aeropuertoId: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export async function getTerminals(): Promise<Terminal[]> {
  const terminals = await api.get<Terminal[]>("/terminal");
  return terminals ?? [];
}

export function createTerminal(data: CreateTerminalDTO): Promise<Terminal> {
  return api.post<Terminal>("/terminal", data);
}

export function updateTerminal(id: number, data: UpdateTerminalDTO): Promise<Terminal> {
  return api.put<Terminal>(`/terminal/${id}`, data);
}