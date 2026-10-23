import { api } from "./api";

export interface ReasignacionMasivaRequest {
  vuelo_cancelado_id: number;
  vuelos_destino_ids: number[];
}

export interface ReasignacionIndividualRequest {
  detalle_reserva_id: number;
  vuelos_ids: number[];
}

export interface ReasignacionResponse {
  message?: string;
  reasignados?: number;
}

export function ejecutarReasignacionMasiva(
  data: ReasignacionMasivaRequest,
): Promise<ReasignacionResponse> {
  return api.post<ReasignacionResponse>("/reasignacion/masiva", data);
}

export function ejecutarReasignacionIndividual(
  data: ReasignacionIndividualRequest,
): Promise<ReasignacionResponse> {
  return api.post<ReasignacionResponse>("/reasignacion/individual", data);
}
