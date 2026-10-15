import { api } from "./api";

export interface Airline {
  id: number;
  nombre: string;
  codigoIata: string;
  codigoIcao: string;
  pais: string;
  activo: boolean;
}

export interface CreateAirlineDTO {
  nombre: string;
  codigoIata: string;
  codigoIcao: string;
  pais: string;
}

export async function getAirlines(): Promise<Airline[]> {
  const airlines = await api.get<Airline[]>("/aerolinea");
  return airlines ?? [];
}

export function createAirline(data: CreateAirlineDTO): Promise<Airline> {
  return api.post<Airline>("/aerolinea", data);
}