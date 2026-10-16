import { api } from "./api";

export interface Route { id: number; aeropuertoOrigenId: number; aeropuertoDestinoId: number; duracionEstimada: number; distancia?: number; activa: boolean }
export interface CreateRouteDTO { aeropuertoOrigenId: number; aeropuertoDestinoId: number; duracionEstimada: number; distancia?: number }
export interface UpdateRouteDTO { aeropuertoOrigenId: number; aeropuertoDestinoId: number; duracionEstimada: number; distancia?: number; activa: boolean }
export async function getRoutes(): Promise<Route[]> { return (await api.get<Route[]>("/ruta")) ?? []; }
export function createRoute(data: CreateRouteDTO): Promise<Route> { return api.post<Route>("/ruta", data); }
export function updateRoute(id: number, data: UpdateRouteDTO): Promise<Route> { return api.put<Route>(`/ruta/${id}`, data); }