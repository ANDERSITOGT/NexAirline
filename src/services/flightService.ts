import { api } from "./api";

export type FlightStatus = "PROGRAMADO" | "ABORDANDO" | "EN_VUELO" | "FINALIZADO" | "CANCELADO";
export interface Flight { id: number; aerolineaId: number; avionId: number; rutaId: number; puertaEmbarqueId?: number | null; numeroVuelo: string; fechaSalida: string; fechaLlegada: string; estado: FlightStatus }
export interface CreateFlightDTO { aerolineaId: number; avionId: number; rutaId: number; puertaEmbarqueId?: number | null; numeroVuelo: string; fechaSalida: string; fechaLlegada: string; estado: FlightStatus }
export type UpdateFlightDTO = CreateFlightDTO;
export async function getFlights(): Promise<Flight[]> { return (await api.get<Flight[]>("/vuelo")) ?? []; }
export function createFlight(data: CreateFlightDTO): Promise<Flight> { return api.post<Flight>("/vuelo", data); }
export function updateFlight(id: number, data: UpdateFlightDTO): Promise<Flight> { return api.put<Flight>(`/vuelo/${id}`, data); }