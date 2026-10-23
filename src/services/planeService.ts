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

export async function getPlaneById(id: number): Promise<Plane> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("El avión asociado al vuelo no es válido.");
  }
  const planes = await getPlanes();
  const plane = planes.find((item) => item.id === id);
  if (!plane) {
    throw new Error(`No se encontró la aeronave ${id}.`);
  }
  return plane;
}

export async function getAvailablePlanes(
  salida: string,
  llegada: string,
): Promise<Plane[]> {
  const params = new URLSearchParams({ salida, llegada });
  const planes = await api.get<Plane[]>(`/avion/disponibles?${params.toString()}`);
  return planes ?? [];
}

export function createPlane(data: CreatePlaneDTO): Promise<Plane> {
  return api.post<Plane>("/avion", data);
}

export function updatePlane(id: number, data: UpdatePlaneDTO): Promise<Plane> {
  return api.put<Plane>(`/avion/${id}`, data);
}