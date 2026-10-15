import { api } from "./api";

export interface Airport {
  id: number;
  Id?: number;
  nombre: string;
  codigoIata: string;
  codigoIcao: string;
  ciudad: string;
  pais: string;
  direccion?: string;
  activo?: boolean;
}

export interface CreateAirportDTO {
  nombre: string;
  codigoIata: string;
  codigoIcao: string;
  ciudad: string;
  pais: string;
  direccion: string;
}

export type UpdateAirportDTO = Partial<CreateAirportDTO> & { activo?: boolean };

const normalizeAirport = (airport: Airport): Airport => ({
  ...airport,
  id: airport.id ?? airport.Id ?? 0,
});

export async function getAirports(): Promise<Airport[]> {
  const airports = await api.get<Airport[]>("/aeropuerto");
  return (airports ?? []).map(normalizeAirport);
}

export async function createAirport(data: CreateAirportDTO): Promise<Airport> {
  const airport = await api.post<Airport>("/aeropuerto", data);
  return normalizeAirport(airport);
}

export async function updateAirport(id: number, data: UpdateAirportDTO): Promise<Airport> {
  const airport = await api.put<Airport>(`/aeropuerto/${id}`, data);
  return normalizeAirport(airport);
}