import { api } from "./api";

export interface Plane {
  id: number;
  aerolineaId: number;
  matricula: string;
  nombre?: string;
  capacidad: number;
  activo: boolean;
}

export interface CreatePlaneDTO {
  aerolineaId: number;
  matricula: string;
  nombre?: string;
  capacidad: number;
}

export interface UpdatePlaneDTO {
  aerolineaId: number;
  matricula: string;
  nombre?: string;
  capacidad: number;
  activo: boolean;
}

export async function getPlanes(): Promise<Plane[]> {
  const planes = await api.get<Plane[]>("/avion");
  return planes ?? [];
}

export function createPlane(data: CreatePlaneDTO): Promise<Plane> {
  return api.post<Plane>("/avion", data);
}

export function updatePlane(id: number, data: UpdatePlaneDTO): Promise<Plane> {
  return api.put<Plane>(`/avion/${id}`, data);
}