import { api } from "./api";

export type FlightStatus = "PROGRAMADO" | "ABORDANDO" | "EN_VUELO" | "FINALIZADO" | "CANCELADO";
export interface Flight {
  id: number;
  aerolineaId: number;
  avionId?: number;
  avion_id?: number;
  avion?: { id: number };
  rutaId: number;
  puertaEmbarqueId?: number | null;
  numeroVuelo: string;
  fechaSalida: string;
  fechaLlegada: string;
  estado: FlightStatus;
  capacidad?: number | null;
  asientosDisponibles?: number | null;
}
export interface CreateFlightDTO { aerolineaId: number; avionId: number; rutaId: number; puertaEmbarqueId?: number | null; numeroVuelo: string; fechaSalida: string; fechaLlegada: string; estado: FlightStatus }
export type UpdateFlightDTO = CreateFlightDTO;
export interface FlightsPageResponse {
  data: Flight[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
export async function getFlights(filters?: { estado?: FlightStatus; ruta_id?: number }): Promise<Flight[]> {
  const params = new URLSearchParams();
  if (filters?.estado) params.set("estado", filters.estado);
  if (filters?.ruta_id !== undefined) params.set("ruta_id", String(filters.ruta_id));
  const response = await api.get<Flight[] | FlightsPageResponse>(`/vuelo${params.size ? `?${params}` : ""}`);
  return Array.isArray(response) ? response : response.data;
}
export function getFlightsPage(page: number, limit: number): Promise<FlightsPageResponse> {
  return api.get<FlightsPageResponse>(`/vuelo?page=${page}&limit=${limit}`);
}
export function getVueloById(id: number): Promise<Flight> {
  return api.get<Flight>(`/vuelo/${id}`);
}
export function createFlight(data: CreateFlightDTO): Promise<Flight> { return api.post<Flight>("/vuelo", data); }
export function updateFlight(id: number, data: UpdateFlightDTO): Promise<Flight> { return api.put<Flight>(`/vuelo/${id}`, data); }